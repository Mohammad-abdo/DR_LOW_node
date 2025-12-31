# Token Expiration Update - 30 Days

## Changes Made

### Backend Token Expiration

**File:** `Backend/src/utils/jwt.js`

- **Access Token:** Changed from `10d` (10 days) to `30d` (30 days)
- **Refresh Token:** Changed from `10d` (10 days) to `30d` (30 days)
- **Video Token:** Changed from `1 hour` to `30 days` (same as access token)

### Configuration

Tokens now expire after **30 days** by default. You can override this by setting environment variables:

```env
# In Backend/.env
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=30d
```

### Frontend Improvements

**File:** `Frontend/src/lib/api.js`

- Improved 401 error handling
- Only clears tokens when actually expired (not on verification failures)
- Prevents unnecessary logouts

## Token Expiration Details

### Access Token
- **Default:** 30 days
- **Environment Variable:** `JWT_EXPIRES_IN`
- **Format:** JWT with `exp` claim

### Refresh Token
- **Default:** 30 days
- **Environment Variable:** `JWT_REFRESH_EXPIRES_IN`
- **Format:** JWT with `exp` claim

### Video Streaming Token
- **Default:** 30 days (same as access token)
- **Format:** JWT with `exp` claim
- **Type:** `video_stream`

## Testing

1. **Login** - Get new tokens
2. **Check Token Expiration:**
   ```javascript
   const token = localStorage.getItem("auth_token");
   const decoded = JSON.parse(atob(token.split('.')[1]));
   console.log("Token expires:", new Date(decoded.exp * 1000));
   ```
3. **Verify:** Token should expire 30 days from login

## Important Notes

- **All tokens** (access, refresh, video) now expire after **30 days**
- Users will remain logged in for **30 days** without needing to re-login
- Tokens are stored in `localStorage` and persist across browser sessions
- If you need to force logout, use the logout endpoint or clear `localStorage`

## Migration

No database migration needed. This is a code-only change.

To apply:
1. Restart the backend server
2. Users need to login again to get new 30-day tokens
3. Existing tokens will keep their original expiration (10 days or whatever was set)

## Security Considerations

- 30 days is a long expiration time
- Consider implementing:
  - Token refresh mechanism
  - Activity-based token extension
  - Optional "Remember Me" with longer expiration
  - Session timeout for inactive users

















