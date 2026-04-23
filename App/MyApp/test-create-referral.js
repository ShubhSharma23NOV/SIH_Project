/**
 * Test script to manually create a referral in Firestore
 * Run this to test if referrals are being created correctly
 */

import firestore from '@react-native-firebase/firestore';

export const createTestReferral = async () => {
  try {
    const testReferral = {
      id: `test_ref_${Date.now()}`,
      type: 'household_survey',
      surveyId: 'test_survey_123',
      householdId: 'HH_TEST_001',
      patientName: 'Test Patient',
      patientAge: 35,
      patientGender: 'Female',
      village: 'Test Village',
      district: 'Test District',
      block: 'Test Block',
      riskLevel: 'high',
      symptoms: ['High risk household', 'Water contamination risk'],
      priority: 'high',
      ashaId: 'test_asha_123',
      ashaName: 'Test ASHA Worker',
      phcId: 'unknown',
      status: 'pending',
      urgent: true,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore()
      .collection('referrals')
      .add(testReferral);

    console.log('✅ Test referral created:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Error creating test referral:', error);
    return { success: false, error: error.message };
  }
};

// To use this, import and call in your PHC Dashboard:
// import { createTestReferral } from './test-create-referral';
// await createTestReferral();
