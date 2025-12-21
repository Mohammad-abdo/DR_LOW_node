# Request Protection & Rate Limiting

## Overview
This document describes the request protection mechanisms implemented to prevent infinite loops, duplicate requests, and protect the backend from abuse.

## Backend Protection

### 1. Rate Limiting (`express-rate-limit`)

#### General API Limiter
- **Limit:** 100 requests per 15 minutes per IP
- **Applied to:** All `/api/*` routes
- **Purpose:** Prevent API abuse

#### Authentication Limiter
- **Limit:** 5 login attempts per 15 minutes per IP
- **Applied to:** `/api/auth/*` routes
- **Purpose:** Prevent brute force attacks
- **Note:** Successful requests are not counted

#### Password Reset Limiter
- **Limit:** 3 attempts per hour per IP
- **Applied to:** Password reset endpoints
- **Purpose:** Prevent password reset abuse

#### File Upload Limiter
- **Limit:** 10 uploads per hour per IP
- **Applied to:** File upload endpoints
- **Purpose:** Prevent storage abuse

#### Report Generation Limiter
- **Limit:** 5 reports per hour per IP
- **Applied to:** Report generation endpoints
- **Purpose:** Prevent resource-intensive operations

#### Notification Limiter
- **Limit:** 20 requests per minute per IP
- **Applied to:** `/api/notifications/*` routes
- **Purpose:** Prevent excessive polling

### 2. Request Guards (`requestGuard.js`)

#### Duplicate Request Guard
- **Window:** 2 seconds
- **Purpose:** Prevent duplicate requests within 2 seconds
- **Response:** 429 Too Many Requests with retry-after header

#### Rate Limit Guard
- **Limit:** 50 requests per second per IP
- **Purpose:** Prevent request flooding
- **Response:** 429 Too Many Requests

#### Request Size Guard
- **Limit:** 10MB for non-upload requests
- **Purpose:** Prevent extremely large requests
- **Response:** 413 Payload Too Large

#### Request Timeout Guard
- **Timeout:** 30 seconds
- **Purpose:** Prevent hanging requests
- **Response:** 408 Request Timeout

## Frontend Protection

### 1. Request Deduplication (`requestGuard.js`)

#### Duplicate Request Prevention
- **Window:** 2 seconds
- **Purpose:** Prevent duplicate API calls (especially in useEffect loops)
- **Behavior:** Returns the same promise if a duplicate request is detected

#### Request Retry with Exponential Backoff
- **Max Retries:** 3
- **Backoff:** 1s, 2s, 4s
- **Purpose:** Handle transient network errors
- **Note:** Does not retry on 4xx errors (client errors)

#### Request Timeout
- **Timeout:** 30 seconds
- **Purpose:** Prevent hanging requests
- **Behavior:** Rejects with timeout error after 30 seconds

### 2. useEffect Loop Prevention

#### NotificationsDropdown
- **Fixed:** Added `isMounted` flag to prevent state updates after unmount
- **Fixed:** Increased polling interval from 50s to 30s
- **Fixed:** Proper cleanup of intervals

#### AllCourses
- **Fixed:** Added debouncing (500ms) to prevent rapid-fire requests
- **Fixed:** Added `isMounted` flag to prevent state updates after unmount
- **Fixed:** Proper cleanup of timeouts

## Installation

### Backend
```bash
cd Backend
npm install express-rate-limit
```

### Frontend
No additional installation needed - request guards are built-in.

## Configuration

### Environment Variables (Backend)
You can customize rate limits by modifying `Backend/src/middlewares/rateLimiter.js`:

```javascript
// Example: Increase general API limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Increased from 100
  // ...
});
```

### Frontend Configuration
You can customize request guards in `Frontend/src/lib/requestGuard.js`:

```javascript
// Example: Increase deduplication window
const REQUEST_DEDUP_WINDOW = 3000; // 3 seconds instead of 2
```

## Monitoring

### Backend Logs
The request guards log warnings when limits are exceeded:
```
⚠️ Duplicate request detected: GET /api/courses from 192.168.1.1
⚠️ Rate limit exceeded for IP: 192.168.1.1 - 51 requests in 1 second
⚠️ Request timeout: POST /api/upload from 192.168.1.1
```

### Frontend Console
The request guards log deduplication and retry attempts:
```
🔄 Deduplicating request: /api/courses
🔄 Retrying request (attempt 1/3) after 1000ms: /api/courses
```

## Best Practices

1. **Use Debouncing:** Always debounce search inputs and filters
2. **Cleanup Effects:** Always cleanup intervals and timeouts in useEffect
3. **Check Mounted State:** Use `isMounted` flag to prevent state updates after unmount
4. **Handle Errors:** Always handle API errors gracefully
5. **Avoid Rapid Polling:** Use reasonable intervals (30s+) for polling
6. **Use Request Deduplication:** Especially for GET requests in useEffect

## Testing

### Test Rate Limiting
```bash
# Test general API limiter (should fail after 100 requests)
for i in {1..101}; do curl http://localhost:5005/api/health; done

# Test auth limiter (should fail after 5 attempts)
for i in {1..6}; do curl -X POST http://localhost:5005/api/auth/login -d '{"email":"test","password":"test"}'; done
```

### Test Request Deduplication
Open browser console and trigger the same API call multiple times quickly - you should see deduplication logs.

## Troubleshooting

### Issue: Too many 429 errors
**Solution:** Increase rate limits in `rateLimiter.js` or reduce request frequency in frontend

### Issue: Requests still duplicating
**Solution:** Check that request deduplication is applied in `api.js` interceptors

### Issue: useEffect still causing loops
**Solution:** 
1. Check dependencies array
2. Add `isMounted` flag
3. Add debouncing for rapid changes
4. Ensure proper cleanup

## Files Modified

### Backend
- `Backend/src/middlewares/rateLimiter.js` (new)
- `Backend/src/middlewares/requestGuard.js` (new)
- `Backend/src/server.js` (updated)
- `Backend/package.json` (updated)

### Frontend
- `Frontend/src/lib/requestGuard.js` (new)
- `Frontend/src/lib/api.js` (updated)
- `Frontend/src/components/NotificationsDropdown.jsx` (updated)
- `Frontend/src/pages/student/AllCourses.jsx` (updated)




















