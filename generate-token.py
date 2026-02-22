#!/usr/bin/env python3
"""
Generate a valid JWT token for testing the Notification Engine API.
This token is signed with the secret from docker-compose.yml
"""

import jwt
import json
from datetime import datetime, timedelta

# Secret from docker-compose.yml
SECRET = "super-secret-key-change-in-production"

# Create payload
payload = {
    "sub": "user123",
    "email": "user@example.com",
    "iat": int(datetime.now().timestamp()),
    "exp": int((datetime.now() + timedelta(days=365)).timestamp())
}

# Create token
token = jwt.encode(payload, SECRET, algorithm="HS256")

print("\n" + "="*50)
print("VALID JWT TOKEN FOR TESTING")
print("="*50)
print(f"\nToken:\n{token}\n")
print("Payload:")
print(json.dumps(payload, indent=2))
print("\n" + "="*50 + "\n")

# Usage instructions
print("USAGE INSTRUCTIONS:\n")
print("1. PowerShell:")
print(f'   $token = "{token}"')
print('   $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }')
print("   Invoke-WebRequest http://localhost:3000/notifications/health -Headers $headers")
print("\n2. Linux/Mac (curl):")
print(f'   curl -H "Authorization: Bearer {token}" http://localhost:3000/notifications/health')
print("\n3. Update simple-test.ps1:")
print(f'   Change line: [string]$Token = "{token}"')
print("\n" + "="*50 + "\n")
