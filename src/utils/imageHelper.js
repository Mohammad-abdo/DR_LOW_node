import os from 'os';

/**
 * Get local IP address for network access
 * @returns {string} Local IP address or 'localhost' if not found
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

/**
 * Convert relative image path to full URL
 * @param {string} imagePath - Relative path like "/uploads/banners/image.jpg"
 * @returns {string} Full URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is (but check if it's an IP address and convert it)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // If URL contains IP address, replace it with domain
    const ipPattern = /https?:\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?/;
    if (ipPattern.test(imagePath)) {
      // Extract the path after IP
      const urlMatch = imagePath.match(/https?:\/\/[^\/]+(\/.*)?$/);
      const pathPart = urlMatch ? (urlMatch[1] || '/') : imagePath;
      
      // Get base URL with domain
      let baseUrl;
      if (process.env.API_BASE_URL) {
        baseUrl = process.env.API_BASE_URL;
      } else if (process.env.BACKEND_URL) {
        baseUrl = process.env.BACKEND_URL;
      } else {
        baseUrl = 'https://dr-law.developteam.site';
      }
      baseUrl = baseUrl.replace(/\/+$/, '');
      
      return `${baseUrl}${pathPart}`;
    }
    return imagePath;
  }
  
  // Get base URL from environment or use domain name
  let baseUrl;
  
  // Priority: API_BASE_URL > BACKEND_URL > Default domain
  if (process.env.API_BASE_URL) {
    baseUrl = process.env.API_BASE_URL;
    // If API_BASE_URL contains IP address, replace with domain
    const urlWithoutProtocol = baseUrl.replace(/https?:\/\//, '');
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlWithoutProtocol)) {
      console.warn(`⚠️ API_BASE_URL contains IP address (${baseUrl}), using domain instead`);
      baseUrl = 'https://dr-law.developteam.site';
    }
  } else if (process.env.BACKEND_URL) {
    baseUrl = process.env.BACKEND_URL;
    // If BACKEND_URL contains IP address, replace with domain
    const urlWithoutProtocol = baseUrl.replace(/https?:\/\//, '');
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlWithoutProtocol)) {
      console.warn(`⚠️ BACKEND_URL contains IP address (${baseUrl}), using domain instead`);
      baseUrl = 'https://dr-law.developteam.site';
    }
  } else {
    // Default to production domain (dr-law.developteam.site)
    baseUrl = 'https://dr-law.developteam.site';
  }
  
  // Log the base URL being used (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 getImageUrl using baseUrl: ${baseUrl}`);
  }
  
  // Remove trailing slash if present
  baseUrl = baseUrl.replace(/\/+$/, '');
  
  // Clean the path - ensure it starts with /
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Ensure the path doesn't have double slashes
  const finalPath = cleanPath.replace(/\/+/g, '/');
  
  return `${baseUrl}${finalPath}`;
};

/**
 * Convert multiple image and video paths to full URLs
 * @param {object} data - Object containing image/video fields
 * @param {string[]} imageFields - Array of field names that contain images/videos
 * @returns {object} Object with converted URLs
 */
export const convertImageUrls = (data, imageFields = ['image', 'coverImage', 'avatar', 'videoUrl', 'fileUrl']) => {
  if (!data) return data;
  
  try {
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => {
        try {
          return convertImageUrls(item, imageFields);
        } catch (err) {
          console.warn('Error converting image URLs in array item:', err);
          return item;
        }
      });
    }
    
    // Handle objects
    if (typeof data === 'object' && data !== null) {
      const converted = { ...data };
      
      // Convert direct fields
      imageFields.forEach(field => {
        try {
          if (converted[field] && typeof converted[field] === 'string') {
            converted[field] = getImageUrl(converted[field]);
          }
        } catch (err) {
          console.warn(`Error converting ${field}:`, err);
        }
      });
      
      // Recursively convert nested objects (like teacher.avatar, category.image, content.videoUrl)
      Object.keys(converted).forEach(key => {
        try {
          if (typeof converted[key] === 'object' && converted[key] !== null) {
            // Skip certain types that shouldn't be converted
            if (converted[key] instanceof Date || converted[key] instanceof RegExp) {
              return;
            }
            
            if (Array.isArray(converted[key])) {
              converted[key] = convertImageUrls(converted[key], imageFields);
            } else {
              // Recursively convert nested object
              converted[key] = convertImageUrls(converted[key], imageFields);
            }
          }
        } catch (err) {
          console.warn(`Error converting nested object ${key}:`, err);
          // Keep original value on error
        }
      });
      
      return converted;
    }
    
    return data;
  } catch (error) {
    console.error('Error in convertImageUrls:', error);
    return data; // Return original data on error
  }
};

