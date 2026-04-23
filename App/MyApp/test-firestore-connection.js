/**
 * Quick Firestore Connection Test
 * Run this to verify Firestore is working and check what data exists
 */

import firestore from '@react-native-firebase/firestore';

export const testFirestoreConnection = async () => {
  console.log('🔥 Testing Firestore Connection...\n');
  
  try {
    // Test 1: Check referrals collection
    console.log('📋 Checking referrals collection...');
    const referralsSnap = await firestore().collection('referrals').get();
    console.log(`✅ Found ${referralsSnap.size} referrals`);
    
    if (referralsSnap.size > 0) {
      console.log('📄 Sample referral:', JSON.stringify(referralsSnap.docs[0].data(), null, 2));
    }
    
    // Test 2: Check household_surveys collection
    console.log('\n📋 Checking household_surveys collection...');
    const surveysSnap = await firestore().collection('household_surveys').get();
    console.log(`✅ Found ${surveysSnap.size} household surveys`);
    
    if (surveysSnap.size > 0) {
      console.log('📄 Sample survey:', JSON.stringify(surveysSnap.docs[0].data(), null, 2));
    }
    
    // Test 3: Check water_tests collection
    console.log('\n📋 Checking water_tests collection...');
    const waterSnap = await firestore().collection('water_tests').get();
    console.log(`✅ Found ${waterSnap.size} water tests`);
    
    // Test 4: Check asha_workers collection
    console.log('\n📋 Checking asha_workers collection...');
    const ashaSnap = await firestore().collection('asha_workers').get();
    console.log(`✅ Found ${ashaSnap.size} ASHA workers`);
    
    console.log('\n✅ Firestore connection test complete!');
    
    return {
      success: true,
      counts: {
        referrals: referralsSnap.size,
        surveys: surveysSnap.size,
        waterTests: waterSnap.size,
        ashaWorkers: ashaSnap.size,
      }
    };
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    return { success: false, error: error.message };
  }
};

// Quick function to create a test referral
export const createQuickTestReferral = async () => {
  try {
    const testRef = {
      type: 'household_survey',
      patientName: 'Test Patient ' + Date.now(),
      patientAge: 35,
      patientGender: 'Female',
      village: 'Test Village',
      district: 'Test District',
      block: 'Test Block',
      riskLevel: 'high',
      symptoms: ['High risk household', 'Water contamination risk'],
      priority: 'high',
      ashaId: 'test_asha',
      ashaName: 'Test ASHA Worker',
      phcId: 'unknown',
      status: 'pending',
      urgent: true,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore().collection('referrals').add(testRef);
    console.log('✅ Test referral created with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Failed to create test referral:', error);
    return { success: false, error: error.message };
  }
};
