import cron from 'node-cron';
import { archiveAllExpiredCourses } from '../services/courseArchivingService.js';

/**
 * Scheduled job to check and archive expired courses
 * Runs every day at 2 AM
 */
export const startCourseExpirationJob = () => {
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Running course expiration job...');
    try {
      const result = await archiveAllExpiredCourses();
      console.log(`✅ Course expiration job completed:`, result);
    } catch (error) {
      console.error('❌ Error in course expiration job:', error);
    }
  });

  console.log('📅 Course expiration job scheduled (runs daily at 2:00 AM)');
};

/**
 * Manual trigger for testing
 */
export const runCourseExpirationJob = async () => {
  console.log('🔄 Manually running course expiration job...');
  try {
    const result = await archiveAllExpiredCourses();
    console.log(`✅ Course expiration job completed:`, result);
    return result;
  } catch (error) {
    console.error('❌ Error in course expiration job:', error);
    throw error;
  }
};



