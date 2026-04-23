/**
 * Database Migrations
 * Handle database schema updates for existing installations
 */

import { getDatabase } from './database';

/**
 * Check if a table exists
 */
const tableExists = async (tableName) => {
  const db = getDatabase();
  try {
    const [result] = await db.executeSql(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
      [tableName]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Check if a column exists in a table
 */
const columnExists = async (tableName, columnName) => {
  const db = getDatabase();
  try {
    const [result] = await db.executeSql(`PRAGMA table_info(${tableName});`);
    for (let i = 0; i < result.rows.length; i++) {
      const column = result.rows.item(i);
      if (column.name === columnName) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
};

/**
 * Add synced column to water_tests table if missing
 */
const addSyncedColumnToWaterTests = async () => {
  const db = getDatabase();
  try {
    const exists = await columnExists('water_tests', 'synced');
    if (!exists) {
      await db.executeSql(`ALTER TABLE water_tests ADD COLUMN synced INTEGER DEFAULT 0;`);
      console.log('✅ Added synced column to water_tests table');
      return true;
    }
    console.log('✓ synced column already exists in water_tests');
    return false;
  } catch (error) {
    console.error('❌ Error adding synced column to water_tests:', error);
    return false;
  }
};

/**
 * Create service_requests table if missing
 */
const createServiceRequestsTable = async () => {
  const db = getDatabase();
  try {
    const exists = await tableExists('service_requests');
    if (!exists) {
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS service_requests (
          id TEXT PRIMARY KEY,
          type TEXT,
          priority TEXT,
          description TEXT,
          preferredTime TEXT,
          status TEXT,
          acknowledged INTEGER DEFAULT 0,
          acknowledgedAt TEXT,
          acknowledgedBy TEXT,
          alertSent INTEGER DEFAULT 0,
          alertSentAt TEXT,
          createdAt TEXT,
          updatedAt TEXT,
          assignedAt TEXT,
          completedAt TEXT,
          residentId TEXT,
          residentName TEXT,
          residentPhone TEXT,
          village TEXT,
          block TEXT,
          district TEXT,
          householdId TEXT,
          assignedTo TEXT,
          assignedAshaId TEXT,
          assignedAshaName TEXT,
          consentGiven INTEGER DEFAULT 0,
          consentTimestamp TEXT,
          attachments TEXT,
          notes TEXT,
          statusHistory TEXT,
          synced INTEGER DEFAULT 0,
          firebaseId TEXT
        );
      `);
      console.log('✅ Created service_requests table');
      return true;
    }
    console.log('✓ service_requests table already exists');
    return false;
  } catch (error) {
    console.error('❌ Error creating service_requests table:', error);
    return false;
  }
};

/**
 * Run all migrations
 */
export const runMigrations = async () => {
  console.log('🔄 Running database migrations...');
  
  try {
    let migrationsRun = 0;
    
    // Migration 1: Add synced column to water_tests
    if (await addSyncedColumnToWaterTests()) {
      migrationsRun++;
    }
    
    // Migration 2: Create service_requests table
    if (await createServiceRequestsTable()) {
      migrationsRun++;
    }
    
    if (migrationsRun > 0) {
      console.log(`✅ Completed ${migrationsRun} database migration(s)`);
    } else {
      console.log('✓ Database is up to date');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    return false;
  }
};

export default { runMigrations, tableExists, columnExists };
