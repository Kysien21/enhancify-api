const cron = require('node-cron');
const History = require('../models/History');

/**
 * Delete history records older than 30 days
 */
const deleteOldHistory = async () => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    console.log('🗑️  Running history cleanup...');
    console.log('🗓️  Deleting records older than:', oneMonthAgo.toLocaleDateString());

    const result = await History.deleteMany({
      createdAt: { $lt: oneMonthAgo }
    });

    console.log(`✅ Deleted ${result.deletedCount} old history records`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      olderThan: oneMonthAgo
    };
  } catch (error) {
    console.error('❌ Error deleting old history:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Start the cleanup scheduler
 * Runs on the 1st day of every month at 2:00 AM
 */
const startCleanupScheduler = () => {
  // Run on the 1st of every month at 2:00 AM
  cron.schedule('0 2 1 * *', async () => {
    console.log('\n🔄 Starting monthly history cleanup...');
    await deleteOldHistory();
  });

  console.log('✅ History cleanup scheduler started (runs monthly on the 1st at 2:00 AM)');
};

module.exports = {
  startCleanupScheduler,
  deleteOldHistory
};