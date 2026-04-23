import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import Icon from '../components/Icon';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ResidentAuthScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  
  // Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newUserUid, setNewUserUid] = useState(null);
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    village: '',
    villageName: '',
    preferredLanguage: 'en',
    languageName: 'English',
  });
  const [villages, setVillages] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  
  // OTP input refs
  const otpInputRefs = useRef([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  // Load villages on mount
  useEffect(() => {
    loadVillages();
  }, []);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Modal animation
  useEffect(() => {
    if (showOnboarding) {
      Animated.spring(modalAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      modalAnim.setValue(0);
    }
  }, [showOnboarding]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const loadVillages = async () => {
    // Use default villages list (can be expanded or loaded from API later)
    const defaultVillages = [
      { id: 'village_1', name: 'Shillong', district: 'East Khasi Hills' },
      { id: 'village_2', name: 'Tura', district: 'West Garo Hills' },
      { id: 'village_3', name: 'Jowai', district: 'West Jaintia Hills' },
      { id: 'village_4', name: 'Nongpoh', district: 'Ri Bhoi' },
      { id: 'village_5', name: 'Nongstoin', district: 'West Khasi Hills' },
      { id: 'village_6', name: 'Baghmara', district: 'South Garo Hills' },
      { id: 'village_7', name: 'Williamnagar', district: 'East Garo Hills' },
      { id: 'village_8', name: 'Resubelpara', district: 'North Garo Hills' },
      { id: 'village_9', name: 'Khliehriat', district: 'East Jaintia Hills' },
      { id: 'village_10', name: 'Mairang', district: 'West Khasi Hills' },
    ];

    try {
      // Try to load from Firestore if available
      const villagesSnapshot = await firestore()
        .collection('villages')
        .orderBy('name')
        .get();
      
      if (!villagesSnapshot.empty) {
        const villageList = villagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVillages(villageList);
        console.log('✅ Loaded villages from Firestore');
      } else {
        setVillages(defaultVillages);
        console.log('📋 Using default villages list');
      }
    } catch (error) {
      console.log('📋 Using default villages list (Firestore not available)');
      setVillages(defaultVillages);
    }
  };

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      return {
        valid: false,
        error: 'Please enter a valid 10-digit mobile number',
        errorHindi: 'कृपया एक मान्य 10 अंकों का मोबाइल नंबर दर्ज करें',
      };
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      return {
        valid: false,
        error: 'Invalid Indian mobile number',
        errorHindi: 'अमान्य भारतीय मोबाइल नंबर',
      };
    }

    return { valid: true };
  };

  const sendOtp = async () => {
    const validation = validatePhoneNumber(phone);
    if (!validation.valid) {
      Alert.alert('Error', validation.error + '\n' + validation.errorHindi);
      return;
    }

    setLoading(true);
    try {
      const phoneWithCode = `+91${phone}`;
      const confirmationResult = await auth().signInWithPhoneNumber(phoneWithCode);
      setConfirmation(confirmationResult);
      setOtpSent(true);
      setResendTimer(60);
      Alert.alert(
        'OTP Sent',
        `OTP sent to ${phoneWithCode}\nओटीपी ${phoneWithCode} पर भेजा गया`
      );
      setTimeout(() => otpInputRefs.current[0]?.focus(), 300);
    } catch (error) {
      console.error('Send OTP Error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.\nओटीपी भेजने में विफल। कृपया पुन: प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value && newOtp.every(digit => digit)) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (otpCode = null) => {
    const otpString = otpCode || otp.join('');
    
    if (!otpString || otpString.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP\nकृपया एक मान्य 6 अंकों का ओटीपी दर्ज करें');
      return;
    }

    if (!confirmation) {
      Alert.alert('Error', 'Please request OTP first\nकृपया पहले ओटीपी का अनुरोध करें');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP with Firebase
      const userCredential = await confirmation.confirm(otpString);
      const firebaseUser = userCredential.user;
      const uid = firebaseUser.uid;

      console.log('✅ OTP verified for UID:', uid);

      // 🔹 SMART EXISTENCE CHECK - Query resident_profiles collection
      const profileDoc = await firestore()
        .collection('resident_profiles')
        .doc(uid)
        .get();

      if (profileDoc.exists) {
        // 🎉 EXISTING USER - Welcome back!
        const profileData = profileDoc.data();
        console.log('👋 Welcome back:', profileData.name);

        // Update lastLogin timestamp
        await firestore()
          .collection('resident_profiles')
          .doc(uid)
          .update({
            lastLogin: firestore.FieldValue.serverTimestamp(),
          });

        // Cache profile and mark session
        await AsyncStorage.setItem('session_type', 'resident');
        await AsyncStorage.setItem('resident_profile', JSON.stringify(profileData));

        // Create/update phone lookup
        await firestore()
          .collection('resident_lookup')
          .doc(phone)
          .set({ uid, updatedAt: firestore.FieldValue.serverTimestamp() });

        Alert.alert(
          'Welcome Back! 👋',
          `Welcome back, ${profileData.name}!\nफिर से स्वागत है, ${profileData.name}!`,
          [{ text: 'Continue', onPress: () => navigation.navigate('ResidentDashboard') }]
        );
      } else {
        // 🆕 NEW USER - Show onboarding modal
        console.log('🆕 New resident detected - showing onboarding modal');
        
        setNewUserUid(uid);
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        Alert.alert(
          'Invalid OTP',
          'The OTP you entered is incorrect. Please try again.\nआपने जो ओटीपी दर्ज किया वह गलत है। कृपया पुन: प्रयास करें।'
        );
      } else {
        Alert.alert(
          'Verification Failed',
          'Failed to verify OTP. Please try again.\nओटीपी सत्यापित करने में विफल। कृपया पुन: प्रयास करें।'
        );
      }
      
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const phoneWithCode = `+91${phone}`;
      const confirmationResult = await auth().signInWithPhoneNumber(phoneWithCode);
      setConfirmation(confirmationResult);
      setResendTimer(60);
      Alert.alert('OTP Resent', 'OTP has been resent\nओटीपी फिर से भेजा गया है');
    } catch (error) {
      console.error('Resend OTP Error:', error);
      Alert.alert('Error', 'Failed to resend OTP\nओटीपी फिर से भेजने में विफल');
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English', nameLocal: 'English' },
    { code: 'hi', name: 'Hindi', nameLocal: 'हिंदी' },
    { code: 'as', name: 'Assamese', nameLocal: 'অসমীয়া' },
    { code: 'bn', name: 'Bengali', nameLocal: 'বাংলা' },
    { code: 'brx', name: 'Bodo', nameLocal: 'बड़ो' },
    { code: 'grt', name: 'Garo', nameLocal: 'Garo' },
    { code: 'kha', name: 'Khasi', nameLocal: 'Khasi' },
    { code: 'lus', name: 'Mizo', nameLocal: 'Mizo' },
    { code: 'mni', name: 'Manipuri', nameLocal: 'मैतैलोन्' },
    { code: 'ne', name: 'Nepali', nameLocal: 'नेपाली' },
  ];

  const handleCompleteOnboarding = async () => {
    // Validate onboarding data
    if (!onboardingData.name.trim()) {
      Alert.alert('Error', 'Please enter your name\nकृपया अपना नाम दर्ज करें');
      return;
    }

    if (!onboardingData.village) {
      Alert.alert('Error', 'Please select your village\nकृपया अपना गांव चुनें');
      return;
    }

    setSavingProfile(true);
    try {
      const selectedVillage = villages.find(v => v.id === onboardingData.village);
      
      // Find linked ASHA worker - prioritize specific phone number
      let linkedAshaId = null;
      let linkedAshaName = null;
      
      try {
        // First, try to find ASHA with phone number 7725091577
        const specificAshaSnapshot = await firestore()
          .collection('asha_workers')
          .where('phoneNumber', '==', '+917725091577')
          .limit(1)
          .get();
        
        if (!specificAshaSnapshot.empty) {
          linkedAshaId = specificAshaSnapshot.docs[0].id;
          linkedAshaName = specificAshaSnapshot.docs[0].data().name;
          console.log('✅ Linked to specific ASHA worker:', linkedAshaName, linkedAshaId);
        } else {
          // Fallback: Try with just the number without +91
          const altAshaSnapshot = await firestore()
            .collection('asha_workers')
            .where('phone', '==', '7725091577')
            .limit(1)
            .get();
          
          if (!altAshaSnapshot.empty) {
            linkedAshaId = altAshaSnapshot.docs[0].id;
            linkedAshaName = altAshaSnapshot.docs[0].data().name;
            console.log('✅ Linked to specific ASHA worker (alt):', linkedAshaName, linkedAshaId);
          } else {
            // Last fallback: Find by village assignment
            const villageAshaSnapshot = await firestore()
              .collection('asha_workers')
              .where('assignedVillages', 'array-contains', onboardingData.village)
              .limit(1)
              .get();
            
            if (!villageAshaSnapshot.empty) {
              linkedAshaId = villageAshaSnapshot.docs[0].id;
              linkedAshaName = villageAshaSnapshot.docs[0].data().name;
              console.log('✅ Linked to village ASHA worker:', linkedAshaName, linkedAshaId);
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Error finding ASHA worker:', error.message);
      }
      
      if (!linkedAshaId) {
        console.log('⚠️ No ASHA worker found - resident will not be linked');
      }

      // Generate household ID for new resident
      const householdId = `household_${newUserUid}_${Date.now()}`;

      // Create resident profile with all required fields
      const newProfile = {
        uid: newUserUid,
        phone: phone,
        phoneNumber: `+91${phone}`,
        name: onboardingData.name.trim(),
        nameHindi: onboardingData.name.trim(), // Can be updated later
        householdId: householdId,
        village: selectedVillage?.name || onboardingData.villageName,
        villageHindi: selectedVillage?.name || onboardingData.villageName, // Can be updated later
        block: selectedVillage?.district || 'N/A',
        district: selectedVillage?.district || 'Meghalaya',
        preferredLanguage: onboardingData.preferredLanguage,
        linkedAshaId: linkedAshaId,
        linkedAshaName: linkedAshaName,
        profilePhoto: null,
        role: 'resident',
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastLogin: firestore.FieldValue.serverTimestamp(),
      };

      // Save to resident_profiles collection
      await firestore()
        .collection('resident_profiles')
        .doc(newUserUid)
        .set(newProfile);

      // Create basic household record
      await firestore()
        .collection('households')
        .doc(householdId)
        .set({
          householdId: householdId,
          residentUid: newUserUid,
          residentName: onboardingData.name.trim(),
          village: selectedVillage?.name || onboardingData.villageName,
          district: selectedVillage?.district || 'Meghalaya',
          members: 1,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Create phone lookup
      await firestore()
        .collection('resident_lookup')
        .doc(phone)
        .set({ 
          uid: newUserUid, 
          createdAt: firestore.FieldValue.serverTimestamp() 
        });

      // Cache profile and mark session
      await AsyncStorage.setItem('session_type', 'resident');
      await AsyncStorage.setItem('resident_profile', JSON.stringify(newProfile));

      console.log('✅ Resident profile created successfully');

      // Close modal and navigate
      setShowOnboarding(false);
      
      Alert.alert(
        'Welcome! 🎉',
        `Welcome to ArogyaJal, ${onboardingData.name}!\nआरोग्य जल में आपका स्वागत है, ${onboardingData.name}!`,
        [{ text: 'Continue', onPress: () => navigation.navigate('ResidentDashboard') }]
      );
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert(
        'Error',
        'Failed to create profile. Please try again.\nप्रोफ़ाइल बनाने में विफल। कृपया पुन: प्रयास करें।'
      );
    } finally {
      setSavingProfile(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Launch')}
        activeOpacity={0.7}
      >
        <Icon name="back" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}>
            {/* Header with Logo */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../assets/images/Emblem_of_India_(navy_blue).svg.png')}
                  style={styles.emblemImage}
                  resizeMode="contain"
                />
              </View>
              
              {/* Tricolor Stripe */}
              <View style={styles.tricolor}>
                <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
                <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
                <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
              </View>

              <Text style={styles.appTitle}>ArogyaJal</Text>
              <Text style={styles.appTitleHindi}>आरोग्य जल</Text>
              <Text style={styles.subtitle}>Resident Login</Text>
              <Text style={styles.subtitleHindi}>निवासी लॉगिन</Text>
              <Text style={styles.welcomeText}>
                Enter your mobile number to continue
              </Text>
              <Text style={styles.welcomeTextHindi}>
                जारी रखने के लिए अपना मोबाइल नंबर दर्ज करें
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {!otpSent ? (
                <>
                  {/* Phone Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mobile Number • मोबाइल नंबर</Text>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.prefix}>
                        <Icon name="phone" size={18} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.prefixText}>+91</Text>
                      </View>
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter 10-digit number"
                        keyboardType="phone-pad"
                        style={styles.phoneInput}
                        placeholderTextColor={COLORS.textLight}
                        maxLength={10}
                        editable={!loading}
                      />
                    </View>
                    <Text style={styles.hint}>
                      We'll send you a verification code
                    </Text>
                  </View>

                  {/* Send OTP Button */}
                  <TouchableOpacity
                    style={[styles.button, (loading || phone.length !== 10) && styles.buttonDisabled]}
                    onPress={sendOtp}
                    disabled={loading || phone.length !== 10}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Icon name="send" size={20} color={COLORS.white} />
                        <View style={styles.buttonTextContainer}>
                          <Text style={styles.buttonText}>Send OTP</Text>
                          <Text style={styles.buttonTextHindi}>ओटीपी भेजें</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Fast Access Option */}
                  <TouchableOpacity
                    style={styles.fastAccessButton}
                    onPress={() => navigation.navigate('ResidentDashboard')}
                    disabled={loading}
                  >
                    <Icon name="flash" size={18} color={COLORS.accent} />
                    <View style={styles.fastAccessTextContainer}>
                      <Text style={styles.fastAccessText}>
                        Continue without login (Fast Access)
                      </Text>
                      <Text style={styles.fastAccessHindi}>
                        बिना लॉगिन के जारी रखें (फास्ट एक्सेस)
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* OTP Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Enter 6-Digit OTP • 6 अंकों का ओटीपी दर्ज करें</Text>
                    <Text style={styles.otpSentTo}>Sent to +91 {phone}</Text>
                    
                    <View style={styles.otpContainer}>
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => (otpInputRefs.current[index] = ref)}
                          value={digit}
                          onChangeText={(value) => handleOtpChange(value, index)}
                          onKeyPress={(e) => handleOtpKeyPress(e, index)}
                          keyboardType="number-pad"
                          maxLength={1}
                          style={[styles.otpBox, digit && styles.otpBoxFilled]}
                          editable={!loading}
                          selectTextOnFocus
                        />
                      ))}
                    </View>

                    {loading && (
                      <View style={styles.verifyingContainer}>
                        <ActivityIndicator color={COLORS.primary} />
                        <Text style={styles.verifyingText}>Verifying...</Text>
                      </View>
                    )}
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    style={[styles.button, (loading || otp.some(d => !d)) && styles.buttonDisabled]}
                    onPress={() => verifyOtp()}
                    disabled={loading || otp.some(d => !d)}
                  >
                    <View style={styles.buttonContent}>
                      <Icon name="check-circle" size={20} color={COLORS.white} />
                      <View style={styles.buttonTextContainer}>
                        <Text style={styles.buttonText}>Verify & Continue</Text>
                        <Text style={styles.buttonTextHindi}>सत्यापित करें और जारी रखें</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Resend OTP */}
                  <View style={styles.resendContainer}>
                    {resendTimer > 0 ? (
                      <Text style={styles.resendTimer}>Resend OTP in {resendTimer}s</Text>
                    ) : (
                      <TouchableOpacity onPress={handleResendOtp}>
                        <Text style={styles.resendLink}>Didn't receive? Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Ministry of Health & Family Welfare
              </Text>
              <Text style={styles.footerTextHindi}>
                स्वास्थ्य और परिवार कल्याण मंत्रालय
              </Text>
              <Text style={styles.footerSubtext}>Government of India • भारत सरकार</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Onboarding Modal for New Users */}
      <Modal
        visible={showOnboarding}
        transparent={true}
        animationType="none"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, {
            transform: [{
              scale: modalAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            }],
            opacity: modalAnim,
          }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Icon name="account-plus" size={48} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Let's Set Up Your Account</Text>
                <Text style={styles.modalTitleHindi}>आइए अपना खाता सेट करें</Text>
                <Text style={styles.modalSubtitle}>
                  This will only take a moment
                </Text>
                <Text style={styles.modalSubtitleHindi}>
                  इसमें केवल एक पल लगेगा
                </Text>
              </View>

              {/* Name Input */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Full Name • पूरा नाम *</Text>
                <View style={styles.modalInputContainer}>
                  <Icon name="account" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textLight}
                    value={onboardingData.name}
                    onChangeText={(value) => setOnboardingData(prev => ({ ...prev, name: value }))}
                    autoCapitalize="words"
                    editable={!savingProfile}
                  />
                </View>
              </View>

              {/* Village Selection */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Village / Area • गांव / क्षेत्र *</Text>
                <TouchableOpacity
                  style={styles.modalInputContainer}
                  onPress={() => !savingProfile && setShowVillagePicker(true)}
                  disabled={savingProfile}
                >
                  <Icon name="map-marker" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <Text style={[styles.dropdownText, !onboardingData.village && styles.dropdownPlaceholder]}>
                    {onboardingData.villageName || 'Select your village'}
                  </Text>
                  <Icon name="chevron-down" size={20} color={COLORS.textMedium} style={{ marginRight: SPACING.md }} />
                </TouchableOpacity>
              </View>

              {/* Language Selection */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Preferred Language • पसंदीदा भाषा</Text>
                <TouchableOpacity
                  style={styles.modalInputContainer}
                  onPress={() => !savingProfile && setShowLanguagePicker(true)}
                  disabled={savingProfile}
                >
                  <Icon name="translate" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <Text style={styles.dropdownText}>
                    {onboardingData.languageName}
                  </Text>
                  <Icon name="chevron-down" size={20} color={COLORS.textMedium} style={{ marginRight: SPACING.md }} />
                </TouchableOpacity>
              </View>

              {/* Complete Button */}
              <TouchableOpacity
                style={[styles.modalButton, savingProfile && styles.buttonDisabled]}
                onPress={handleCompleteOnboarding}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Icon name="check-circle" size={20} color={COLORS.white} />
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonText}>Complete Setup</Text>
                      <Text style={styles.buttonTextHindi}>सेटअप पूरा करें</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.modalFooterText}>
                You can update this information later in settings
              </Text>
              <Text style={styles.modalFooterTextHindi}>
                आप इस जानकारी को बाद में सेटिंग्स में अपडेट कर सकते हैं
              </Text>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Village Picker Modal */}
      <Modal
        visible={showVillagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVillagePicker(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Village</Text>
              <TouchableOpacity onPress={() => setShowVillagePicker(false)}>
                <Icon name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={villages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setOnboardingData(prev => ({
                      ...prev,
                      village: item.id,
                      villageName: `${item.name}${item.district ? ` - ${item.district}` : ''}`,
                    }));
                    setShowVillagePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>
                    {item.name}
                    {item.district && <Text style={styles.pickerItemSubtext}> - {item.district}</Text>}
                  </Text>
                  {onboardingData.village === item.id && (
                    <Icon name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Icon name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setOnboardingData(prev => ({
                      ...prev,
                      preferredLanguage: item.code,
                      languageName: `${item.name} (${item.nameLocal})`,
                    }));
                    setShowLanguagePicker(false);
                  }}
                >
                  <View>
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                    <Text style={styles.pickerItemSubtext}>{item.nameLocal}</Text>
                  </View>
                  {onboardingData.preferredLanguage === item.code && (
                    <Icon name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: `${COLORS.secondary}08`,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  emblemImage: {
    width: 55,
    height: 55,
  },
  tricolor: {
    flexDirection: 'row',
    height: 3,
    width: 100,
    marginBottom: SPACING.lg,
  },
  colorBar: {
    flex: 1,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  appTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  subtitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  welcomeTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  inputIcon: {
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  prefixText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  otpSentTo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  otpBoxFilled: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.secondary,
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  verifyingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonTextContainer: {
    alignItems: 'center',
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  buttonTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
    marginTop: 2,
  },
  fastAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.base,
    backgroundColor: `${COLORS.accent}10`,
    gap: SPACING.sm,
  },
  fastAccessTextContainer: {
    alignItems: 'center',
  },
  fastAccessText: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  fastAccessHindi: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  resendTimer: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
  },
  resendLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  footerTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
  footerSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  modalTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  modalSubtitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  modalInputGroup: {
    marginBottom: SPACING.lg,
  },
  modalLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  modalInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },
  dropdownText: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
  },
  dropdownPlaceholder: {
    color: COLORS.textLight,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  modalFooterText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  modalFooterTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  // Picker Modal styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
    ...SHADOWS.xl,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerItemText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
  },
  pickerItemSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.normal,
    color: COLORS.textMedium,
  },
});

export default ResidentAuthScreen;
