# Token Expiry Handling

## Overview
This document describes how token expiry and refresh is handled in the application.

## Backend Implementation

### Token Generation
- **Access Token:** Expires in 10 days
- **Refresh Token:** Expires in 10 days
- Both tokens are generated during login and stored in the database

### Refresh Token Endpoint
- **Endpoint:** `POST /api/auth/refresh`
- **Request Body:** `{ refreshToken: "..." }`
- **Response:** 
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "new_access_token",
      "refreshToken": "new_refresh_token"
    }
  }
  ```

### Token Validation
- Access tokens are validated on every protected route via `authMiddleware`
- Refresh tokens are validated when refreshing access tokens
- Invalid or expired tokens return 401 Unauthorized

## Frontend Implementation

### Token Storage
- **Access Token:** Stored in `localStorage` as `auth_token`
- **Refresh Token:** Stored in `localStorage` as `auth_refresh_token`
- **User Data:** Stored in `localStorage` as `auth_user`

### Automatic Token Refresh
When a request returns 401 (Unauthorized):

1. **Check if refresh token exists**
   - If no refresh token, clear auth and redirect to login

2. **Attempt to refresh access token**
   - Call `/api/auth/refresh` with refresh token
   - If successful, update access token and retry original request
   - If failed, clear auth and redirect to login

3. **Queue concurrent requests**
   - If multiple requests fail with 401 simultaneously, queue them
   - After token refresh, retry all queued requests with new token

### Error Handling

#### 401 Errors
- **Auth endpoints** (`/auth/login`, `/auth/refresh`): Don't attempt refresh
- **Token verification** (`/auth/me`): Don't redirect, let AuthContext handle
- **Other endpoints**: Attempt refresh, then redirect if refresh fails

#### Redirect Logic
- **Student routes** (`/dashboard/*`): Redirect to `/student/login`
- **Admin routes** (`/admin/*`): Redirect to `/login`
- **Other routes**: Redirect to `/login`

## Flow Diagram

```
Request → 401 Error?
    ↓ Yes
Check refresh token exists?
    ↓ Yes
Call /api/auth/refresh
    ↓ Success
Update access token
Retry original request
    ↓ Success
Return response
    ↓ Fail
Clear auth data
Redirect to login
```

## Security Considerations

1. **Token Rotation:** Refresh tokens are rotated on each refresh
2. **Token Blacklist:** Revoked tokens are stored in blacklist
3. **Automatic Cleanup:** Expired tokens are automatically rejected
4. **Single Refresh:** Only one refresh attempt per token expiry

## Testing

### Test Token Expiry
1. Wait for token to expire (or manually expire it)
2. Make any API request
3. Should automatically refresh and retry

### Test Invalid Refresh Token
1. Clear or invalidate refresh token
2. Make any API request
3. Should redirect to login page

### Test Concurrent Requests
1. Open multiple tabs
2. Let token expire
3. Make requests from all tabs simultaneously
4. All should be queued and retried after refresh

## Files Modified

### Backend
- `Backend/src/controllers/authController.js`: Updated refresh token endpoint to return new refresh token

### Frontend
- `Frontend/src/lib/api.js`: Added automatic token refresh on 401 errors
- `Frontend/src/contexts/AuthContext.jsx`: Added refresh token storage and refresh function

## Best Practices

1. **Always store refresh token** during login
2. **Clear all tokens** on logout
3. **Handle refresh errors gracefully** - redirect to login
4. **Queue concurrent requests** to prevent multiple refresh attempts
5. **Don't refresh on auth endpoints** - let them fail naturally








