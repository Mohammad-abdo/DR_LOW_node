# Token Expiry Update - 10 Days

## Overview
Access tokens and refresh tokens for both admin and student users are now set to expire after 10 days.

## Configuration

### Access Token
- **Default Expiry:** 10 days (`10d`)
- **Environment Variable:** `JWT_EXPIRES_IN`
- **Location:** `Backend/src/utils/jwt.js`

### Refresh Token
- **Default Expiry:** 10 days (`10d`)
- **Environment Variable:** `JWT_REFRESH_EXPIRES_IN`
- **Location:** `Backend/src/utils/jwt.js`

## How It Works

### Default Behavior
- If `JWT_EXPIRES_IN` is not set in `.env`, tokens expire after **10 days**
- If `JWT_REFRESH_EXPIRES_IN` is not set in `.env`, refresh tokens expire after **10 days**

### Custom Configuration
You can override the default by setting environment variables in your `.env` file:

```env
# Access token expiry (default: 10d)
JWT_EXPIRES_IN=10d

# Refresh token expiry (default: 10d)
JWT_REFRESH_EXPIRES_IN=10d
```

## Token Format
- **Access Token:** Used for API authentication
- **Refresh Token:** Used to get a new access token when it expires

## Applies To
- ✅ Admin users
- ✅ Student users
- ✅ Teacher users (if applicable)

## Notes
- Tokens are generated during login
- Both access and refresh tokens now have the same expiry time (10 days)
- Users will need to log in again after 10 days
- The expiry time applies to all roles (admin, student, teacher)

## Files Modified
- `Backend/src/utils/jwt.js`: Updated default expiry times





























