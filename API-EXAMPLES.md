/**
 * API Usage Examples and Integration Guide
 * 
 * This file demonstrates how to use the Resilient Notification Engine
 * in various scenarios and with different clients.
 */

// ============================================================================
// 1. BASIC SETUP - Server Side (NestJS)
// ============================================================================

// In your NestJS module where you need to send notifications:
import { Injectable } from '@nestjs/common';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationType } from '@/shared/types';

@Injectable()
export class OrderService {
  constructor(private notificationsService: NotificationsService) {}

  async completeOrder(orderId: string, userId: string) {
    // ... complete order logic ...

    // Send notification
    await this.notificationsService.sendNotification({
      recipientId: userId,
      title: 'Order Completed',
      message: `Your order #${orderId} has been completed`,
      type: NotificationType.INFO,
      senderId: 'system',
      data: {
        orderId,
        timestamp: new Date().toISOString(),
      },
      expiresIn: 604800, // 7 days
    });
  }
}

// ============================================================================
// 2. CLIENT SIDE - JavaScript/TypeScript
// ============================================================================

// Installation:
// npm install socket.io-client axios

// ============================================================================
// 2.1 WebSocket Client Example
// ============================================================================

import io from 'socket.io-client';

class NotificationClient {
  private socket: ReturnType<typeof io>;
  private jwtToken: string;

