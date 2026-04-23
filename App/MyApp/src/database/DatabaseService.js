import { getDatabase } from './database';

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    try {
      // Wait for database to be ready with retries
      let retries = 5;
      while (retries > 0 && !this.db) {
        this.db = getDatabase();
        if (!this.db) {
          console.log(`⏳ Waiting for database... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 200));
          retries--;
        }
      }
      
      if (!this.db) {
        console.warn('⚠️ Database not ready after retries');
        return false;
      }
      
      await this.createTables();
      this.initialized = true;
      console.log('✅ DatabaseService initialized');
      return true;
    } catch (error) {
      console.error('❌ DatabaseService init failed:', error);
      this.initialized = false;
      return false;
    }
  }

  async createTables() {
    try {
      // First, add sync columns to existing water_tests table if they don't exist
      await this.addSyncColumnsToExistingTables();
      
      // Create sync index for water_tests
      await this.createWaterTestsSyncIndex();
      
      // Then create new tables
      const tables = [
        this.createHealthReportsTable(),
        this.createIssueReportsTable(),
        this.createRainfallAlertsTable(),
        this.createVillageHealthScoreTable(),
        this.createSyncQueueTable(),
        this.createSyncLogsTable(),
      ];
      await Promise.all(tables);
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  async addSyncColumnsToExistingTables() {
    if (!this.db) return;
    
    try {
      // Add synced column to water_tests if it doesn't exist
      await this.db.executeSql(`
        ALTER TABLE water_tests ADD COLUMN synced INTEGER DEFAULT 0;
      `).catch(() => {
        // Column already exists, ignore error
        console.log('synced column already exists in water_tests');
      });

      await this.db.executeSql(`
        ALTER TABLE water_tests ADD COLUMN sync_attempts INTEGER DEFAULT 0;
      `).catch(() => {
        console.log('sync_attempts column already exists in water_tests');
      });

      await this.db.executeSql(`
        ALTER TABLE water_tests ADD COLUMN last_sync_attempt INTEGER;
      `).catch(() => {
        console.log('last_sync_attempt column already exists in water_tests');
      });

      console.log('✅ Sync columns added to existing tables');
    } catch (error) {
      console.error('Error adding sync columns:', error);
    }
  }

  async createWaterTestsSyncIndex() {
    if (!this.db) return;
    try {
      await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_water_tests_synced ON water_tests(synced)');
      console.log('✅ Water tests sync index created');
    } catch (error) {
      console.log('Index creation skipped:', error.message);
    }
  }

  async createHealthReportsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS health_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT UNIQUE,
        household_id TEXT,
        patient_name TEXT,
        age INTEGER,
        gender TEXT,
        symptoms TEXT,
        disease_suspected TEXT,
        severity TEXT,
        water_related INTEGER DEFAULT 0,
        reported_at INTEGER,
        reported_by TEXT,
        follow_up_date INTEGER,
        status TEXT DEFAULT 'open',
        synced INTEGER DEFAULT 0,
        sync_attempts INTEGER DEFAULT 0,
        last_sync_attempt INTEGER,
        created_at INTEGER,
        updated_at INTEGER
      );
    `;
    await this.db.executeSql(query);
    await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_health_reports_synced ON health_reports(synced)');
  }

  async createIssueReportsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS water_issue_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_id TEXT UNIQUE,
        issue_type TEXT,
        description TEXT,
        photo_path TEXT,
        photo_url TEXT,
        photo_uploaded INTEGER DEFAULT 0,
        latitude REAL,
        longitude REAL,
        village_id TEXT,
        reported_by TEXT,
        reported_at INTEGER,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        synced INTEGER DEFAULT 0,
        sync_attempts INTEGER DEFAULT 0,
        last_sync_attempt INTEGER,
        created_at INTEGER,
        updated_at INTEGER
      );
    `;
    await this.db.executeSql(query);
    await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_issue_reports_synced ON water_issue_reports(synced)');
  }

  async createRainfallAlertsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS rainfall_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT UNIQUE,
        date TEXT,
        rainfall_detected INTEGER,
        rainfall_mm REAL,
        risk_level TEXT,
        message TEXT,
        expires_at INTEGER,
        village_id TEXT,
        synced INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );
    `;
    await this.db.executeSql(query);
    await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_rainfall_alerts_date ON rainfall_alerts(date)');
  }

  async createVillageHealthScoreTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS village_health_score (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        score_id TEXT UNIQUE,
        village_id TEXT,
        date INTEGER,
        overall_score INTEGER,
        water_safety_score INTEGER,
        disease_score INTEGER,
        hygiene_score INTEGER,
        rainfall_impact_score INTEGER,
        total_tests INTEGER,
        safe_tests INTEGER,
        active_cases INTEGER,
        calculation_details TEXT,
        synced INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );
    `;
    await this.db.executeSql(query);
    await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_village_health_score_village ON village_health_score(village_id)');
  }

  async createSyncQueueTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        queue_id TEXT UNIQUE,
        table_name TEXT,
        record_id INTEGER,
        operation TEXT,
        priority INTEGER DEFAULT 5,
        payload TEXT,
        status TEXT DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        last_attempt INTEGER,
        error_message TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `;
    await this.db.executeSql(query);
    await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)');
  }

  async createSyncLogsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER,
        level TEXT,
        message TEXT,
        data TEXT
      );
    `;
    await this.db.executeSql(query);
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async insertWaterTest(testData) {
    if (!this.db) {
      console.warn('Database not initialized yet');
      return null;
    }

    const testId = this.generateUUID();
    const timestamp = new Date().toISOString();

    try {
      // Use existing table structure with camelCase columns
      const query = `
        INSERT INTO water_tests (
          id, sourceType, sourceName, pH, tds, turbidity,
          latitude, longitude, status, synced,
          createdAt, updatedAt, reporterId, reporterType
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
      `;

      await this.db.executeSql(query, [
        testId,
        testData.sourceType || testData.test_type || 'manual',
        testData.sourceName || testData.household_id || '',
        testData.pH || testData.ph || null,
        testData.tds || null,
        testData.turbidity || null,
        testData.latitude || null,
        testData.longitude || null,
        'pending_sync',
        timestamp,
        timestamp,
        testData.tested_by || testData.reporterId || '',
        testData.reporterType || 'ASHA',
      ]);

      await this.addToSyncQueue('water_tests', testId, 'create', testData);
      return testId;
    } catch (error) {
      console.error('Error inserting water test:', error);
      return null;
    }
  }

  async getUnsyncedRecords(tableName, limit = 50) {
    if (!this.db) {
      console.warn('Database not initialized yet');
      return [];
    }
    try {
      // Use createdAt for water_tests (existing table), created_at for new tables
      const orderColumn = tableName === 'water_tests' ? 'createdAt' : 'created_at';
      const query = `
        SELECT * FROM ${tableName}
        WHERE synced = 0
        ORDER BY ${orderColumn} ASC
        LIMIT ?
      `;
      const [results] = await this.db.executeSql(query, [limit]);
      return results.rows.raw();
    } catch (error) {
      console.error(`Error getting unsynced records from ${tableName}:`, error);
      return [];
    }
  }

  async markAsSynced(tableName, recordId) {
    if (!this.db) {
      console.warn('Database not initialized yet');
      return;
    }
    try {
      // Use updatedAt for water_tests (existing table), updated_at for new tables
      const updateColumn = tableName === 'water_tests' ? 'updatedAt' : 'updated_at';
      const query = `
        UPDATE ${tableName}
        SET synced = 1, ${updateColumn} = ?
        WHERE id = ?
      `;
      await this.db.executeSql(query, [new Date().toISOString(), recordId]);
    } catch (error) {
      console.error(`Error marking record as synced in ${tableName}:`, error);
    }
  }

  async incrementSyncAttempts(tableName, recordId) {
    if (!this.db) {
      console.warn('Database not initialized yet');
      return;
    }
    try {
      const query = `
        UPDATE ${tableName}
        SET sync_attempts = sync_attempts + 1,
            last_sync_attempt = ?
        WHERE id = ?
      `;
      await this.db.executeSql(query, [Date.now(), recordId]);
    } catch (error) {
      console.error(`Error incrementing sync attempts in ${tableName}:`, error);
    }
  }

  async addToSyncQueue(tableName, recordId, operation, payload) {
    const queueId = this.generateUUID();
    const timestamp = Date.now();

    const query = `
      INSERT INTO sync_queue (
        queue_id, table_name, record_id, operation,
        payload, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `;

    await this.db.executeSql(query, [
      queueId,
      tableName,
      recordId,
      operation,
      JSON.stringify(payload),
      timestamp,
      timestamp,
    ]);
  }

  async getUnsyncedCount(tableName) {
    if (!this.db) {
      console.warn('Database not initialized yet');
      return 0;
    }
    try {
      // Check if synced column exists
      const query = `SELECT COUNT(*) as count FROM ${tableName} WHERE synced = 0`;
      const [results] = await this.db.executeSql(query);
      return results.rows.item(0).count;
    } catch (error) {
      // If column doesn't exist, check for status = 'pending_sync' instead
      if (error.message && error.message.includes('no such column: synced')) {
        try {
          const fallbackQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE status = 'pending_sync'`;
          const [results] = await this.db.executeSql(fallbackQuery);
          return results.rows.item(0).count;
        } catch (fallbackError) {
          console.error(`Fallback query failed for ${tableName}:`, fallbackError);
          return 0;
        }
      }
      console.error(`Error getting unsynced count for ${tableName}:`, error);
      return 0;
    }
  }

  async getLastSyncTimestamp() {
    if (!this.db) {
      console.warn('Database not initialized yet');
      return 0;
    }
    try {
      const query = `SELECT MAX(updated_at) as last_sync FROM sync_queue WHERE status = 'completed'`;
      const [results] = await this.db.executeSql(query);
      return results.rows.item(0).last_sync || 0;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return 0;
    }
  }

  async updateLastSyncTimestamp(timestamp) {
    // Store in a settings table or use a specific record
    console.log('Last sync updated:', timestamp);
  }

  async getAllHouseholdSurveys() {
    // Household surveys are stored in AsyncStorage, not SQLite
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const surveysData = await AsyncStorage.getItem('pending_household_surveys');
      const surveys = JSON.parse(surveysData || '[]');
      return surveys;
    } catch (error) {
      console.error('Error getting household surveys:', error);
      return [];
    }
  }

  async getAllWaterTests() {
    if (!this.db) {
      console.warn('Database not initialized yet');
      return [];
    }
    try {
      const query = `SELECT * FROM water_tests ORDER BY createdAt DESC`;
      const [results] = await this.db.executeSql(query);
      return results.rows.raw();
    } catch (error) {
      console.error('Error getting all water tests:', error);
      return [];
    }
  }

  async close() {
    if (this.db) {
      await this.db.close();
      console.log('✅ Database closed');
    }
  }
}

export default new DatabaseService();
