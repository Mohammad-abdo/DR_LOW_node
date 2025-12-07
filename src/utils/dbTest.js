import prisma from '../config/database.js';

export const testDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database is accessible. Total users: ${userCount}`);
    
    return { connected: true, userCount };
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return { connected: false, error: error.message };
  }
};



