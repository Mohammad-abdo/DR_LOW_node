import prisma from '../config/database.js';

/**
 * Check if all required Prisma models are available
 * @returns {Object} Health check result
 */
export const checkPrismaModels = () => {
  const requiredModels = [
    'user',
    'course',
    'courseRequest',
    'helpSupport',
    'appPolicy',
    'aboutApp',
    'role',
    'permission',
    'rolePermission',
    'userRoleAssignment',
  ];

  const available = [];
  const missing = [];

  for (const model of requiredModels) {
    if (typeof prisma[model] !== 'undefined') {
      available.push(model);
    } else {
      missing.push(model);
    }
  }

  return {
    healthy: missing.length === 0,
    available,
    missing,
    total: requiredModels.length,
    availableCount: available.length,
    missingCount: missing.length,
  };
};

/**
 * Get detailed health status
 */
export const getPrismaHealthStatus = () => {
  const health = checkPrismaModels();
  
  if (!health.healthy) {
    console.warn('⚠️  Prisma Client Health Check:');
    console.warn(`   Missing models: ${health.missing.join(', ')}`);
    console.warn(`   Please run: npm run prisma:generate`);
  }
  
  return health;
};















