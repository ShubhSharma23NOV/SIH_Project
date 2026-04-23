/**
 * Database Operations
 * CRUD operations for water tests with offline sync support
 */

import { getDatabase } from './database';
import DatabaseService from './DatabaseService';

/**
 * Generate unique water test ID
 */
const generateWaterTestId = () => {
  return `water_test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Save water test offline
 * @param {Object} waterTest - Water test data
 * @returns {Promise<string>} Test ID
 */
export const saveWaterTestOffline = async (waterTest) => {
  const db = getDatabase();
  const testId = generateWaterTestId();
  const timestamp = new Date().toISOString();

  // Convert nearbyRiskActivity array to JSON string
  const nearbyRiskActivityJson = JSON.stringify(waterTest.nearbyRiskActivity || []);

  const insertQuery = `
    INSERT INTO water_tests (
      id, sourceType, sourceName, appearance, odour, suspendedMatter,
      pH, frc, turbidity, tds, hardness, geogenicParameter,
      rainfall24h, nearbyRiskActivity, chlorination, storageMethod,
      photoPath, riskLevel, latitude, longitude,
      createdAt, updatedAt, reporterId, reporterType, status, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const params = [
    testId,
    waterTest.sourceType || null,
    waterTest.sourceName || null,
    waterTest.appearance || null,
    waterTest.odour || null,
    waterTest.suspendedMatter || null,
    waterTest.pH || null,
    waterTest.frc || null,
    waterTest.turbidity || null,
    waterTest.tds || null,
    waterTest.hardness || null,
    waterTest.geogenicParameter || null,
    waterTest.rainfall24h || null,
    nearbyRiskActivityJson,
    waterTest.chlorination || null,
    waterTest.storageMethod || null,
    waterTest.photoPath || null,
    waterTest.riskLevel || null,
    waterTest.latitude || null,
    waterTest.longitude || null,
    timestamp,
    timestamp,
    waterTest.reporterId || null,
    waterTest.reporterType || 'ASHA',
    'pending_sync',
    0, // synced = 0 (not synced yet)
  ];

  await db.executeSql(insertQuery, params);
  console.log('✅ Water test saved offline:', testId, '| synced: 0 | status: pending_sync');
  return testId;
};

/**
 * Get pending water tests
 * @returns {Promise<Array>} Array of pending tests
 */
export const getPendingWaterTests = async () => {
  const db = getDatabase();
  const query = `SELECT * FROM water_tests WHERE status = 'pending_sync' ORDER BY createdAt DESC;`;
  const [results] = await db.executeSql(query);

  const tests = [];
  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    tests.push({
      ...row,
      nearbyRiskActivity: row.nearbyRiskActivity ? JSON.parse(row.nearbyRiskActivity) : [],
    });
  }

  return tests;
};

/**
 * Get all water tests
 * @returns {Promise<Array>} Array of all tests
 */
export const getAllWaterTests = async () => {
  const db = getDatabase();
  const query = `SELECT * FROM water_tests ORDER BY createdAt DESC;`;
  const [results] = await db.executeSql(query);

  const tests = [];
  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    tests.push({
      ...row,
      nearbyRiskActivity: row.nearbyRiskActivity ? JSON.parse(row.nearbyRiskActivity) : [],
      // Ensure synced is a number (0 or 1) for consistent checking
      synced: row.synced !== undefined && row.synced !== null ? row.synced : 0,
    });
  }

  return tests;
};

/**
 * Get water test by ID
 * @param {string} testId - Test ID
 * @returns {Promise<Object|null>} Test data or null
 */
export const getWaterTestById = async (testId) => {
  const db = getDatabase();
  const query = `SELECT * FROM water_tests WHERE id = ?;`;
  const [results] = await db.executeSql(query, [testId]);

  if (results.rows.length === 0) return null;

  const row = results.rows.item(0);
  return {
    ...row,
    nearbyRiskActivity: row.nearbyRiskActivity ? JSON.parse(row.nearbyRiskActivity) : [],
  };
};

/**
 * Update water test status
 * @param {string} testId - Test ID
 * @param {string} status - New status
 */
export const updateWaterTestStatus = async (testId, status) => {
  const db = getDatabase();
  const query = `UPDATE water_tests SET status = ?, updatedAt = ? WHERE id = ?;`;
  await db.executeSql(query, [status, new Date().toISOString(), testId]);
  console.log(`✅ Water test ${testId} status updated to ${status}`);
};

/**
 * Delete water test
 * @param {string} testId - Test ID
 */
export const deleteWaterTest = async (testId) => {
  const db = getDatabase();
  const query = `DELETE FROM water_tests WHERE id = ?;`;
  await db.executeSql(query, [testId]);
  console.log('✅ Water test deleted:', testId);
};

export default {
  saveWaterTestOffline,
  getPendingWaterTests,
  getAllWaterTests,
  getWaterTestById,
  updateWaterTestStatus,
  deleteWaterTest,
};


/**
 * ============================================
 * SERVICE REQUEST OPERATIONS
 * ============================================
 */

/**
 * Generate unique service request ID
 */
