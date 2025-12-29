# إصلاح مشكلة CORS للملفات الثابتة / CORS Fix for Static Files

## المشكلة / Problem

عند محاولة الوصول للفيديوهات والصور من `https://dr-law.site` إلى `https://dr-law.developteam.site/uploads/`، تظهر أخطاء:
- `Access to video at '...' from origin '...' has been blocked by CORS policy`
- `GET ... net::ERR_FAILED 404 (Not Found)`

## الحل / Solution

تم إصلاح المشكلة من خلال:

### 1. إضافة CORS Headers للملفات الثابتة في Backend

تم تعديل `Backend/src/server.js` لإضافة:
- CORS headers في `setHeaders` للملفات الثابتة
- معالج OPTIONS requests للـ preflight requests
- إضافة `dr-law.site` إلى allowed origins

### 2. إعداد Apache .htaccess

تم إنشاء ملف `.htaccess` في `Backend/uploads/.htaccess` لإضافة CORS headers على مستوى Apache.

**⚠️ مهم:** يجب نسخ هذا الملف إلى الخادم في مجلد `uploads`:

```bash
# على الخادم
cd /var/www/dr-law.development.site/Backend/uploads
# أو المسار الصحيح لمجلد uploads
```

### 3. إعداد Nginx (إذا كان الخادم يستخدم Nginx)

إذا كان الخادم يستخدم Nginx بدلاً من Apache، أضف التالي إلى إعدادات Nginx:

```nginx
location /uploads/ {
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '$http_origin' always;
    add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Range, Content-Type' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Range, Content-Length, Accept-Ranges' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Max-Age' '86400' always;
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, HEAD, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Range, Content-Type' always;
        add_header 'Access-Control-Max-Age' '86400' always;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    # Video streaming support
    add_header Accept-Ranges bytes;
    
    # Cache control
    location ~* \.(mp4|webm|avi|mov|wmv|flv)$ {
        add_header Cache-Control "public, max-age=31536000";
    }
    
    location ~* \.(jpg|jpeg|png|gif|webp|svg)$ {
        add_header Cache-Control "public, max-age=31536000";
    }
    
    # Serve files
    alias /path/to/Backend/uploads/;
    try_files $uri =404;
}
```

### 4. التحقق من الملفات

تأكد من أن الملفات موجودة فعلياً على الخادم:

```bash
# تحقق من وجود ملف فيديو
ls -la /path/to/Backend/uploads/videos/video-*.mp4

# تحقق من الصلاحيات
chmod -R 755 /path/to/Backend/uploads/
chown -R www-data:www-data /path/to/Backend/uploads/
```

### 5. إعادة تشغيل الخادم

بعد التعديلات:

```bash
# إذا كان يستخدم PM2
pm2 restart all

# أو إعادة تشغيل Apache
sudo systemctl restart apache2

# أو إعادة تشغيل Nginx
sudo systemctl restart nginx
```

## الاختبار / Testing

### اختبار CORS من المتصفح:

افتح Console في المتصفح وجرب:

```javascript
fetch('https://dr-law.developteam.site/uploads/videos/video-1767002006095-142012293.mp4', {
  method: 'HEAD',
  headers: {
    'Origin': 'https://dr-law.site'
  }
})
.then(res => {
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': res.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': res.headers.get('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Credentials': res.headers.get('Access-Control-Allow-Credentials')
  });
})
.catch(err => console.error('Error:', err));
```

### اختبار من Terminal:

```bash
# اختبار CORS headers
curl -I -H "Origin: https://dr-law.site" \
  https://dr-law.developteam.site/uploads/videos/video-1767002006095-142012293.mp4

# يجب أن ترى:
# Access-Control-Allow-Origin: https://dr-law.site
# Access-Control-Allow-Methods: GET, HEAD, OPTIONS
```

## ملاحظات / Notes

1. **404 Errors**: إذا استمرت أخطاء 404، تأكد من:
   - الملفات موجودة فعلياً على الخادم
   - المسار في قاعدة البيانات صحيح
   - الصلاحيات صحيحة

2. **CORS Errors**: إذا استمرت أخطاء CORS:
   - تأكد من أن `.htaccess` موجود في مجلد `uploads`
   - تأكد من أن Apache mod_headers مفعل: `sudo a2enmod headers`
   - تحقق من logs: `tail -f /var/log/apache2/error.log`

3. **Performance**: CORS headers قد تؤثر قليلاً على الأداء، لكنها ضرورية للوصول من domains مختلفة.

## الدعم / Support

إذا استمرت المشكلة:
1. تحقق من logs الخادم
2. تحقق من إعدادات reverse proxy (إذا كان موجود)
3. تأكد من أن جميع الملفات موجودة ويمكن الوصول إليها

