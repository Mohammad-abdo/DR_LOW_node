# Deployment Checklist

## ⚠️ CRITICAL: Before Deploying to Production

### 1. Prisma Client Generation
**MUST RUN** after any schema changes:

```bash
cd /var/www/dr-law.development.site
npm run prisma:generate
```

This generates the Prisma Client with all models including:
- `CourseRequest`
- `HelpSupport`
- `AppPolicy`
- `AboutApp`
- `Role`
- `Permission`
- `RolePermission`
- `UserRoleAssignment`

### 2. Database Migrations
**MUST RUN** if tables don't exist:

```bash
npm run prisma:migrate
```

### 3. Restart Application
After generating Prisma client:

```bash
pm2 restart dr-law-backend
# or
pm2 restart dr-law-b
```

## 🔍 Verification Steps

### Check Prisma Models
```bash
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('Models:', Object.keys(p).filter(k => !k.startsWith('$') && !k.startsWith('_')))"
```

Should show all models including: `courseRequest`, `helpSupport`, `appPolicy`, `aboutApp`, `role`, `permission`, etc.

### Test Endpoints
After deployment, test these endpoints:
- ✅ `GET /api/admin/course-requests` - Should return empty array if no requests
- ✅ `GET /api/admin/about-app` - Should return null if no data
- ✅ `GET /api/admin/help-support` - Should return empty array if no data
- ✅ `GET /api/admin/policies` - Should return empty array if no data
- ✅ `GET /api/admin/roles` - Should return empty array if no data
- ✅ `GET /api/admin/permissions` - Should return empty array if no data

## 📋 Deployment Script

Add to your deployment script:

```bash
#!/bin/bash
# Deployment script

cd /var/www/dr-law.development.site

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Generate Prisma Client (CRITICAL!)
npm run prisma:generate

# Run migrations if needed
npm run prisma:migrate

# Restart application
pm2 restart dr-law-backend

# Check logs
pm2 logs dr-law-backend --lines 50
```

## 🐛 Troubleshooting

### Error: `Cannot read properties of undefined (reading 'findMany')`
**Solution:** Run `npm run prisma:generate`

### Error: `Table doesn't exist`
**Solution:** Run `npm run prisma:migrate`

### Error: `500 Internal Server Error` on admin endpoints
**Solution:** 
1. Check if Prisma client is generated
2. Check server logs for detailed error
3. Verify database connection

## ✅ Current Status

All controllers now have safety checks:
- ✅ `courseRequestController.js` - Checks for `prisma.courseRequest`
- ✅ `helpSupportController.js` - Checks for `prisma.helpSupport`
- ✅ `appPolicyController.js` - Checks for `prisma.appPolicy`
- ✅ `aboutAppController.js` - Checks for `prisma.aboutApp`
- ✅ `roleController.js` - Checks for `prisma.role`
- ✅ `permissionController.js` - Checks for `prisma.permission`

If models don't exist, endpoints return empty data instead of crashing.




