# ⚠️ URGENT: Server Fix Required

## Problem
All admin endpoints returning 500 errors:
- `/api/admin/about-app` (POST)
- `/api/admin/help-support` (GET/POST)
- `/api/admin/policies` (GET/POST)
- `/api/admin/roles` (GET)
- `/api/admin/permissions` (GET)
- `/api/admin/course-requests` (GET)

## Root Cause
**Prisma Client has NOT been regenerated** after adding new models to the schema.

## 🔴 IMMEDIATE ACTION REQUIRED

### On Production Server:

```bash
# 1. SSH into server
ssh user@dr-law.development.site

# 2. Navigate to backend directory
cd /var/www/dr-law.development.site

# 3. Generate Prisma Client (CRITICAL!)
npm run prisma:generate

# 4. Run migrations (if tables don't exist)
npm run prisma:migrate

# 5. Restart the application
pm2 restart dr-law-backend
# or
pm2 restart dr-law-b

# 6. Check logs
pm2 logs dr-law-backend --lines 50
```

## ✅ Verification

After running the commands, test these endpoints:

```bash
# Should return empty array or data (not 500 error)
curl https://dr-law.developteam.site/api/admin/about-app \
  -H "Authorization: Bearer YOUR_TOKEN"

curl https://dr-law.developteam.site/api/admin/help-support \
  -H "Authorization: Bearer YOUR_TOKEN"

curl https://dr-law.developteam.site/api/admin/policies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 What Was Fixed in Code

All controllers now have safety checks that:
1. Check if Prisma model exists before using it
2. Return empty data instead of crashing if model doesn't exist
3. Provide helpful error messages

But **you still need to run `npm run prisma:generate` on the server** to make the models available.

## 🚨 Why This Happened

When new models are added to `prisma/schema.prisma`:
1. Schema file is updated ✅ (done)
2. Prisma Client must be regenerated ❌ (NOT done on server)
3. Database migrations must be run ❌ (may not be done)

The code now handles missing models gracefully, but the proper fix is to regenerate Prisma Client.

## 📝 Prevention

Add to your deployment script:

```bash
#!/bin/bash
cd /var/www/dr-law.development.site
git pull
npm install
npm run prisma:generate  # ← ADD THIS
npm run prisma:migrate   # ← ADD THIS
pm2 restart dr-law-backend
```

---

**Status:** Code is fixed and safe. Server needs `npm run prisma:generate` to be run.




