/**
 * Backend Integration Example
 * How to integrate the acknowledgment system with your backend
 */

// ============================================
// 1. APP INITIALIZATION (App.js or similar)
// ============================================

import RequestMonitorService from './src/services/RequestMonitorService';

// Initialize when app starts
async function initializeApp() {
  // Set your backend URL
  const BACKEND_URL = 'https://your-backend-api.com'; // CHANGE THIS
  
  await RequestMonitorService.initialize(BACKEND_URL);
  console.log('✅ Request monitoring initialized');
}

// ============================================
// 2. ASHA LOGIN (After successful authentication)
// ============================================

async function onAshaLogin() {
  // Start monitoring when ASHA logs in
  RequestMonitorService.startMonitoring();
  console.log('🔍 Request monitoring started');
}

// ============================================
// 3. ASHA LOGOUT
// ============================================

async function onAshaLogout() {
  // Stop monitoring when ASHA logs out
  RequestMonitorService.stopMonitoring();
  console.log('🛑 Request monitoring stopped');
}

// ============================================
// 4. BACKEND API ENDPOINT (Node.js/Express Example)
// ============================================

/*
// Install dependencies:
// npm install express body-parser twilio nodemailer

const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio'); // For SMS
const nodemailer = require('nodemailer'); // For Email

const app = express();
app.use(bodyParser.json());

// Twilio configuration (for SMS)
const twilioClient = twilio(
  'YOUR_TWILIO_ACCOUNT_SID',
  'YOUR_TWILIO_AUTH_TOKEN'
);

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

// Supervisor contact details
const SUPERVISOR_PHONE = '+919876543210'; // CHANGE THIS
const SUPERVISOR_EMAIL = 'supervisor@example.com'; // CHANGE THIS

// Alert endpoint
app.post('/api/alerts/unacknowledged-request', async (req, res) => {
  try {
    const alert = req.body;
    
    console.log('🚨 Received unacknowledged request alert:', {
      requestId: alert.requestId,
      priority: alert.priority,
      ashaName: alert.assignedAshaName,
      village: alert.village
    });

    // 1. Send SMS to supervisor
    try {
      await twilioClient.messages.create({
        body: `URGENT: Service request not acknowledged!\n\nRequest ID: ${alert.requestId}\nType: ${alert.type}\nPriority: ${alert.priority}\nResident: ${alert.residentName}\nVillage: ${alert.village}\nASHA: ${alert.assignedAshaName}\n\nPlease follow up immediately.`,
        from: '+1234567890', // Your Twilio number
        to: SUPERVISOR_PHONE
      });
      console.log('✅ SMS sent to supervisor');
    } catch (smsError) {
      console.error('❌ SMS error:', smsError);
    }

    // 2. Send email to supervisor
    try {
      await emailTransporter.sendMail({
        from: 'ArogyaJal System <noreply@arogya-jal.com>',
        to: SUPERVISOR_EMAIL,
        subject: `🚨 URGENT: Unacknowledged Service Request - ${alert.requestId}`,
        html: `
          <h2 style="color: #f59e0b;">⚠️ Unacknowledged Service Request Alert</h2>
          
          <p>A service request has not been acknowledged within 24 hours:</p>
          
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Request ID</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${alert.requestId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Type</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${alert.type}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Priority</td>
              <td style="padding: 8px; border: 1px solid #ddd; color: ${alert.priority === 'high' ? '#ef4444' : '#f59e0b'};">${alert.priority.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Resident</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${alert.residentName} (${alert.residentPhone})</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Village</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${alert.village}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">ASHA Worker</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${alert.assignedAshaName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Created</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date(alert.createdAt).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Description</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${alert.description}</td>
            </tr>
          </table>
          
          <p style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
            <strong>Action Required:</strong> Please contact the ASHA worker immediately to ensure this request is addressed.
          </p>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This is an automated alert from the ArogyaJal system.
          </p>
        `
      });
      console.log('✅ Email sent to supervisor');
    } catch (emailError) {
      console.error('❌ Email error:', emailError);
    }

    // 3. Log to database (example with MongoDB)
    // await db.collection('alerts').insertOne({
    //   ...alert,
    //   processedAt: new Date(),
    //   notificationsSent: {
    //     sms: true,
    //     email: true
    //   }
    // });

    // 4. Send push notification to ASHA (if you have push notification service)
    // await sendPushNotification({
    //   userId: alert.assignedAshaId,
    //   title: 'Urgent: Acknowledge Request',
    //   body: `Please acknowledge request from ${alert.residentName}`,
    //   data: { requestId: alert.requestId }
    // });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Alert received and processed',
      requestId: alert.requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing alert:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
*/

// ============================================
// 5. TESTING THE SYSTEM
// ============================================

async function testAcknowledgmentSystem() {
  // Test 1: Check if monitoring is working
  console.log('Test 1: Manual check for unacknowledged requests');
  await RequestMonitorService.manualCheck();
  
  // Test 2: Get unacknowledged requests for an ASHA
  console.log('Test 2: Get unacknowledged requests');
  const ashaId = 'QpGf6zy9RNZssgRgpYY0afoUNKb2';
  const unacknowledged = await RequestMonitorService.getUnacknowledgedRequests(ashaId);
  console.log('Unacknowledged requests:', unacknowledged.length);
  
  // Test 3: Simulate old request (for testing)
  // Manually update a request in Firestore:
  // - Set createdAt to 25 hours ago
  // - Set acknowledged to false
  // - Set alertSent to false
  // Then run manual check
}

// ============================================
// 6. ALTERNATIVE: CLOUD FUNCTION (Firebase)
// ============================================

/*
// If you prefer Firebase Cloud Functions instead of your own backend:

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Scheduled function that runs every hour
exports.checkUnacknowledgedRequests = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const twentyFourHoursAgo = new Date(now.toDate().getTime() - 24 * 60 * 60 * 1000);
    
    const snapshot = await admin.firestore()
      .collection('service_requests')
      .where('acknowledged', '==', false)
      .where('alertSent', '==', false)
      .where('createdAt', '<=', twentyFourHoursAgo)
      .get();
    
    console.log(`Found ${snapshot.docs.length} unacknowledged requests`);
    
    for (const doc of snapshot.docs) {
      const request = doc.data();
      
      // Send notifications
      // ... (same logic as above)
      
      // Mark as alert sent
      await doc.ref.update({
        alertSent: true,
        alertSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return null;
  });
*/

// ============================================
// 7. CONFIGURATION
// ============================================

const CONFIG = {
  // Backend URL (change this to your actual backend)
  BACKEND_URL: 'https://your-backend-api.com',
  
  // Check interval (in milliseconds)
  CHECK_INTERVAL: 30 * 60 * 1000, // 30 minutes
  
  // Acknowledgment deadline (in hours)
  DEADLINE_HOURS: 24,
  
  // Supervisor contacts
  SUPERVISOR_PHONE: '+919876543210',
  SUPERVISOR_EMAIL: 'supervisor@example.com',
};

export { initializeApp, onAshaLogin, onAshaLogout, testAcknowledgmentSystem, CONFIG };
