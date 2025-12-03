const cron = require('node-cron');
const History = require('../models/History');

/**
 * Delete ALL history records (complete reset every 24 hours)
 */
const deleteOldHistory = async () => {
  try {
    console.log('🗑️  Running history cleanup...');
    console.log('🗓️  Deleting ALL history records for complete reset');

    // Delete ALL history records (complete reset)
    const result = await History.deleteMany({});

    console.log(`✅ Deleted ${result.deletedCount} history records (Complete Reset)`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      resetType: 'complete'
    };
  } catch (error) {
    console.error('❌ Error deleting history:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Start the cleanup scheduler
 * Runs every 24 hours at 2:00 AM
 */
const startCleanupScheduler = () => {
  // Run every day at 2:00 AM (every 24 hours)
  cron.schedule('0 2 * * *', async () => {
    console.log('\n🔄 Starting daily history reset...');
    await deleteOldHistory();
  });

  console.log('✅ History cleanup scheduler started (runs every 24 hours at 2:00 AM)');
  
};

module.exports = {
  startCleanupScheduler,
  deleteOldHistory
};