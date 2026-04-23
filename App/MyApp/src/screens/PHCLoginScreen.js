/**
 * PHC Login Screen
 * Phone OTP authentication for PHC doctors
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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';
import { usePHCAuth } from '../context/PHCAuthContext';

export default function PHCLoginScreen({ navigation }) {
  const { login } = usePHCAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputRefs = useRef([]);

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
      console.log('📱 Sending OTP to PHC doctor:', phoneNumber);
      
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
      
      const userCredential = await confirmation.confirm(otpCode);
      const user = userCredential.user;
      
      console.log('✅ OTP verified, user:', user.uid);
      
      // Check if PHC doctor profile exists
      // First try by UID (standard approach)
      let phcDoc = await firestore()
        .collection('phc_doctors')
        .doc(user.uid)
        .get();
      
      // If not found by UID, try querying by phone number
      if (!phcDoc.exists) {
        console.log('⚠️ PHC profile not found by UID, trying phone lookup...');
        const phoneQuery = await firestore()
          .collection('phc_doctors')
          .where('phoneNumber', '==', `+91${phone}`)
          .limit(1)
          .get();
        
        if (!phoneQuery.empty) {
          phcDoc = phoneQuery.docs[0];
          console.log('✅ Found PHC profile by phone:', phcDoc.id);
          
          // Update the document to use correct UID
          const correctData = { ...phcDoc.data(), uid: user.uid };
          await firestore()
            .collection('phc_doctors')
            .doc(user.uid)
            .set(correctData);
          
          // Delete old document if it has wrong ID
          if (phcDoc.id !== user.uid) {
            await firestore()
              .collection('phc_doctors')
              .doc(phcDoc.id)
              .delete();
            console.log('🗑️ Deleted old PHC profile with wrong ID:', phcDoc.id);
          }
          
          // Reload with correct UID
          phcDoc = await firestore()
            .collection('phc_doctors')
            .doc(user.uid)
            .get();
        }
      }
      
      if (!phcDoc.exists) {
        // Not a PHC doctor
        await auth().signOut();
        Alert.alert(
          'Access Denied',
      

      // Update last login
      await firestore()
        .collection('phc_doctors')
        .doc(user.uid)
        .update({
          lastLogin: firestore.FieldValue.serverTimestamp(),
        });
      
      // Login via context
      await login(user);
      
      Alert.alert(
        'Login Successful',
        'Welcome to PHC Command Center',
        [{ text: 'OK', onPress: () => navigation.replace('PHCDashboard') }]
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="back" size={20} color={COLORS.white} />
      </TouchableOpacity>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.emblemContainer}>
            <Image 
              source={require('../assets/images/Emblem_of_India_(navy_blue).svg.png')}
              style={styles.emblemImage}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.title}>PHC Command Center</Text>
          <Text style={styles.titleHindi}>पीएचसी कमांड सेंटर</Text>
          <Text style={styles.subtitle}>Medical Officer Login</Text>
          <Text style={styles.subtitleHindi}>चिकित्सा अधिकारी लॉगिन</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          {!otpSent ? (
            <>
              <Text style={styles.label}>PHC Doctor Mobile Number</Text>
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
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Enter 6-Digit OTP</Text>
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
                  <Text style={styles.buttonText}>Verify & Login</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendText}>
                    Resend OTP in {resendTimer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={resendOtp} disabled={loading}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
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
                <Text style={styles.changeNumberText}>Change Number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Icon name="info" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            This login is for PHC medical officers only. Contact your administrator if you need access.
          </Text>
        </View>

        {/* Fast Access */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.fastAccessButton}
          onPress={() => navigation.replace('PHCDashboard')}
          disabled={loading}
        >
          <Icon name="next" size={20} color={COLORS.primary} />
          <Text style={styles.fastAccessText}>Continue with Fast Access</Text>
          <Text style={styles.fastAccessSubtext}>View public data without login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  emblemContainer: {
    width: 60,
    height: 60,
    marginBottom: SPACING.md,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
    tintColor: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  titleHindi: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
    opacity: 0.9,
  },
  subtitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.white,
    opacity: 0.8,
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
    borderColor: COLORS.primary,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
    marginHorizontal: SPACING.md,
  },
  fastAccessButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.md,
  },
  fastAccessText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  fastAccessSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    marginTop: SPACING.xs,
  },
});