const generateServiceRequestId = () => {
  return `service_request_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Save service request offline
 * @param {Object} request - Service request data
 * @returns {Promise<string>} Request ID
 */
export const saveServiceRequestOffline = async (request) => {
  const db = getDatabase();
  const requestId = generateServiceRequestId();
  const timestamp = new Date().toISOString();

  // Convert arrays/objects to JSON strings
  const attachmentsJson = JSON.stringify(request.attachments || []);
  const notesJson = JSON.stringify(request.notes || []);
  const statusHistoryJson = JSON.stringify(request.statusHistory || []);

  const insertQuery = `
    INSERT INTO service_requests (
      id, type, priority, description, preferredTime, status,
      acknowledged, acknowledgedAt, acknowledgedBy,
      alertSent, alertSentAt,
      createdAt, updatedAt, assignedAt, completedAt,
      residentId, residentName, residentPhone,
      village, block, district, householdId,
      assignedTo, assignedAshaId, assignedAshaName,
      consentGiven, consentTimestamp,
      attachments, notes, statusHistory,
      synced, firebaseId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const params = [
    requestId,
    request.type || null,
    request.priority || 'medium',
    request.description || null,
    request.preferredTime || 'anytime',
    request.status || 'assigned',
    request.acknowledged ? 1 : 0,
    request.acknowledgedAt || null,
    request.acknowledgedBy || null,
    request.alertSent ? 1 : 0,
    request.alertSentAt || null,
    timestamp,
    timestamp,
    request.assignedAt || timestamp,
    request.completedAt || null,
    request.residentId || null,
    request.residentName || 'Resident',
    request.residentPhone || 'Not provided',
    request.village || 'Not specified',
    request.block || 'Meghalaya',
    request.district || 'Meghalaya',
    request.householdId || null,
    request.assignedTo || null,
    request.assignedAshaId || null,
    request.assignedAshaName || 'ASHA Worker',
    request.consentGiven ? 1 : 0,
    request.consentTimestamp || timestamp,
    attachmentsJson,
    notesJson,
    statusHistoryJson,
    0, // synced = 0 (not synced yet)
    null, // firebaseId will be set after sync
  ];

  await db.executeSql(insertQuery, params);
  console.log('✅ Service request saved offline:', requestId, '| synced: 0');
  return requestId;
};

/**
 * Get pending service requests (not synced)
 * @returns {Promise<Array>} Array of pending requests
 */
export const getPendingServiceRequests = async () => {
  const db = getDatabase();
  const query = `SELECT * FROM service_requests WHERE synced = 0 ORDER BY createdAt DESC;`;
  const [results] = await db.executeSql(query);

  const requests = [];
  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    requests.push({
      ...row,
      acknowledged: row.acknowledged === 1,
      alertSent: row.alertSent === 1,
      consentGiven: row.consentGiven === 1,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      notes: row.notes ? JSON.parse(row.notes) : [],
      statusHistory: row.statusHistory ? JSON.parse(row.statusHistory) : [],
    });
  }

  return requests;
};

/**
 * Get all service requests
 * @returns {Promise<Array>} Array of all requests
 */
export const getAllServiceRequests = async () => {
  const db = getDatabase();
  const query = `SELECT * FROM service_requests ORDER BY createdAt DESC;`;
  const [results] = await db.executeSql(query);

  const requests = [];
  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    requests.push({
      ...row,
      acknowledged: row.acknowledged === 1,
      alertSent: row.alertSent === 1,
      consentGiven: row.consentGiven === 1,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      notes: row.notes ? JSON.parse(row.notes) : [],
      statusHistory: row.statusHistory ? JSON.parse(row.statusHistory) : [],
    });
  }

  return requests;
};

/**
 * Mark service request as synced
 * @param {string} requestId - Local request ID
 * @param {string} firebaseId - Firebase document ID
 */
export const markServiceRequestSynced = async (requestId, firebaseId) => {
  const db = getDatabase();
  const query = `
    UPDATE service_requests 
    SET synced = 1, firebaseId = ?, updatedAt = ? 
    WHERE id = ?;
  `;
  await db.executeSql(query, [firebaseId, new Date().toISOString(), requestId]);
  console.log('✅ Service request marked as synced:', requestId, '→', firebaseId);
};

/**
 * Delete service request
 * @param {string} requestId - Request ID
 */
export const deleteServiceRequest = async (requestId) => {
  const db = getDatabase();
  const query = `DELETE FROM service_requests WHERE id = ?;`;
  await db.executeSql(query, [requestId]);
  console.log('✅ Service request deleted:', requestId);
};

/**
 * Get service request by ID
 * @param {string} requestId - Request ID
 * @returns {Promise<Object|null>} Request object or null
 */
export const getServiceRequestById = async (requestId) => {
  const db = getDatabase();
  const query = `SELECT * FROM service_requests WHERE id = ? OR firebaseId = ?;`;
  const [results] = await db.executeSql(query, [requestId, requestId]);

  if (results.rows.length === 0) {
    return null;
  }

  const row = results.rows.item(0);
  return {
    ...row,
    acknowledged: row.acknowledged === 1,
    alertSent: row.alertSent === 1,
    consentGiven: row.consentGiven === 1,
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
    notes: row.notes ? JSON.parse(row.notes) : [],
    statusHistory: row.statusHistory ? JSON.parse(row.statusHistory) : [],
  };
};

/**
 * Update service request status
 * @param {string} requestId - Request ID
 * @param {string} status - New status
 */
export const updateServiceRequestStatus = async (requestId, status) => {
  const db = getDatabase();
  const query = `
    UPDATE service_requests 
    SET status = ?, updatedAt = ?, synced = 0
    WHERE id = ? OR firebaseId = ?;
  `;
  await db.executeSql(query, [status, new Date().toISOString(), requestId, requestId]);
  console.log('✅ Service request status updated:', requestId, '→', status);
};
