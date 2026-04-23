/**
 * Training Service
 * Manages training modules, downloads, and offline access
 */

import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase } from '../database/database';

class TrainingService {
  constructor() {
    this.db = null;
    this.initDatabase();
  }

  async initDatabase() {
    try {
      this.db = await initDatabase();
      await this.createTables();
    } catch (error) {
      console.error('[TrainingService] Database init error:', error);
    }
  }

  async createTables() {
    if (!this.db) return;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS downloaded_modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        title_hindi TEXT,
        file_path TEXT NOT NULL,
        file_size TEXT,
        file_type TEXT,
        duration TEXT,
        category TEXT,
        downloaded_at TEXT NOT NULL,
        last_accessed TEXT,
        status TEXT DEFAULT 'downloaded'
      );
    `;

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          createTableQuery,
          [],
          () => {
            console.log('[TrainingService] Tables created successfully');
            resolve();
          },
          (_, error) => {
            console.error('[TrainingService] Create table error:', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Get all training modules from Firestore
   */
  async getAllModules() {
    try {
      const snapshot = await firestore()
        .collection('training_modules')
        .where('active', '==', true)
        .orderBy('order', 'asc')
        .get();

      const modules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, modules };
    } catch (error) {
      console.error('[TrainingService] Get modules error:', error);
      return { success: false, error: error.message, modules: [] };
    }
  }

  /**
   * Get modules by category
   */
  async getModulesByCategory(category) {
    try {
      const snapshot = await firestore()
        .collection('training_modules')
        .where('active', '==', true)
        .where('category', '==', category)
        .orderBy('order', 'asc')
        .get();

      const modules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, modules };
    } catch (error) {
      console.error('[TrainingService] Get modules by category error:', error);
      return { success: false, error: error.message, modules: [] };
    }
  }

  /**
   * Get featured modules
   */
  async getFeaturedModules() {
    try {
      const snapshot = await firestore()
        .collection('training_modules')
        .where('active', '==', true)
        .where('featured', '==', true)
        .orderBy('order', 'asc')
        .limit(5)
        .get();

      const modules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, modules };
    } catch (error) {
      console.error('[TrainingService] Get featured modules error:', error);
      return { success: false, error: error.message, modules: [] };
    }
  }

  /**
   * Check if module is downloaded
   */
  async isModuleDownloaded(moduleId) {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM downloaded_modules WHERE module_id = ?',
          [moduleId],
          (_, { rows }) => {
            resolve(rows.length > 0);
          },
          (_, error) => {
            console.error('[TrainingService] Check download error:', error);
            resolve(false);
          }
        );
      });
    });
  }

  /**
   * Get downloaded module info
   */
  async getDownloadedModule(moduleId) {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM downloaded_modules WHERE module_id = ?',
          [moduleId],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve({ success: true, module: rows.item(0) });
            } else {
              resolve({ success: false, module: null });
            }
          },
          (_, error) => {
            console.error('[TrainingService] Get downloaded module error:', error);
            resolve({ success: false, error: error.message });
          }
        );
      });
    });
  }

  /**
   * Get all downloaded modules
   */
  async getAllDownloadedModules() {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM downloaded_modules ORDER BY downloaded_at DESC',
          [],
          (_, { rows }) => {
            const modules = [];
            for (let i = 0; i < rows.length; i++) {
              modules.push(rows.item(i));
            }
            resolve({ success: true, modules });
          },
          (_, error) => {
            console.error('[TrainingService] Get all downloaded error:', error);
            resolve({ success: false, error: error.message, modules: [] });
          }
        );
      });
    });
  }

  /**
   * Save downloaded module to local database
   */
  async saveDownloadedModule(moduleData) {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO downloaded_modules 
           (module_id, title, title_hindi, file_path, file_size, file_type, duration, category, downloaded_at, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            moduleData.moduleId,
            moduleData.title,
            moduleData.titleHindi || '',
            moduleData.filePath,
            moduleData.fileSize || '',
            moduleData.fileType || 'video',
            moduleData.duration || '',
            moduleData.category || '',
            new Date().toISOString(),
            'downloaded'
          ],
          () => {
            console.log('[TrainingService] Module saved to local DB');
            resolve({ success: true });
          },
          (_, error) => {
            console.error('[TrainingService] Save module error:', error);
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Delete downloaded module
   */
  async deleteDownloadedModule(moduleId) {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM downloaded_modules WHERE module_id = ?',
          [moduleId],
          () => {
            console.log('[TrainingService] Module deleted from local DB');
            resolve({ success: true });
          },
          (_, error) => {
            console.error('[TrainingService] Delete module error:', error);
            resolve({ success: false, error: error.message });
          }
        );
      });
    });
  }

  /**
   * Update last accessed time
   */
  async updateLastAccessed(moduleId) {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE downloaded_modules SET last_accessed = ? WHERE module_id = ?',
          [new Date().toISOString(), moduleId],
          () => resolve({ success: true }),
          (_, error) => {
            console.error('[TrainingService] Update last accessed error:', error);
            resolve({ success: false });
          }
        );
      });
    });
  }

  /**
   * Track module view in Firestore
   */
  async trackModuleView(moduleId) {
    try {
      await firestore()
        .collection('training_modules')
        .doc(moduleId)
        .update({
          views: firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error('[TrainingService] Track view error:', error);
    }
  }

  /**
   * Track module completion
   */
  async trackModuleCompletion(moduleId) {
    try {
      await firestore()
        .collection('training_modules')
        .doc(moduleId)
        .update({
          completions: firestore.FieldValue.increment(1),
        });
    } catch (error) {
      console.error('[TrainingService] Track completion error:', error);
    }
  }

  /**
   * Get total storage used by downloads
   */
  async getTotalStorageUsed() {
    const result = await this.getAllDownloadedModules();
    if (!result.success) return '0 MB';

    let totalBytes = 0;
    result.modules.forEach(module => {
      const sizeStr = module.file_size || '0 MB';
      const sizeNum = parseFloat(sizeStr);
      const unit = sizeStr.includes('GB') ? 1024 : 1;
      totalBytes += sizeNum * unit;
    });

    return totalBytes >= 1024 ? `${(totalBytes / 1024).toFixed(2)} GB` : `${totalBytes.toFixed(2)} MB`;
  }
}

export default new TrainingService();
