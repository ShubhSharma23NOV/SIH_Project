import SQLite from 'react-native-sqlite-storage';

// Enable promise mode for cleaner async/await syntax
SQLite.enablePromise(true);

let databaseInstance = null;

/**
 * Initialize and open the SQLite database
 * @returns {Promise<SQLite.SQLiteDatabase>} Database instance
 */
const initDatabase = async () => {
  if (databaseInstance) {
    console.log('Database already initialized');
    return databaseInstance;
  }

  try {
    const db = await SQLite.openDatabase({
      name: 'asha_app.db',
      location: 'default',
    });

    databaseInstance = db;
    console.log('✅ Database opened successfully: asha_app.db');
    return db;
  } catch (error) {
    console.error('❌ Error opening database:', error);
    throw error;
  }
};

/**
 * Get the current database instance
 * @returns {SQLite.SQLiteDatabase|null} Database instance or null if not initialized
 */
const getDatabase = () => {
  if (!databaseInstance) {
    console.warn('⚠️ Database not initialized. Call initDatabase() first.');
  }
  return databaseInstance;
};

/**
 * Close the database connection
 * @returns {Promise<void>}
 */
const closeDatabase = async () => {
  if (databaseInstance) {
    try {
      await databaseInstance.close();
      databaseInstance = null;
      console.log('✅ Database closed successfully');
    } catch (error) {
      console.error('❌ Error closing database:', error);
      throw error;
    }
  }
};

export { initDatabase, getDatabase, closeDatabase };
export default { initDatabase, getDatabase, closeDatabase };
