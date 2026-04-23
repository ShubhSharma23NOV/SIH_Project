import NetInfo from '@react-native-community/netinfo';
import DatabaseService from '../database/DatabaseService';
import NetworkService from './NetworkService';
import auth from '@react-native-firebase/auth';
import { API_BASE_URL, API_ENDPOINTS, API_HEADERS } from '../config/api';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.listeners = [];
    this.apiBaseUrl = API_BASE_URL;
  }

  async init() {
    try {
      const dbInitialized = await DatabaseService.init();
      if (!dbInitialized) {
        console.warn('⚠️ DatabaseService not fully initialized, sync may be limited');
      }
      
      await NetworkService.init();
      await this.setupNetworkListener();
      this.startPeriodicSync();
      console.log('✅ SyncService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ SyncService initialization failed:', error);
      // Continue anyway - app should still work
      return false;
    }
  }

  async setupNetworkListener() {
    NetworkService.addListener(state => {
      if (state.isConnected && !this.isSyncing) {
        console.log('📶 Network connected - starting sync');
        this.performSync();
      }
    });
  }

  startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, 5 * 60 * 1000); // 5 minutes
  }

  async performSync() {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    const isOnline = await NetworkService.isOnline();
    if (!isOnline) {
      console.log('📵 No network - skipping sync');
      return { success: false, message: 'No network connection' };
    }

    this.isSyncing = true;
    this.notifyListeners({ isSyncing: true });
    console.log('🔄 Starting sync...');

    try {
      const status = await this.getSyncStatus();
      console.log('📊 Sync status:', status);
      
      if (status.pending === 0) {
        console.log('✅ No data to sync - all up to date!');
        return { success: true, message: 'No data to sync', synced: 0 };
      }

      let totalSynced = 0;
      totalSynced += await this.syncWaterTests();
      totalSynced += await this.syncHealthReports();
      totalSynced += await this.syncIssueReports();
      totalSynced += await this.syncHouseholdSurveys();
      totalSynced += await this.syncServiceRequests();
      // Optionally download server updates (disabled for now)
      // await this.downloadServerUpdates();
      
      console.log(`✅ Sync completed successfully - ${totalSynced} records synced`);
      return { success: true, message: `Synced ${totalSynced} records`, synced: totalSynced };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return { success: false, message: error.message, error };
    } finally {
      this.isSyncing = false;
      this.notifyListeners({ isSyncing: false });
    }
  }

  async syncWaterTests() {
    const unsynced = await DatabaseService.getUnsyncedRecords('water_tests');
    console.log(`📤 Syncing ${unsynced.length} water tests`);

    let synced = 0;
    for (const test of unsynced) {
      try {
        const result = await this.uploadWaterTest(test);
        // Only mark as synced if BOTH backend and Firebase succeeded
        if (result.backendSuccess && result.firestoreSuccess) {
          await DatabaseService.markAsSynced('water_tests', test.id);
          console.log(`✅ Synced water test: ${test.id} (Backend + Firebase)`);
          synced++;
        } else if (result.firestoreSuccess) {
          console.log(`⚠️ Water test ${test.id} synced to Firebase only - backend failed`);
          await DatabaseService.incrementSyncAttempts('water_tests', test.id);
        } else {
          console.log(`❌ Water test ${test.id} failed to sync`);
          await DatabaseService.incrementSyncAttempts('water_tests', test.id);
        }
      } catch (error) {
        console.log(`ℹ️ Water test ${test.id} saved locally - will sync when backend is available`);
        await DatabaseService.incrementSyncAttempts('water_tests', test.id);
      }
    }
    return synced;
  }

  async syncHealthReports() {
    const unsynced = await DatabaseService.getUnsyncedRecords('health_reports');
    console.log(`📤 Syncing ${unsynced.length} health reports`);

    let synced = 0;
    for (const report of unsynced) {
      try {
        const result = await this.uploadHealthReport(report);
        // Only mark as synced if backend succeeded
        if (result.success) {
          await DatabaseService.markAsSynced('health_reports', report.id);
          console.log(`✅ Synced health report: ${report.id}`);
          synced++;
        } else {
          console.log(`❌ Health report ${report.id} failed to sync to backend`);
          await DatabaseService.incrementSyncAttempts('health_reports', report.id);
        }
      } catch (error) {
        console.log(`ℹ️ Health report ${report.id} saved locally - will sync when backend is available`);
        await DatabaseService.incrementSyncAttempts('health_reports', report.id);
      }
    }
    return synced;
  }

  async syncIssueReports() {
    const unsynced = await DatabaseService.getUnsyncedRecords('water_issue_reports');
    console.log(`📤 Syncing ${unsynced.length} issue reports`);

    let synced = 0;
    for (const issue of unsynced) {
      try {
        const result = await this.uploadIssueReport(issue);
        // Only mark as synced if backend succeeded
        if (result.success) {
          await DatabaseService.markAsSynced('water_issue_reports', issue.id);
          console.log(`✅ Synced issue report: ${issue.id}`);
          synced++;
        } else {
          console.log(`❌ Issue report ${issue.id} failed to sync to backend`);
          await DatabaseService.incrementSyncAttempts('water_issue_reports', issue.id);
        }
      } catch (error) {
        console.log(`ℹ️ Issue report ${issue.id} saved locally - will sync when backend is available`);
        await DatabaseService.incrementSyncAttempts('water_issue_reports', issue.id);
      }
    }
    return synced;
  }

  async syncHouseholdSurveys() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const surveysData = await AsyncStorage.getItem('pending_household_surveys');
      const surveys = JSON.parse(surveysData || '[]');
      
      const unsynced = surveys.filter(s => s.synced !== 1);
      console.log(`📤 Syncing ${unsynced.length} household surveys`);

      let synced = 0;
      for (const survey of unsynced) {
        try {
          const result = await this.uploadHouseholdSurvey(survey);
          
          // Only mark as synced if BOTH backend and Firebase succeeded
          if (result.backendSuccess && result.firestoreSuccess) {
            const index = surveys.findIndex(s => s.id === survey.id);
            if (index !== -1) {
              surveys[index].synced = 1;
              surveys[index].updatedAt = new Date().toISOString();
            }
            console.log(`✅ Synced household survey: ${survey.id} (Backend + Firebase)`);
            synced++;
          } else if (result.firestoreSuccess) {
            console.log(`⚠️ Household survey ${survey.id} synced to Firebase only - backend failed`);
          } else {
            console.log(`❌ Household survey ${survey.id} failed to sync`);
          }
        } catch (error) {
          console.log(`ℹ️ Household survey ${survey.id} saved locally - will sync when backend is available`);
        }
      }

      // Save updated surveys back to AsyncStorage
      await AsyncStorage.setItem('pending_household_surveys', JSON.stringify(surveys));
      return synced;
    } catch (error) {
      console.error('❌ Error syncing household surveys:', error);
      return 0;
    }
  }

  async uploadWaterTest(test) {
    const firestore = require('@react-native-firebase/firestore').default;
    const auth = require('@react-native-firebase/auth').default;
    
    // Format data to match backend expectations exactly
    const formattedTest = {
      id: test.id,
      sourceType: test.sourceType,
      sourceName: test.sourceName || '',
      appearance: test.appearance || 'clear',
      odour: test.odour === 'no_smell' ? 'none' : (test.odour || 'none'),
      suspendedMatter: test.suspendedMatter || 'none',
      pH: test.pH ? String(test.pH) : '7.0',
      frc: test.frc || 'not_tested',
      turbidity: test.turbidity || 'low',
      tds: test.tds ? Number(test.tds) : null,
      hardness: test.hardness || 'moderate',
      geogenicParameter: test.geogenicParameter || 'none',
      rainfall24h: test.rainfall24h === 'yes' ? 'yes' : 'no',
      nearbyRiskActivity: Array.isArray(test.nearbyRiskActivity) ? test.nearbyRiskActivity : [],
      chlorination: test.chlorination || null,
      storageMethod: test.storageMethod || null,
      photoPath: test.photoPath || null,
      riskLevel: test.riskLevel || 'Low',
      latitude: test.latitude || null,
      longitude: test.longitude || null,
      reporterId: test.reporterId || 'ASHA001',
      reporterType: test.reporterType || 'ASHA',
      status: 'pending_sync',
      synced: 0,
    };

    console.log('📤 Uploading water test:', formattedTest.id);
    
    let backendSuccess = false;
    let firestoreSuccess = false;
    
    // 1. Upload to backend API (existing workflow)
    try {
      const response = await fetch(`${this.apiBaseUrl}${API_ENDPOINTS.WATER_TESTS}`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(formattedTest),
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`❌ Backend upload failed: ${response.status} - ${error}`);
        backendSuccess = false;
      } else {
        console.log('✅ Water test uploaded to backend');
        backendSuccess = true;
      }
    } catch (error) {
      console.log('❌ Backend not available:', error.message);
      backendSuccess = false;
    }

    // 2. ADDITIONALLY save to Firestore for PHC visibility
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('⚠️ No user logged in, skipping Firestore sync');
        return { backendSuccess, firestoreSuccess: false };
      }

      // Get ASHA worker profile to link PHC
      const ashaDoc = await firestore()
        .collection('asha_workers')
        .doc(currentUser.uid)
        .get();
      
      const ashaData = ashaDoc.exists ? ashaDoc.data() : {};
      const phcId = ashaData.phcId || 'unknown';

      // Save to water_tests collection (filter out undefined values)
      const firestoreData = Object.entries({
        ...formattedTest,
        ashaId: currentUser.uid,
        ashaName: ashaData.name || 'ASHA Worker',
        phcId: phcId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      await firestore()
        .collection('water_tests')
        .doc(test.id)
        .set(firestoreData);
      
      console.log('✅ Water test saved to Firestore');
      firestoreSuccess = true;
    } catch (firestoreError) {
      console.error('❌ Firestore sync error:', firestoreError);
      firestoreSuccess = false;
    }

    return { backendSuccess, firestoreSuccess };
  }

  async uploadHealthReport(report) {
    const userId = auth().currentUser?.uid || 'anonymous';
    
    try {
      const response = await fetch(`${this.apiBaseUrl}${API_ENDPOINTS.HEALTH_REPORTS}`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          ...report,
          uploaded_by: userId,
          uploaded_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`❌ Backend upload failed: ${response.status} - ${error}`);
        return { success: false, error };
      }

      const result = await response.json();
      console.log('✅ Health report uploaded to backend');
      return { success: true, data: result };
    } catch (error) {
      console.log('❌ Backend not available:', error.message);
      return { success: false, error: error.message };
    }
  }

  async uploadIssueReport(issue) {
    const userId = auth().currentUser?.uid || 'anonymous';
    
    try {
      const response = await fetch(`${this.apiBaseUrl}${API_ENDPOINTS.ISSUE_REPORTS}`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          ...issue,
          uploaded_by: userId,
          uploaded_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`❌ Backend upload failed: ${response.status} - ${error}`);
        return { success: false, error };
      }

      const result = await response.json();
      console.log('✅ Issue report uploaded to backend');
      return { success: true, data: result };
    } catch (error) {
      console.log('❌ Backend not available:', error.message);
      return { success: false, error: error.message };
    }
  }

  async uploadHouseholdSurvey(survey) {
    const firestore = require('@react-native-firebase/firestore').default;
    const auth = require('@react-native-firebase/auth').default;
    
    // Format data to match backend expectations
    const formattedSurvey = {
      id: survey.id,
      state: survey.state,
      district: survey.district,
      block: survey.block,
      village: survey.village,
      householdId: survey.householdId,
      dateOfVisit: survey.dateOfVisit,
      filedBy: survey.filedBy,
      contactNumber: survey.contactNumber,
      gpsLocation: survey.gpsLocation,
      headOfHousehold: survey.headOfHousehold,
      totalMembers: survey.totalMembers,
      age0to5: survey.age0to5,
      age6to18: survey.age6to18,
      age19to50: survey.age19to50,
      age50plus: survey.age50plus,
      socialCategory: survey.socialCategory,
      educationLevel: survey.educationLevel,
      waterSource: survey.waterSource,
      waterTreatment: survey.waterTreatment,
      storageType: survey.storageType,
      distanceFromSource: survey.distanceFromSource,
      sharedSource: survey.sharedSource,
      toiletFacility: survey.toiletFacility,
      handwashing: survey.handwashing,
      wastewaterDisposal: survey.wastewaterDisposal,
      solidWasteDisposal: survey.solidWasteDisposal,
      members: survey.members,
      riskLevel: survey.riskLevel,
      waterContaminationLikelihood: survey.waterContaminationLikelihood,
      recommendedAction: survey.recommendedAction,
      consentData: survey.consentData,
      synced: 0,
      status: 'pending_sync',
    };

    console.log('📤 Uploading survey:', formattedSurvey.id);
    
    let backendSuccess = false;
    let firestoreSuccess = false;
    
    // 1. Upload to backend API (existing workflow - keep as is)
    try {
      const response = await fetch(`${this.apiBaseUrl}${API_ENDPOINTS.HOUSEHOLD_SURVEYS}`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(formattedSurvey),
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`❌ Backend upload failed: ${response.status} - ${error}`);
        backendSuccess = false;
      } else {
        console.log('✅ Survey uploaded to backend');
        backendSuccess = true;
      }
    } catch (error) {
      console.log('❌ Backend not available:', error.message);
      backendSuccess = false;
    }

    // 2. ADDITIONALLY save to Firestore for PHC visibility
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('⚠️ No user logged in, skipping Firestore sync');
        return { backendSuccess, firestoreSuccess: false };
      }
      
      console.log('🔥 Starting Firestore sync for survey:', survey.id);

      // Get ASHA worker profile to link PHC
      const ashaDoc = await firestore()
        .collection('asha_workers')
        .doc(currentUser.uid)
        .get();
      
      const ashaData = ashaDoc.exists ? ashaDoc.data() : {};
      const phcId = ashaData.phcId || 'unknown';

      // Save to household_surveys collection (filter out undefined values)
      const firestoreData = Object.entries({
        ...formattedSurvey,
        ashaId: currentUser.uid,
        ashaName: ashaData.name || survey.filedBy,
        phcId: phcId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      console.log('🔥 Saving to Firestore collection: household_surveys, doc:', survey.id);
      
      await firestore()
        .collection('household_surveys')
        .doc(survey.id)
        .set(firestoreData);
      
      console.log('✅ Survey saved to Firestore for PHC visibility');
      firestoreSuccess = true;

      // If high risk, create a referral for PHC
      if (survey.riskLevel === 'high' || survey.riskLevel === 'critical') {
        const referralId = `ref_${survey.id}`;
        
        // Extract age from household head (if available in members array)
        let patientAge = 'Unknown';
        let patientGender = 'Unknown';
        if (survey.members && survey.members.length > 0) {
          const head = survey.members.find(m => m.relation === 'Self' || m.relation === 'Head');
          if (head) {
            patientAge = head.age || 'Unknown';
            patientGender = head.gender || 'Unknown';
          }
        }
        
        // Convert recommendedAction to symptoms array
        const symptomsArray = survey.recommendedAction 
          ? [survey.recommendedAction, `Risk Level: ${survey.riskLevel}`]
          : [`High risk household - ${survey.riskLevel} risk`];
        
        // Add water contamination info if available
        if (survey.waterContaminationLikelihood) {
          symptomsArray.push(`Water contamination: ${survey.waterContaminationLikelihood}`);
        }
        
        // Filter out undefined values for referral
        const referralData = Object.entries({
          id: referralId,
          type: 'household_survey',
          surveyId: survey.id,
          householdId: survey.householdId,
          patientName: survey.headOfHousehold || 'Unknown',
          patientAge: patientAge,
          patientGender: patientGender,
          village: survey.village || 'Unknown',
          district: survey.district || 'Unknown',
          block: survey.block || 'Unknown',
          riskLevel: survey.riskLevel,
          symptoms: symptomsArray,
          priority: survey.riskLevel === 'critical' ? 'high' : 'medium',
          ashaId: currentUser.uid,
          ashaName: ashaData.name || survey.filedBy || 'ASHA Worker',
          phcId: phcId,
          status: 'pending',
          urgent: survey.riskLevel === 'critical',
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {});
        
        // Actually save the referral to Firestore
        await firestore()
          .collection('referrals')
          .doc(referralId)
          .set(referralData);
        
        console.log('✅ High-risk referral created for PHC');
      }
    } catch (firestoreError) {
      console.error('❌ Firestore sync error:', firestoreError);
      firestoreSuccess = false;
    }

    return { backendSuccess, firestoreSuccess };
  }

  async downloadServerUpdates() {
    try {
      const lastSync = await DatabaseService.getLastSyncTimestamp();
      console.log('📥 Downloading server updates since:', lastSync);
      
      const response = await fetch(`${this.apiBaseUrl}${API_ENDPOINTS.SYNC_UPDATES}?since=${lastSync}`, {
        method: 'GET',
        headers: API_HEADERS,
      });

      if (response.ok) {
        const updates = await response.json();
        console.log('📥 Downloaded updates:', updates);
        // Process updates as needed
        return updates;
      } else {
        console.warn('⚠️ No updates available or server error');
      }
    } catch (error) {
      console.error('❌ Failed to download updates:', error);
    }
  }

  async forceSyncNow() {
    console.log('🔄 Force sync requested by user');
    await this.performSync();
  }

  async getSyncStatus() {
    try {
      const waterTests = await DatabaseService.getUnsyncedCount('water_tests');
      const healthReports = await DatabaseService.getUnsyncedCount('health_reports');
      const issueReports = await DatabaseService.getUnsyncedCount('water_issue_reports');
      
      // Get household surveys count from AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const surveysData = await AsyncStorage.getItem('pending_household_surveys');
      const surveys = JSON.parse(surveysData || '[]');
      const householdSurveys = surveys.filter(s => s.synced !== 1).length;

      return {
        pending: waterTests + healthReports + issueReports + householdSurveys,
        waterTests,
        healthReports,
        issueReports,
        householdSurveys,
        isSyncing: this.isSyncing,
        lastSync: await DatabaseService.getLastSyncTimestamp(),
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        pending: 0,
        waterTests: 0,
        healthReports: 0,
        issueReports: 0,
        householdSurveys: 0,
        isSyncing: false,
        lastSync: 0,
      };
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(data) {
    this.listeners.forEach(callback => callback(data));
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync service requests to Firebase
   */
  async syncServiceRequests() {
    try {
      const { getPendingServiceRequests, markServiceRequestSynced } = require('../database/operations');
      const firestore = require('@react-native-firebase/firestore').default;
      
      const unsynced = await getPendingServiceRequests();
      console.log(`📤 Syncing ${unsynced.length} service requests`);

      let synced = 0;
      for (const request of unsynced) {
        try {
          // Helper function to safely convert to Firestore Timestamp
          const toTimestamp = (dateValue) => {
            if (!dateValue) return null;
            try {
              const date = new Date(dateValue);
              // Check if date is valid
              if (isNaN(date.getTime())) return null;
              return firestore.Timestamp.fromDate(date);
            } catch (error) {
              console.warn('Invalid date value:', dateValue);
              return null;
            }
          };

          // Prepare data for Firebase (convert ISO strings to Firestore timestamps)
          const firestoreData = {
            type: request.type,
            priority: request.priority,
            description: request.description,
            preferredTime: request.preferredTime,
            status: request.status,
            acknowledged: request.acknowledged || false,
            acknowledgedAt: toTimestamp(request.acknowledgedAt),
            acknowledgedBy: request.acknowledgedBy || null,
            alertSent: request.alertSent || false,
            alertSentAt: toTimestamp(request.alertSentAt),
            createdAt: toTimestamp(request.createdAt) || firestore.FieldValue.serverTimestamp(),
            updatedAt: toTimestamp(request.updatedAt) || firestore.FieldValue.serverTimestamp(),
            assignedAt: toTimestamp(request.assignedAt),
            completedAt: toTimestamp(request.completedAt),
            residentId: request.residentId,
            residentName: request.residentName,
            residentPhone: request.residentPhone,
            village: request.village,
            block: request.block,
            district: request.district,
            householdId: request.householdId,
            assignedTo: request.assignedTo || null,
            assignedAshaId: request.assignedAshaId || null,
            assignedAshaName: request.assignedAshaName || null,
            consentGiven: request.consentGiven || false,
            consentTimestamp: toTimestamp(request.consentTimestamp),
            attachments: request.attachments || [],
            notes: request.notes || [],
            statusHistory: request.statusHistory || [],
          };

          // Upload to Firebase only (no backend for service requests yet)
          const docRef = await firestore()
            .collection('service_requests')
            .add(firestoreData);

          // Mark as synced in local database (Firebase only for now)
          await markServiceRequestSynced(request.id, docRef.id);
          
          synced++;
          console.log(`✅ Service request synced to Firebase: ${request.id} → ${docRef.id}`);
        } catch (error) {
          console.error(`❌ Failed to sync service request ${request.id}:`, error);
        }
      }

      console.log(`✅ Synced ${synced}/${unsynced.length} service requests`);
      return synced;
    } catch (error) {
      console.error('❌ Error syncing service requests:', error);
      return 0;
    }
  }
}

export default new SyncService();
