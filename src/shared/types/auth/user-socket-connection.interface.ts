export interface UserSocketConnection {
    userId: string;
    socketId: string;
    connectedAt: number;
    isActive: boolean;
}
