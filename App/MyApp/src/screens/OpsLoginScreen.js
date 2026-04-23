/**
 * Ops Login Screen
 * Secure login for field support team
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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';
import { useOpsAuth } from '../context/OpsAuthContext';

export default function OpsLoginScreen({ navigation }) {
  const { login } = useOpsAuth();
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
      console.log('📱 Sending OTP to Ops user:', phoneNumber);
      
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
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
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
      
      // Check if ops profile exists
      const opsDoc = await firestore()
        .collection('ops_support')
        .doc(user.uid)
        .get();
      
      if (!opsDoc.exists) {
        await auth().signOut();
        Alert.alert(
          'Access Denied',
          'This account is not registered as Ops/Support. Contact your administrator.'
        );
        return;
      }

      // Update last login
      await firestore()
        .collection('ops_support')
        .doc(user.uid)
        .update({
          lastLogin: firestore.FieldValue.serverTimestamp(),
        });
      
      // Login via context
      await login(user);
      
      Alert.alert(
        'Login Successful',
        'Welcome to Ops Control Panel',
        [{ text: 'OK', onPress: () => navigation.replace('OpsDashboard') }]
      );
    } catch (error) {
      console.error('OTP Verification Error:', error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
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
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="settings" size={48} color="#00ff00" />
          </View>
          <Text style={styles.title}>OPS CONTROL</Text>
          <Text style={styles.subtitle}>Field Support Access</Text>
          <View style={styles.accessBadge}>
            <Icon name="shield" size={16} color="#ff0000" />
            <Text style={styles.accessText}>RESTRICTED</Text>
          </View>
        </View>

        <View style={styles.authCard}>
          {!otpSent ? (
            <>
              <Text style={styles.label}>Ops Team Mobile Number</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.prefix}>
                  <Icon name="phone" size={18} color="#00ff00" />
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#666"
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
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>SEND OTP</Text>
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
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>VERIFY & LOGIN</Text>
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

        <View style={styles.warningCard}>
          <Icon name="warning" size={20} color="#ff9800" />
          <Text style={styles.warningText}>
            This is a restricted access area. All actions are logged and monitored.
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
          onPress={() => navigation.replace('OpsDashboard')}
          disabled={loading}
        >
          <Icon name="next" size={20} color="#00ff00" />
          <Text style={styles.fastAccessText}>FAST ACCESS MODE</Text>
          <Text style={styles.fastAccessSubtext}>View system status without login</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00ff00',
    marginBottom: SPACING.xs,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#999',
    marginBottom: SPACING.md,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  accessText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#ff0000',
  },
  authCard: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#333',
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: '#00ff00',
    marginBottom: SPACING.lg,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.base,
    backgroundColor: '#000',
    borderRightWidth: 1,
    borderRightColor: '#00ff00',
    gap: SPACING.xs,
  },
  prefixText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#fff',
  },
  otpSentTo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#999',
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
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: '#333',
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    textAlign: 'center',
  },
  otpBoxFilled: {
    backgroundColor: '#000',
    borderColor: '#00ff00',
  },
  button: {
    backgroundColor: '#00ff00',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#000',
    letterSpacing: 1,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#999',
  },
  resendLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#00ff00',
  },
  changeNumberButton: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  changeNumberText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#999',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#ff9800',
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
    backgroundColor: '#2a2a2a',
  },
  dividerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#666',
    marginHorizontal: SPACING.md,
    letterSpacing: 1,
  },
  fastAccessButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  fastAccessText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#00ff00',
    marginTop: SPACING.xs,
    letterSpacing: 1,
  },
  fastAccessSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#666',
    marginTop: SPACING.xs,
  },
});
