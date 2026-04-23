/**
 * Database Tables Schema
 * SQLite table definitions for ArogyaJal app
 */

import { getDatabase } from './database';

/**
 * Create all required tables
 */
export const createTables = async () => {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Water Tests Table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS water_tests (
        id TEXT PRIMARY KEY,
        sourceType TEXT,
        sourceName TEXT,
        appearance TEXT,
        odour TEXT,
        suspendedMatter TEXT,
        pH TEXT,
        frc TEXT,
        turbidity TEXT,
        tds REAL,
        hardness TEXT,
        geogenicParameter TEXT,
        rainfall24h TEXT,
        nearbyRiskActivity TEXT,
        chlorination TEXT,
        storageMethod TEXT,
        photoPath TEXT,
        riskLevel TEXT,
        latitude REAL,
        longitude REAL,
        createdAt TEXT,
        updatedAt TEXT,
        reporterId TEXT,
        reporterType TEXT,
        status TEXT,
        synced INTEGER DEFAULT 0
      );
    `);

    console.log('✅ Water tests table created successfully');

    // Service Requests Table
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

    console.log('✅ Service requests table created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

/**
 * Drop all tables (for development/testing)
 */
export const dropTables = async () => {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    await db.executeSql('DROP TABLE IF EXISTS water_tests;');
    await db.executeSql('DROP TABLE IF EXISTS service_requests;');
    console.log('✅ Tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  }
};

export default { createTables, dropTables };
