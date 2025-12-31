# Mobile Image URLs Configuration

## Overview
The backend automatically detects your local IP address and uses it for image and video URLs in mobile API responses. This allows mobile devices on the same WiFi network to access media files.

## How It Works

### Automatic IP Detection
The system automatically detects your local network IP address (e.g., `192.168.1.100`) and uses it instead of `localhost` for image/video URLs.

**Example:**
- Instead of: `http://localhost:5005/uploads/banners/image.jpg`
- Returns: `http://192.168.1.100:5005/uploads/banners/image.jpg`

### Environment Variables (Optional)
You can override the automatic IP detection by setting one of these environment variables in your `.env` file:

```env
# Option 1: Use specific IP address
API_BASE_URL=http://192.168.1.100:5005

# Option 2: Use domain name
API_BASE_URL=https://api.yourdomain.com

# Option 3: Use localhost (not recommended for mobile)
API_BASE_URL=http://localhost:5005
```

## Configuration

### Default Behavior
- **Automatic IP Detection**: Enabled by default
- **Port**: Uses `PORT` from `.env` or defaults to `5005`
- **Protocol**: Uses `http://` (for local development)

### Manual Configuration
1. Create or edit `.env` file in the `Backend` directory
2. Add your preferred base URL:
   ```env
   API_BASE_URL=http://192.168.1.100:5005
   ```
3. Restart the server

## Testing

### Check Your Local IP
When you start the server, it will display your local IP:
```
🚀 Server running on port 5005
📱 Local access: http://localhost:5005
🌐 Network access: http://192.168.1.100:5005
```

### Test from Mobile Device
1. Ensure your mobile device is on the same WiFi network
2. Use the IP address shown in the server logs
3. Test an API endpoint that returns images:
   ```
   GET http://192.168.1.100:5005/api/mobile/student/home
   ```
4. Verify that image URLs use the IP address instead of `localhost`

## Troubleshooting

### Images Not Loading on Mobile
1. **Check Firewall**: Ensure port 5005 is open in your firewall
2. **Verify IP**: Make sure the IP address is correct (check server logs)
3. **Network**: Ensure mobile device is on the same WiFi network
4. **HTTPS**: If using HTTPS, update `API_BASE_URL` to use `https://`

### Using Different IP
If you have multiple network interfaces, the system will use the first non-loopback IPv4 address found. To use a specific IP:
1. Set `API_BASE_URL` in `.env` with your desired IP
2. Restart the server

## Files Modified
- `Backend/src/utils/imageHelper.js`: Updated to use local IP address automatically

## Notes
- The IP detection runs once when the module is loaded
- If no network interface is found, it falls back to `localhost`
- For production, always set `API_BASE_URL` to your production domain




























