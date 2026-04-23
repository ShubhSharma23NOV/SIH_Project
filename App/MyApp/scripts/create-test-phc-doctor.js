/**
 * Script to create a test PHC doctor profile in Firestore
 * Run this after setting up test phone numbers in Firebase Console
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (you need to add your service account key)
// Download from: Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestPHCDoctor() {
  try {
    // Test phone number (must match what you added in Firebase Console)
    const testPhone = '+919999999999';
    
    // Get or create user with this phone number
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByPhoneNumber(testPhone);
      console.log('✅ User already exists:', userRecord.uid);
    } catch (error) {
      // Create user if doesn't exist
      userRecord = await admin.auth().createUser({
        phoneNumber: testPhone,
      });
      console.log('✅ Created new user:', userRecord.uid);
    }

    // Create PHC doctor profile in Firestore
    const phcData = {
      uid: userRecord.uid,
      phoneNumber: testPhone,
      name: 'Dr. Test Kumar',
      nameHindi: 'डॉ. टेस्ट कुमार',
      phcId: 'PHC001',
      phcName: 'Test Primary Health Center',
      phcNameHindi: 'टेस्ट प्राथमिक स्वास्थ्य केंद्र',
      district: 'Test District',
      districtHindi: 'टेस्ट जिला',
      block: 'Test Block',
      blockHindi: 'टेस्ट ब्लॉक',
      assignedAreas: ['area1', 'area2', 'area3'],
      role: 'PHC_DOCTOR',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('phc_doctors').doc(userRecord.uid).set(phcData);
    console.log('✅ PHC doctor profile created successfully!');
    console.log('📱 Phone:', testPhone);
    console.log('🔑 UID:', userRecord.uid);
    console.log('👨‍⚕️ Name:', phcData.name);
    console.log('🏥 PHC:', phcData.phcName);
    
    console.log('\n🎉 Setup complete! You can now login with:');
    console.log('   Phone: 9999999999 (without +91)');
    console.log('   OTP: 123456 (or whatever you set in Firebase Console)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestPHCDoctor();
