# Auto-Fix Prisma Client

## What Was Added

تم إضافة آلية تلقائية لتوليد Prisma Client عند بدء التطبيق.

## Changes Made

### 1. `package.json` - Auto-generate on install and start
```json
{
  "scripts": {
    "postinstall": "npm run prisma:generate",
    "start": "npm run prisma:generate && node src/server.js",
    "start:prod": "npm run prisma:generate && npm run prisma:migrate:deploy && node src/server.js"
  }
}
```

### 2. `src/config/database.js` - Auto-check and generate
- ✅ Checks if Prisma Client is generated on startup
- ✅ Attempts to generate automatically if missing (in production)
- ✅ Tests database connection
- ✅ Verifies models are available

### 3. `src/server.js` - Health check on startup
- ✅ Verifies all required Prisma models are available
- ✅ Warns if models are missing
- ✅ Provides clear instructions

### 4. `src/utils/prismaHealthCheck.js` - Health monitoring
- ✅ Utility to check Prisma model availability
- ✅ Can be used in health check endpoints

## How It Works

1. **On `npm install`**: Automatically runs `prisma:generate` (via `postinstall` script)
2. **On `npm start`**: Generates Prisma Client before starting server
3. **On server startup**: Checks if models are available and warns if missing
4. **In production**: Attempts to auto-generate if models are missing

## Manual Override

If you want to disable auto-generation, set:
```bash
AUTO_GENERATE_PRISMA=false
```

## For Production Deployment

### Option 1: Use the new start script
```bash
npm run start:prod
```

### Option 2: Manual steps (recommended for first time)
```bash
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm start
```

## Verification

After deployment, check server logs for:
```
✅ All Prisma models are available
✅ Database connected successfully
```

If you see warnings about missing models, the auto-generation will attempt to fix it.

## Benefits

1. ✅ **Automatic**: Prisma Client generates on install and start
2. ✅ **Self-healing**: Attempts to fix missing models automatically
3. ✅ **Clear warnings**: Tells you exactly what's missing
4. ✅ **Safe**: Won't crash if models are missing (graceful degradation)

## Notes

- Auto-generation only happens in production mode
- In development, you still need to run `npm run prisma:generate` manually if schema changes
- The `postinstall` script ensures Prisma Client is always generated after `npm install`