  constructor(serverUrl: string, jwtToken: string) {
    this.jwtToken = jwtToken;
    this.socket = io(`${serverUrl}/notifications`, {
      auth: {
        token: `Bearer ${jwtToken}`,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  private setupListeners() {
    // Connection established
    this.socket.on('connected', (data) => {
      console.log('✅ Connected to notification service', data);
    });

    // Receive notification
    this.socket.on('notification:received', (notification) => {
      console.log('📬 New notification received:', notification);
      this.handleNewNotification(notification);
    });

    // Catch-up delivery complete
    this.socket.on('notifications:catch-up-complete', (data) => {
      console.log(`✅ Catch-up complete: ${data.count} notifications delivered`);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    // Disconnection
    this.socket.on('disconnect', () => {
      console.warn('⚠️ Disconnected from notification service');
    });

    // Reconnection
    this.socket.on('reconnect', () => {
      console.log('🔄 Reconnected to notification service');
    });

    // Pong response (heartbeat)
    this.socket.on('pong', () => {
      console.log('💓 Heartbeat OK');
    });
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    this.socket.emit('notification:read', { notificationId });

    this.socket.once('notification:read-acknowledged', (data) => {
      console.log('✅ Notification marked as read:', data.notificationId);
    });
  }

  // Get notification history
  async getHistory(limit: number = 20, offset: number = 0): Promise<any> {
    return new Promise((resolve) => {
      this.socket.emit('notification:history', { limit, offset });
      this.socket.once('notification:history', (data) => {
        console.log('📋 Retrieved history:', data);
        resolve(data);
      });
    });
  }

  // Health check (keep connection alive)
  ping(): void {
    this.socket.emit('ping');
  }

  // Handle new notification
  private handleNewNotification(notification: any): void {
    // Show toast/alert to user
    console.log(`🔔 ${notification.title}: ${notification.message}`);

    // Auto-read after 10 seconds
    setTimeout(() => {
      this.markAsRead(notification.id);
    }, 10000);
  }

  // Cleanup
  disconnect(): void {
    this.socket.disconnect();
  }
}

// ============================================================================
// 2.2 REST API Client Example
// ============================================================================

import axios, { AxiosInstance } from 'axios';

class NotificationAPIClient {
  private axios: AxiosInstance;

  constructor(baseUrl: string, jwtToken: string) {
    this.axios = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Send single notification
  async sendNotification(data: {
    recipientId: string;
    title: string;
    message: string;
    type: string;
    senderId?: string;
    data?: Record<string, any>;
    expiresIn?: number;
  }) {
    try {
      const response = await this.axios.post('/notifications/send', data);
      console.log('✅ Notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      throw error;
    }
  }

  // Send batch notifications
  async sendBatchNotifications(data: {
    recipientIds: string[];
    title: string;
    message: string;
    type: string;
  }) {
    try {
      const response = await this.axios.post('/notifications/send/batch', data);
      console.log('✅ Batch notifications sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending batch notifications:', error);
      throw error;
    }
  }

  // Get pending notifications
  async getPendingNotifications() {
    try {
      const response = await this.axios.get('/notifications/pending');
      console.log('📬 Pending notifications:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching pending notifications:', error);
      throw error;
    }
  }

  // Get notification history
  async getHistory(limit: number = 20, offset: number = 0) {
    try {
      const response = await this.axios.get('/notifications/history', {
        params: { limit, offset },
      });
      console.log('📋 Notification history:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching history:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const response = await this.axios.post(
        `/notifications/${notificationId}/read`,
      );
      console.log('✅ Notification marked as read');
      return response.data;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.axios.get('/notifications/health');
      console.log('✅ Service is healthy:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// 3. COMPLETE INTEGRATION EXAMPLE
// ============================================================================

class NotificationManager {
  private apiClient: NotificationAPIClient;
  private wsClient: NotificationClient;

  constructor(baseUrl: string, jwtToken: string) {
    this.apiClient = new NotificationAPIClient(baseUrl, jwtToken);
    this.wsClient = new NotificationClient(baseUrl, jwtToken);
  }

  // Send notification and monitor delivery
  async sendAndMonitor(data: any): Promise<void> {
    // Send via REST API
    const result = await this.apiClient.sendNotification(data);

    console.log(`📊 Delivery Status:
      Total: ${result.total}
      Delivered: ${result.delivered}
      Queued: ${result.queued}
      Failed: ${result.failed}
    `);
  }

  // Send batch and wait for confirmation
  async sendBatchAndMonitor(
    recipientIds: string[],
    title: string,
    message: string,
  ): Promise<void> {
    const result = await this.apiClient.sendBatchNotifications({
      recipientIds,
      title,
      message,
      type: 'SYSTEM',
    });

    console.log(`📊 Batch Delivery Status:
      Total: ${result.total}
      Delivered: ${result.delivered}
      Queued: ${result.queued}
      Failed: ${result.failed}
    `);
  }

  // Get all notifications (pending + history)
  async getAllNotifications(): Promise<void> {
    const pending = await this.apiClient.getPendingNotifications();
    const history = await this.apiClient.getHistory();

    console.log(`📬 Total Notifications:
      Pending: ${pending.count}
      History: ${history.total}
    `);
  }

  // Setup automatic health checks
  setupHealthCheck(intervalMs: number = 30000): void {
    setInterval(() => {
      this.apiClient.healthCheck();
      this.wsClient.ping();
    }, intervalMs);
  }

  // Cleanup
  disconnect(): void {
    this.wsClient.disconnect();
  }
}

// ============================================================================
// 4. USAGE IN REACT COMPONENT
// ============================================================================

/*
import React, { useEffect, useState } from 'react';
import { NotificationManager } from './notification-manager';

const NotificationWidget: React.FC<{ jwtToken: string }> = ({ jwtToken }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [manager, setManager] = useState<NotificationManager | null>(null);

  useEffect(() => {
    // Initialize manager
    const mgr = new NotificationManager('http://localhost:3000', jwtToken);
    setManager(mgr);

    // Setup health checks
    mgr.setupHealthCheck();

    // Fetch initial notifications
    mgr.getAllNotifications();

    return () => {
      mgr.disconnect();
    };
  }, [jwtToken]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (manager) {
      await manager.apiClient.markAsRead(notificationId);
      // Remove from UI
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId),
      );
    }
  };

  return (
    <div className="notification-widget">
      <h3>Notifications ({notifications.length})</h3>
      {notifications.map((notification) => (
        <div key={notification.id} className="notification-item">
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <button onClick={() => handleMarkAsRead(notification.id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationWidget;
*/

// ============================================================================
// 5. BASH/CURL EXAMPLES
// ============================================================================

/*
# Prerequisites
export JWT_TOKEN="your-jwt-token"
export BASE_URL="http://localhost:3000"

# Health Check
curl ${BASE_URL}/notifications/health

# Send Notification
curl -X POST ${BASE_URL}/notifications/send \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user-123",
    "title": "Welcome",
    "message": "Welcome to our service!",
    "type": "SYSTEM",
    "data": {
      "onboardingStep": 1
    }
  }'

# Send Batch Notifications
curl -X POST ${BASE_URL}/notifications/send/batch \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientIds": ["user-1", "user-2", "user-3"],
    "title": "Maintenance Notice",
    "message": "Server maintenance scheduled for tonight",
    "type": "ALERT"
  }'

# Get Pending Notifications
curl -X GET ${BASE_URL}/notifications/pending \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Get History
curl -X GET "${BASE_URL}/notifications/history?limit=20&offset=0" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Mark as Read
curl -X POST ${BASE_URL}/notifications/notif-123/read \
  -H "Authorization: Bearer ${JWT_TOKEN}"
*/

// ============================================================================
// 6. TESTING WITH POSTMAN
// ============================================================================

/*
Import this collection into Postman:

{
  "info": {
    "name": "Notification Engine API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/notifications/health"
      }
    },
    {
      "name": "Send Notification",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "url": "{{baseUrl}}/notifications/send",
        "body": {
          "mode": "raw",
          "raw": "json"
        }
      }
    }
  ]
}

Set variables:
- baseUrl: http://localhost:3000
- jwtToken: your-jwt-token
*/

export { NotificationClient, NotificationAPIClient, NotificationManager };
