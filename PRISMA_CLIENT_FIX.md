# Prisma Client Fix

## Problem
Error: `Cannot read properties of undefined (reading 'findMany')`

This happens when Prisma Client hasn't been regenerated after adding new models to the schema.

## Solution

### On Production Server:

1. **SSH into your server**
2. **Navigate to backend directory**
   ```bash
   cd /var/www/dr-law.development.site
   ```

3. **Regenerate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

4. **Run migrations (if tables don't exist)**
   ```bash
   npm run prisma:migrate
   ```

5. **Restart the application**
   ```bash
   pm2 restart dr-law-backend
   # or
   pm2 restart dr-law-b
   ```

### Alternative: Add to deployment script

Add these commands to your deployment script:

```bash
# After pulling code
npm install
npm run prisma:generate
npm run prisma:migrate
pm2 restart dr-law-backend
```

## What Changed

I've added safety checks in the controllers to handle the case when Prisma models don't exist:

- `courseRequestController.js` - Checks if `prisma.courseRequest` exists
- `helpSupportController.js` - Checks if `prisma.helpSupport` exists  
- `appPolicyController.js` - Checks if `prisma.appPolicy` exists

If models don't exist, the endpoints will return empty arrays instead of crashing.

## Verification

After regenerating Prisma client, verify it worked:

```bash
# Check if models are available
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('courseRequest:', typeof p.courseRequest);"
```

Should output: `courseRequest: object`

## Prevention

Add to your CI/CD pipeline:
1. Always run `npm run prisma:generate` after schema changes
2. Always run `npm run prisma:migrate` before starting the server
3. Add a health check that verifies Prisma models are available















