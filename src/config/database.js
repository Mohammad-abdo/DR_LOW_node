import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to generate Prisma Client
const generatePrismaClient = () => {
  try {
    console.log('🔄 Generating Prisma Client...');
    const rootDir = join(__dirname, '../..');
    
    // Use npx to ensure we use the local prisma
    execSync('npx prisma generate', {
      cwd: rootDir,
      stdio: 'pipe',
      env: { ...process.env },
    });
    console.log('✅ Prisma Client generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate Prisma Client automatically:', error.message);
    console.error('⚠️  Please run manually: npm run prisma:generate');
    console.error('⚠️  The application will continue but some features may not work.');
  }
};

// Check if Prisma Client needs to be generated
// Only check in production or if explicitly enabled
if (process.env.AUTO_GENERATE_PRISMA === 'true' || process.env.NODE_ENV === 'production') {
  try {
    // Check if @prisma/client exists
    const prismaClientPath = join(__dirname, '../../node_modules/@prisma/client');
    if (!existsSync(prismaClientPath)) {
      console.warn('⚠️  @prisma/client not found. Generating Prisma Client...');
      generatePrismaClient();
    }
  } catch (error) {
    // Silently fail - we'll try to use Prisma anyway
  }
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test connection on startup
prisma.$connect()
  .then(async () => {
    try {
      // Test if basic models are available
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
    }
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
  });

export default prisma;



