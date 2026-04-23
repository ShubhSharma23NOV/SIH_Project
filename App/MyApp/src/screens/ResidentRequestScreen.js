/**
 * Resident Request Screen
 * Request ASHA visit, water test, raise complaint, track referrals
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import Icon from '../components/Icon';
import { useResidentAuth } from '../context/ResidentAuthContext';
import { saveServiceRequestOffline } from '../database/operations';
import SyncService from '../services/SyncService';

export default function ResidentRequestScreen({ navigation, route }) {
  const { type } = route.params || {};
  const { residentProfile } = useResidentAuth();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (residentProfile) {
        setProfileData(residentProfile);
      } else {
        // Try to load from AsyncStorage (for Fast Access users)
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const cachedProfile = await AsyncStorage.getItem('resident_profile');
          if (cachedProfile) {
            setProfileData(JSON.parse(cachedProfile));
          }
        } catch (error) {
          console.log('No cached profile found');
        }
      }
    };
    loadProfileData();
  }, [residentProfile]);
  
  const [requestType, setRequestType] = useState(type || 'asha_visit');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const requestTypes = [
    {
      id: 'asha_visit',
      icon: 'person',
      label: 'ASHA Visit',
      labelHindi: 'आशा विज़िट',
      color: COLORS.primary,
      description: 'Request home visit from ASHA worker',
      descriptionHindi: 'आशा कार्यकर्ता से घर पर विज़िट का अनुरोध करें',
    },
    {
      id: 'water_test',
      icon: 'waterTest',
      label: 'Water Testing',
      labelHindi: 'जल परीक्षण',
      color: COLORS.secondary,
      description: 'Request water quality testing',
      descriptionHindi: 'जल गुणवत्ता परीक्षण का अनुरोध करें',
    },
    {
      id: 'complaint',
      icon: 'warning',
      label: 'Health Complaint',
      labelHindi: 'स्वास्थ्य शिकायत',
      color: COLORS.warning,
      description: 'Report health or sanitation issue',
      descriptionHindi: 'स्वास्थ्य या स्वच्छता समस्या की रिपोर्ट करें',
    },
    {
      id: 'referral',
      icon: 'health',
      label: 'Referral Status',
      labelHindi: 'रेफरल स्थिति',
      color: COLORS.accent,
      description: 'Check referral status',
      descriptionHindi: 'रेफरल स्थिति जांचें',
    },
  ];

  const priorities = [
    { id: 'low', label: 'Low', labelHindi: 'कम', color: COLORS.info, icon: 'info' },
    { id: 'medium', label: 'Medium', labelHindi: 'मध्यम', color: COLORS.warning, icon: 'warning' },
    { id: 'high', label: 'High', labelHindi: 'उच्च', color: COLORS.error, icon: 'danger' },
  ];

  const visitTimes = [
    { id: 'morning', label: 'Morning (8 AM - 12 PM)', labelHindi: 'सुबह (8 AM - 12 PM)', icon: 'weather-sunny' },
    { id: 'afternoon', label: 'Afternoon (12 PM - 4 PM)', labelHindi: 'दोपहर (12 PM - 4 PM)', icon: 'white-balance-sunny' },
    { id: 'evening', label: 'Evening (4 PM - 8 PM)', labelHindi: 'शाम (4 PM - 8 PM)', icon: 'weather-night' },
    { id: 'anytime', label: 'Anytime', labelHindi: 'कभी भी', icon: 'clock-outline' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!description.trim()) {
      Alert.alert(
        language === 'en' ? 'Required' : 'आवश्यक',
        language === 'en' 
          ? 'Please provide a description of your request'
          : 'कृपया अपने अनुरोध का विवरण प्रदान करें'
      );
      return;
    }

    if (!consentGiven) {
      Alert.alert(
        language === 'en' ? 'Consent Required' : 'सहमति आवश्यक',
        language === 'en'
          ? 'Please agree to share your details for service delivery'
          : 'कृपया सेवा वितरण के लिए अपना विवरण साझा करने के लिए सहमत हों'
      );
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const currentUser = auth().currentUser;
      
      // ALWAYS assign to specific ASHA worker (7725091577)
      // Start with hardcoded UID as default to ensure assignment always works
      let linkedAshaId = 'QpGf6zy9RNZssgRgpYY0afoUNKb2';
      let linkedAshaName = 'ASHA Worker';
      
      console.log('🔍 Looking for ASHA worker with phone 7725091577...');
      
      // Try to get actual ASHA name from profile or Firestore (only if online)
      if (isOnline) {
        if (profileData?.linkedAshaId && profileData?.linkedAshaName) {
          linkedAshaId = profileData.linkedAshaId;
          linkedAshaName = profileData.linkedAshaName;
          console.log('✅ Using linked ASHA from profile:', linkedAshaName, linkedAshaId);
        } else {
          // Query Firestore to get the ASHA worker's details
          try {
            const ashaSnapshot = await firestore()
              .collection('asha_workers')
              .where('phoneNumber', '==', '+917725091577')
              .limit(1)
              .get();
            
            if (!ashaSnapshot.empty) {
              linkedAshaId = ashaSnapshot.docs[0].id;
              linkedAshaName = ashaSnapshot.docs[0].data().name || 'ASHA Worker';
              console.log('✅ Found ASHA by phoneNumber:', linkedAshaName, linkedAshaId);
            } else {
              console.log('⚠️ No ASHA found with phoneNumber +917725091577, trying alternate field...');
              
              // Fallback: try without country code
              const altAshaSnapshot = await firestore()
                .collection('asha_workers')
                .where('phone', '==', '7725091577')
                .limit(1)
                .get();
              
              if (!altAshaSnapshot.empty) {
                linkedAshaId = altAshaSnapshot.docs[0].id;
                linkedAshaName = altAshaSnapshot.docs[0].data().name || 'ASHA Worker';
                console.log('✅ Found ASHA by phone:', linkedAshaName, linkedAshaId);
              } else {
                console.log('⚠️ No ASHA found by phone, using hardcoded UID:', linkedAshaId);
              }
            }
          } catch (error) {
            console.error('❌ Error finding ASHA worker:', error);
            console.log('✅ Using hardcoded ASHA UID (error fallback):', linkedAshaId);
          }
        }
      } else {
        console.log('📴 Offline mode - using hardcoded ASHA UID:', linkedAshaId);
      }
      
      console.log('📤 Request will be assigned to:', linkedAshaId, '(', linkedAshaName, ')');
      
      // Build request data
      const requestData = {
        // Request details
        type: requestType,
        priority,
        description: description.trim(),
        preferredTime: preferredTime || 'anytime',
        status: 'assigned', // Always assigned since we always have a linkedAshaId
        
        // Acknowledgment tracking
        acknowledged: false,
        acknowledgedAt: null,
        acknowledgedBy: null,
        alertSent: false,
        alertSentAt: null,
        
        // Timestamps
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        assignedAt: firestore.FieldValue.serverTimestamp(), // Always assigned
        completedAt: null,
        
        // Resident info (auto-filled)
        residentId: currentUser?.uid || profileData?.uid || 'anonymous',
        residentName: profileData?.name || currentUser?.displayName || 'Resident',
        residentPhone: profileData?.phoneNumber || profileData?.phone || currentUser?.phoneNumber || 'Not provided',
        
        // Location info (auto-filled)
        village: profileData?.village || 'Not specified',
        block: profileData?.block || 'Meghalaya',
        district: profileData?.district || 'Meghalaya',
        householdId: profileData?.householdId || null,
        
        // Assignment info
        assignedTo: linkedAshaId,
        assignedAshaId: linkedAshaId,
        assignedAshaName: linkedAshaName,
        
        // Consent
        consentGiven: true,
        consentTimestamp: firestore.FieldValue.serverTimestamp(),
        
        // Attachments (if any)
        attachments: attachments,
        
        // Additional fields
        notes: [],
        statusHistory: [
          {
            status: 'assigned',
            timestamp: new Date(),
            note: `Request submitted and auto-assigned to ASHA worker ${linkedAshaName}`,
          }
        ],
      };

      // STEP 1: Save offline first (always)
      console.log('💾 Saving request offline first...');
      const localRequestId = await saveServiceRequestOffline(requestData);
      console.log('✅ Request saved offline with ID:', localRequestId);

      // STEP 2: Try to sync to Firebase if online
      if (isOnline) {
        try {
          console.log('☁️ Syncing request to Firebase...');
          await SyncService.syncServiceRequests();
          console.log('✅ Request synced to Firebase successfully');
          
          Alert.alert(
            language === 'en' ? 'Success' : 'सफलता',
            language === 'en'
              ? 'Your request has been submitted successfully and synced to the server.'
              : 'आपका अनुरोध सफलतापूर्वक सबमिट और सर्वर से सिंक किया गया है।',
            [
              {
                text: 'View Requests',
                onPress: () => navigation.navigate('ResidentRequestHistory'),
              },
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } catch (syncError) {
          console.error('⚠️ Sync error (request saved offline):', syncError);
          Alert.alert(
            language === 'en' ? 'Saved Offline' : 'ऑफ़लाइन सहेजा गया',
            language === 'en'
              ? 'Your request has been saved offline. It will be synced when you are online.'
              : 'आपका अनुरोध ऑफ़लाइन सहेजा गया है। जब आप ऑनलाइन होंगे तो यह सिंक हो जाएगा।',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      } else {
        // Offline - show offline message
        Alert.alert(
          language === 'en' ? 'Saved Offline' : 'ऑफ़लाइन सहेजा गया',
          language === 'en'
            ? 'You are offline. Your request has been saved and will be submitted when you are online.'
            : 'आप ऑफ़लाइन हैं। आपका अनुरोध सहेजा गया है और जब आप ऑनलाइन होंगे तो सबमिट किया जाएगा।',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      
      let errorMessage = language === 'en'
        ? 'Failed to submit request. Please try again.'
        : 'अनुरोध सबमिट करने में विफल। कृपया पुनः प्रयास करें।';
      
      // Handle specific errors
      if (error.code === 'firestore/permission-denied') {
        errorMessage = language === 'en'
          ? 'Please login to submit a request. Fast Access users cannot submit requests.'
          : 'कृपया अनुरोध सबमिट करने के लिए लॉगिन करें। फास्ट एक्सेस उपयोगकर्ता अनुरोध सबमिट नहीं कर सकते।';
      }
      
      Alert.alert(
        language === 'en' ? 'Error' : 'त्रुटि',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedType = requestTypes.find(t => t.id === requestType);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title={language === 'en' ? 'Request Service' : 'सेवा का अनुरोध'}
        subtitle={language === 'en' ? 'Submit your request' : 'अपना अनुरोध सबमिट करें'}
        showBack
        onBackPress={() => navigation.goBack()}
      >
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        >
          <Text style={styles.langText}>{language === 'en' ? 'हिं' : 'EN'}</Text>
        </TouchableOpacity>
      </GovHeader>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Request Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Request Type' : 'अनुरोध प्रकार'}
          </Text>
          
          <View style={styles.typeGrid}>
            {requestTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  requestType === type.id && styles.typeCardActive,
                ]}
                onPress={() => setRequestType(type.id)}
              >
                <View style={[styles.typeIcon, { backgroundColor: `${type.color}15` }]}>
                  <Icon name={type.icon} size={24} color={type.color} />
                </View>
                <Text style={styles.typeLabel}>
                  {language === 'en' ? type.label : type.labelHindi}
                </Text>
                {requestType === type.id && (
                  <View style={styles.typeCheck}>
                    <Icon name="checkCircle" size={20} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedType && (
            <GovCard style={styles.typeDescription}>
              <Text style={styles.typeDescText}>
                {language === 'en' ? selectedType.description : selectedType.descriptionHindi}
              </Text>
            </GovCard>
          )}
        </View>

        {/* Priority Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Priority Level' : 'प्राथमिकता स्तर'}
          </Text>
          
          <View style={styles.priorityContainer}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.priorityButton,
                  priority === p.id && [styles.priorityButtonActive, { borderColor: p.color }],
                ]}
                onPress={() => setPriority(p.id)}
              >
                <Text style={[
                  styles.priorityText,
                  priority === p.id && [styles.priorityTextActive, { color: p.color }],
                ]}>
                  {language === 'en' ? p.label : p.labelHindi}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Description' : 'विवरण'} *
          </Text>
          
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder={
              language === 'en'
                ? 'Describe your request in detail...'
                : 'अपने अनुरोध का विस्तार से वर्णन करें...'
            }
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Preferred Visit Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Preferred Visit Time' : 'पसंदीदा विज़िट समय'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {language === 'en' ? 'Optional - Helps with scheduling' : 'वैकल्पिक - शेड्यूलिंग में मदद करता है'}
          </Text>
          
          <View style={styles.timeGrid}>
            {visitTimes.map((time) => (
              <TouchableOpacity
                key={time.id}
                style={[
                  styles.timeCard,
                  preferredTime === time.id && styles.timeCardActive,
                ]}
                onPress={() => setPreferredTime(time.id)}
              >
                <Icon 
                  name={time.icon} 
                  size={24} 
                  color={preferredTime === time.id ? COLORS.primary : COLORS.textMedium} 
                />
                <Text style={[
                  styles.timeLabel,
                  preferredTime === time.id && styles.timeLabelActive,
                ]}>
                  {language === 'en' ? time.label : time.labelHindi}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Auto-filled Information */}
        <GovCard style={styles.autoFilledCard}>
          <View style={styles.autoFilledHeader}>
            <Icon name="checkCircle" size={20} color={COLORS.success} />
            <Text style={styles.autoFilledTitle}>
              {language === 'en' ? 'Auto-filled Information' : 'स्वतः भरी गई जानकारी'}
            </Text>
          </View>
          <View style={styles.autoFilledRow}>
            <Icon name="account" size={16} color={COLORS.textMedium} />
            <Text style={styles.autoFilledText}>{profileData?.name || 'Resident'}</Text>
          </View>
          <View style={styles.autoFilledRow}>
            <Icon name="location" size={16} color={COLORS.textMedium} />
            <Text style={styles.autoFilledText}>{profileData?.village || 'Village'}</Text>
          </View>
          <View style={styles.autoFilledRow}>
            <Icon name="home" size={16} color={COLORS.textMedium} />
            <Text style={styles.autoFilledText}>
              {language === 'en' ? 'Household ID: ' : 'घरेलू आईडी: '}
              {profileData?.householdId || 'N/A'}
            </Text>
          </View>
        </GovCard>

        {/* Consent Checkbox */}
        <TouchableOpacity
          style={styles.consentContainer}
          onPress={() => setConsentGiven(!consentGiven)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
            {consentGiven && <Icon name="checkmark" size={16} color={COLORS.white} />}
          </View>
          <View style={styles.consentTextContainer}>
            <Text style={styles.consentText}>
              {language === 'en'
                ? 'I agree to share my details for service delivery'
                : 'मैं सेवा वितरण के लिए अपना विवरण साझा करने के लिए सहमत हूं'}
            </Text>
            <Text style={styles.consentSubtext}>
              {language === 'en'
                ? 'Required for ASHA worker assignment'
                : 'आशा कार्यकर्ता असाइनमेंट के लिए आवश्यक'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Info Card */}
        <GovCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="info" size={20} color={COLORS.info} />
            <Text style={styles.infoTitle}>
              {language === 'en' ? 'What happens next?' : 'आगे क्या होगा?'}
            </Text>
          </View>
          <Text style={styles.infoText}>
            {language === 'en'
              ? '• Your request will be sent to your assigned ASHA worker\n• You will receive a notification when it is assigned\n• The ASHA worker will contact you to schedule\n• You can track the status in Request History'
              : '• आपका अनुरोध आपके निर्धारित आशा कार्यकर्ता को भेजा जाएगा\n• जब यह सौंपा जाएगा तो आपको सूचना मिलेगी\n• आशा कार्यकर्ता शेड्यूल करने के लिए आपसे संपर्क करेंगी\n• आप अनुरोध इतिहास में स्थिति ट्रैक कर सकते हैं'}
          </Text>
        </GovCard>

        {/* Submit Button */}
        <GovButton
          title={language === 'en' ? 'Submit Request' : 'अनुरोध सबमिट करें'}
          subtitle={language === 'en' ? 'Send to ASHA worker' : 'आशा कार्यकर्ता को भेजें'}
          onPress={handleSubmit}
          variant="primary"
          icon="send"
          fullWidth
          loading={loading}
          disabled={loading || !description.trim() || !consentGiven}
          style={styles.submitButton}
        />

        {/* View History Button */}
        <GovButton
          title={language === 'en' ? 'View Request History' : 'अनुरोध इतिहास देखें'}
          subtitle={language === 'en' ? 'Track your requests' : 'अपने अनुरोध ट्रैक करें'}
          onPress={() => navigation.navigate('ResidentRequestHistory')}
          variant="secondary"
          icon="calendar"
          fullWidth
          disabled={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  langButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
  },
  langText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.sm,
  },
  typeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  typeLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  typeCheck: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  typeDescription: {
    backgroundColor: `${COLORS.info}10`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginTop: SPACING.md,
  },
  typeDescText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: COLORS.white,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
  },
  priorityTextActive: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    minHeight: 120,
  },

  infoCard: {
    backgroundColor: `${COLORS.info}10`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: SPACING.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  timeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  timeLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
  },
  timeLabelActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  autoFilledCard: {
    backgroundColor: `${COLORS.success}10`,
    borderColor: COLORS.success,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  autoFilledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  autoFilledTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
  autoFilledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  autoFilledText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textDark,
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  consentTextContainer: {
    flex: 1,
  },
  consentText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  consentSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
  },
});
