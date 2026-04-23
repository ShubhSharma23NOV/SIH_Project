/**
 * Resident Login Screen
 * Phone OTP authentication for local residents
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Image,
  Linking,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';
import { useResidentAuth } from '../context/ResidentAuthContext';

export default function ResidentLoginScreen({ navigation }) {
  const { login } = useResidentAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [showFastAccess, setShowFastAccess] = useState(false);

  const otpInputRefs = useRef([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const phoneNumber = `+91${phone}`;
      console.log('📱 Sending OTP to:', phoneNumber);
      
      // Send OTP via Firebase
      const confirmationResult = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirmation(confirmationResult);
      setOtpSent(true);
      setResendTimer(60);
      
      Alert.alert(
        'OTP Sent',
        `A 6-digit OTP has been sent to ${phoneNumber}`,
        [{ text: 'OK', onPress: () => setTimeout(() => otpInputRefs.current[0]?.focus(), 300) }]
      );
    } catch (error) {
      console.error('OTP Send Error:', error);
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
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

  const verifyOtp = async (otpCode) => {
    if (!confirmation) {
      Alert.alert('Error', 'Please request OTP first');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Verifying OTP:', otpCode);
      
      // Verify OTP with Firebase
      const userCredential = await confirmation.confirm(otpCode);
      const user = userCredential.user;
      
      console.log('✅ OTP verified, user:', user.uid);
      
      // Check if resident profile exists
      const residentDoc = await firestore()
        .collection('residents')
        .doc(user.uid)
        .get();
      
      if (!residentDoc.exists) {
        // Create new resident profile
        console.log('📝 Creating new resident profile');
        
        // Try to find existing household by phone number
        let householdId = null;
        let village = 'N/A';
        let villageHindi = '';
        let block = 'N/A';
        let district = 'N/A';
        
        try {
          const householdsSnapshot = await firestore()
            .collection('households')
            .where('phoneNumber', '==', user.phoneNumber)
            .limit(1)
            .get();
          
          if (!householdsSnapshot.empty) {
            const householdDoc = householdsSnapshot.docs[0];
            const householdData = householdDoc.data();
            householdId = householdDoc.id;
            village = householdData.village || 'N/A';
            villageHindi = householdData.villageHindi || '';
            block = householdData.block || 'N/A';
            district = householdData.district || 'N/A';
            console.log('✅ Found existing household:', householdId);
          } else {
            console.log('⚠️ No household found for phone number, creating basic profile');
          }
        } catch (error) {
          console.error('Error searching for household:', error);
        }
        
        await firestore()
          .collection('residents')
          .doc(user.uid)
          .set({
            uid: user.uid,
            role: 'RESIDENT',
            status: 'active',
            phoneNumber: user.phoneNumber,
            name: 'Resident',
            nameHindi: 'निवासी',
            householdId: householdId,
            village: village,
            villageHindi: villageHindi,
            block: block,
            district: district,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
            lastLogin: firestore.FieldValue.serverTimestamp(),
          });
      } else {
        // Update last login
        await firestore()
          .collection('residents')
          .doc(user.uid)
          .update({
            lastLogin: firestore.FieldValue.serverTimestamp(),
          });
      }
      
      // Login via context
      await login(user);
      
      Alert.alert(
        'Login Successful',
        'Welcome to ArogyaJal!',
        [{ text: 'OK', onPress: () => navigation.replace('ResidentDashboard') }]
      );
    } catch (error) {
      console.error('OTP Verification Error:', error);
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.';
      }
      
      Alert.alert('Error', errorMessage);
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setOtp(['', '', '', '', '', '']);
    setOtpSent(false);
    setConfirmation(null);
    await sendOtp();
  };

  const handleEmergencyCall = (number, name) => {
    Alert.alert(
      `Call ${name}`,
      `Do you want to call ${name} (${number})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${number}`) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="back" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Government Emblem */}
        <View style={styles.emblemContainer}>
          <Image 
            source={require('../assets/images/Emblem_of_India_(navy_blue).svg.png')}
            style={styles.emblemImage}
            resizeMode="contain"
          />
        </View>

        {/* Tricolor */}
        <View style={styles.tricolor}>
          <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
          <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
          <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
        </View>

        {/* Title */}
        <Text style={styles.title}>ArogyaJal</Text>
        <Text style={styles.titleHindi}>आरोग्य जल</Text>
        <Text style={styles.subtitle}>Resident Login</Text>
        <Text style={styles.subtitleHindi}>निवासी लॉगिन</Text>

        {/* Auth Card */}
        <View style={styles.authCard}>
          {!otpSent ? (
            <>
              <Text style={styles.label}>Mobile Number • मोबाइल नंबर</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.prefix}>
                  <Icon name="phone" size={18} color={COLORS.primary} />
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter 10-digit number"
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                  maxLength={10}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, (loading || phone.length !== 10) && styles.buttonDisabled]}
                onPress={sendOtp}
                disabled={loading || phone.length !== 10}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send OTP</Text>
                    <Text style={styles.buttonTextHindi}>ओटीपी भेजें</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Fast Access Button */}
              <TouchableOpacity
                style={styles.fastAccessButton}
                onPress={() => navigation.replace('ResidentDashboard')}
                disabled={loading}
              >
                <Icon name="emergency" size={20} color={COLORS.accent} />
                <Text style={styles.fastAccessButtonText}>Fast Access (Skip Login)</Text>
                <Text style={styles.fastAccessButtonTextHindi}>त्वरित पहुंच (लॉगिन छोड़ें)</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Enter 6-Digit OTP • ओटीपी दर्ज करें</Text>
              <Text style={styles.otpSentTo}>Sent to +91 {phone}</Text>
              
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputRefs.current[index] = ref)}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, (loading || otp.some(d => !d)) && styles.buttonDisabled]}
                onPress={() => verifyOtp(otp.join(''))}
                disabled={loading || otp.some(d => !d)}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Verify & Login</Text>
                    <Text style={styles.buttonTextHindi}>सत्यापित करें</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendText}>
                    Resend OTP in {resendTimer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={resendOtp} disabled={loading}>
                    <Text style={styles.resendLink}>Resend OTP • ओटीपी पुनः भेजें</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.changeNumberButton}
                onPress={() => {
                  setOtpSent(false);
                  setOtp(['', '', '', '', '', '']);
                  setConfirmation(null);
                }}
                disabled={loading}
              >
                <Text style={styles.changeNumberText}>Change Number • नंबर बदलें</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Ministry of Health & Family Welfare</Text>
          <Text style={styles.footerTextHindi}>स्वास्थ्य और परिवार कल्याण मंत्रालय</Text>
        </View>
      </ScrollView>

      {/* Fast Access Menu */}
      {showFastAccess && (
        <>
          <TouchableOpacity 
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowFastAccess(false)}
          />
          <View style={styles.fastAccessMenu}>
            <TouchableOpacity
              style={[styles.fastAccessItem, { backgroundColor: COLORS.error }]}
              onPress={() => {
                setShowFastAccess(false);
                handleEmergencyCall('108', 'Ambulance');
              }}
            >
              <Icon name="emergency" size={24} color={COLORS.white} />
              <Text style={styles.fastAccessText}>Ambulance 108</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fastAccessItem, { backgroundColor: COLORS.warning }]}
              onPress={() => {
                setShowFastAccess(false);
                handleEmergencyCall('102', 'Health Helpline');
              }}
            >
              <Icon name="health" size={24} color={COLORS.white} />
              <Text style={styles.fastAccessText}>Health 102</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fastAccessItem, { backgroundColor: COLORS.info }]}
              onPress={() => {
                setShowFastAccess(false);
                handleEmergencyCall('100', 'Police');
              }}
            >
              <Icon name="shield" size={24} color={COLORS.white} />
              <Text style={styles.fastAccessText}>Police 100</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fastAccessItem, { backgroundColor: COLORS.accent }]}
              onPress={() => {
                setShowFastAccess(false);
                Alert.alert(
                  'Water Quality Info',
                  'Login to check water quality status in your area.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Icon name="waterTest" size={24} color={COLORS.white} />
              <Text style={styles.fastAccessText}>Water Info</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Emergency Access FAB */}
      <TouchableOpacity
        style={styles.emergencyFab}
        onPress={() => setShowFastAccess(!showFastAccess)}
      >
        <Icon 
          name={showFastAccess ? 'close' : 'emergency'} 
          size={28} 
          color={COLORS.white} 
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emblemContainer: {
    width: 60,
    height: 60,
    marginBottom: SPACING.md,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  titleHindi: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
  },
  subtitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  authCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    gap: SPACING.xs,
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
  },
  otpSentTo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
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
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.5,
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
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  footerTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  resendLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  changeNumberButton: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  changeNumberText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  fastAccessMenu: {
    position: 'absolute',
    bottom: SPACING.xl + 70,
    right: SPACING.md,
    gap: SPACING.sm,
    zIndex: 999,
  },
  fastAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.round,
    gap: SPACING.sm,
    ...SHADOWS.lg,
    elevation: 8,
    minWidth: 180,
  },
  fastAccessText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  emergencyFab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.md,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xl,
    elevation: 10,
  },
  fastAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.base,
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  fastAccessButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accent,
  },
  fastAccessButtonTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    position: 'absolute',
    bottom: 4,
  },
});
