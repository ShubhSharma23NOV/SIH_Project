/**
 * Request Monitor Service
 * Monitors service requests and sends alerts for unacknowledged requests
 */

import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

class RequestMonitorService {
  constructor() {
    this.backendUrl = null;
    this.checkInterval = null;
  }

  /**
   * Initialize the service with backend URL
   * @param {string} backendUrl - Your backend API URL
   */
  async initialize(backendUrl) {
    this.backendUrl = backendUrl;
    await AsyncStorage.setItem('backend_url', backendUrl);
    console.log('✅ Request Monitor Service initialized with backend:', backendUrl);
  }

  /**
   * Start monitoring requests (call this when ASHA logs in)
   */
  startMonitoring() {
    if (this.checkInterval) {
      console.log('⚠️ Monitoring already running');
      return;
    }

    console.log('🔍 Starting request monitoring...');
    
    // Check every 30 minutes
    this.checkInterval = setInterval(() => {
      this.checkUnacknowledgedRequests();
    }, 30 * 60 * 1000);

    // Also check immediately
    this.checkUnacknowledgedRequests();
  }

  /**
   * Stop monitoring (call this when ASHA logs out)
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Request monitoring stopped');
    }
  }

  /**
   * Check for unacknowledged requests past 24 hours
   */
  async checkUnacknowledgedRequests() {
    try {
      console.log('🔍 Checking for unacknowledged requests...');

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Query for unacknowledged requests older than 24 hours
      const snapshot = await firestore()
        .collection('service_requests')
        .where('acknowledged', '==', false)
        .where('alertSent', '==', false)
        .where('createdAt', '<=', twentyFourHoursAgo)
        .get();

      if (snapshot.empty) {
        console.log('✅ No unacknowledged requests found');
        return;
      }

      console.log(`⚠️ Found ${snapshot.docs.length} unacknowledged requests`);

      // Process each unacknowledged request
      for (const doc of snapshot.docs) {
        const request = { id: doc.id, ...doc.data() };
        await this.sendAlertToBackend(request);
      }
    } catch (error) {
      console.error('❌ Error checking unacknowledged requests:', error);
    }
  }

  /**
   * Send alert to backend for unacknowledged request
   * @param {object} request - The request object
   */
  async sendAlertToBackend(request) {
    try {
      const backendUrl = this.backendUrl || await AsyncStorage.getItem('backend_url');
      
      if (!backendUrl) {
        console.error('❌ Backend URL not configured');
        return;
      }

      const alertData = {
        requestId: request.id,
        type: request.type,
        priority: request.priority,
        residentName: request.residentName,
        residentPhone: request.residentPhone,
        village: request.village,
        assignedAshaId: request.assignedAshaId,
        assignedAshaName: request.assignedAshaName,
        createdAt: request.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        description: request.description,
        alertType: 'UNACKNOWLEDGED_REQUEST',
        alertMessage: `Service request ${request.id} has not been acknowledged within 24 hours`,
        timestamp: new Date().toISOString(),
      };

      console.log('📤 Sending alert to backend:', backendUrl);

      const response = await fetch(`${backendUrl}/api/alerts/unacknowledged-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (response.ok) {
        console.log('✅ Alert sent successfully to backend');

        // Mark alert as sent in Firestore
        await firestore()
          .collection('service_requests')
          .doc(request.id)
          .update({
            alertSent: true,
            alertSentAt: firestore.FieldValue.serverTimestamp(),
          });

        // Also log to alerts collection for tracking
        await firestore()
          .collection('system_alerts')
          .add({
            ...alertData,
            sentAt: firestore.FieldValue.serverTimestamp(),
            status: 'sent',
          });
      } else {
        console.error('❌ Failed to send alert to backend:', response.status);
      }
    } catch (error) {
      console.error('❌ Error sending alert to backend:', error);
    }
  }

  /**
   * Manually trigger check (for testing)
   */
  async manualCheck() {
    console.log('🔍 Manual check triggered');
    await this.checkUnacknowledgedRequests();
  }

  /**
   * Get all unacknowledged requests (for dashboard display)
   */
  async getUnacknowledgedRequests(ashaId) {
    try {
      const snapshot = await firestore()
        .collection('service_requests')
        .where('assignedAshaId', '==', ashaId)
        .where('acknowledged', '==', false)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting unacknowledged requests:', error);
      return [];
    }
  }
}

// Export singleton instance
export default new RequestMonitorService();
