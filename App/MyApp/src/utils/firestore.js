import firestore from '@react-native-firebase/firestore';

// Collections
export const COLLECTIONS = {
  ASHA_WORKERS: 'asha_workers',
  REPORTS: 'reports',
  ALERTS: 'alerts',
  USERS: 'users'
};

// Firestore instance
export const db = firestore();

// Helper functions for ASHA workers
export const ashaWorkerHelpers = {
  // Check if ASHA worker exists by phone number
  checkByPhone: async (phoneNumber) => {
    try {
      const snapshot = await db
        .collection(COLLECTIONS.ASHA_WORKERS)
        .where('phone', '==', phoneNumber)
        .get();
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking ASHA worker:', error);
      throw error;
    }
  },

  // Get ASHA worker by phone number
  getByPhone: async (phoneNumber) => {
    try {
      const snapshot = await db
        .collection(COLLECTIONS.ASHA_WORKERS)
        .where('phone', '==', phoneNumber)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting ASHA worker:', error);
      throw error;
    }
  },

  // Create new ASHA worker
  create: async (workerData) => {
    try {
      const docRef = await db
        .collection(COLLECTIONS.ASHA_WORKERS)
        .add({
          ...workerData,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
      return docRef.id;
    } catch (error) {
      console.error('Error creating ASHA worker:', error);
      throw error;
    }
  },

  // Update ASHA worker
  update: async (workerId, updateData) => {
    try {
      await db
        .collection(COLLECTIONS.ASHA_WORKERS)
        .doc(workerId)
        .update({
          ...updateData,
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      console.error('Error updating ASHA worker:', error);
      throw error;
    }
  }
};

// Helper functions for reports
export const reportHelpers = {
  // Create new report
  create: async (reportData) => {
    try {
      const docRef = await db
        .collection(COLLECTIONS.REPORTS)
        .add({
          ...reportData,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
      return docRef.id;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  // Get reports by ASHA worker
  getByWorker: async (workerId) => {
    try {
      const snapshot = await db
        .collection(COLLECTIONS.REPORTS)
        .where('ashaWorkerId', '==', workerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  },

  // Get all reports (admin view)
  getAll: async (limit = 50) => {
    try {
      const snapshot = await db
        .collection(COLLECTIONS.REPORTS)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all reports:', error);
      throw error;
    }
  }
};

// Helper functions for alerts
export const alertHelpers = {
  // Create new alert
  create: async (alertData) => {
    try {
      const docRef = await db
        .collection(COLLECTIONS.ALERTS)
        .add({
          ...alertData,
          createdAt: firestore.FieldValue.serverTimestamp(),
          isRead: false
        });
      return docRef.id;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  },

  // Get unread alerts
  getUnread: async () => {
    try {
      const snapshot = await db
        .collection(COLLECTIONS.ALERTS)
        .where('isRead', '==', false)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting unread alerts:', error);
      throw error;
    }
  },

  // Mark alert as read
  markAsRead: async (alertId) => {
    try {
      await db
        .collection(COLLECTIONS.ALERTS)
        .doc(alertId)
        .update({ isRead: true });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  }
};

export default db;