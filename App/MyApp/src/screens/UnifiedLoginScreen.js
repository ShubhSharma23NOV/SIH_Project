/**
 * Unified Login Screen
 * Single login screen for all user roles (ASHA, Resident, PHC)
 * Beautiful water-themed UI with animations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';

const { width, height } = Dimensions.get('window');

export default function UnifiedLoginScreen({ navigation, route }) {
  const { t } = useTranslation();
  const roleType = route?.params?.role || 'asha'; // Default to ASHA
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const otpInputRefs = useRef([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoGlowAnim = useRef(new Animated.Value(0)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple3 = useRef(new Animated.Value(0)).current;
  const droplet1Y = useRef(new Animated.Value(0)).current;
  const droplet2Y = useRef(new Animated.Value(0)).current;
  const droplet3Y = useRef(new Animated.Value(0)).current;

  // Role configurations
  const roleConfig = {
    asha: {
      title: t('login.ashaWorker'),
      icon: 'person',
      color: COLORS.primary,
      dashboard: 'AshaDashboard',
      sessionKey: 'asha',
    },
    resident: {
      title: t('login.resident'),
      icon: 'home',
      color: COLORS.secondary,
      dashboard: 'ResidentDashboard',
      sessionKey: 'resident',
    },
    phc: {
      title: t('login.phc'),
      icon: 'health',
      color: COLORS.success,
      dashboard: 'PHCDashboard',
      sessionKey: 'phc',
    },
  };

  const config = roleConfig[roleType];

  useEffect(() => {
    // Entrance animations
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

    // Logo glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Water ripple animations
    const createRippleAnimation = (ripple, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(ripple, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(ripple, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createRippleAnimation(ripple1, 0).start();
    createRippleAnimation(ripple2, 1000).start();
    createRippleAnimation(ripple3, 2000).start();

    // Floating droplets
    const createDropletAnimation = (droplet, distance) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(droplet, {
            toValue: distance,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(droplet, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createDropletAnimation(droplet1Y, 30).start();
    createDropletAnimation(droplet2Y, 40).start();
    createDropletAnimation(droplet3Y, 35).start();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert(t('login.invalidPhone'), t('login.invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      // Use Firebase Auth for OTP
      const auth = require('@react-native-firebase/auth').default;
      const formattedPhone = `+91${phone}`;
      
      console.log(`Sending OTP to ${formattedPhone} for ${roleType}`);
      
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      
      // Store confirmation for verification
      global.otpConfirmation = confirmation;
      
      setOtpSent(true);
      setResendTimer(60);
      Alert.alert(t('login.otpSent'), t('login.otpSentMessage', { phone }));
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert(t('common.error'), error.message || t('errors.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert(t('login.invalidOTP'), t('login.invalidOTP'));
      return;
    }

    setLoading(true);
    try {
      const firestore = require('@react-native-firebase/firestore').default;
      
      console.log(`Verifying OTP ${otpCode} for ${phone} as ${roleType}`);
      
      // Verify OTP with Firebase
      if (!global.otpConfirmation) {
        throw new Error(t('login.sendOTP'));
      }
      
      const userCredential = await global.otpConfirmation.confirm(otpCode);
      const user = userCredential.user;
      
      console.log('✅ OTP verified, user:', user.uid);
      
      // Check if user exists in the appropriate collection
      let profileDoc;
      let collectionName;
      
      if (roleType === 'asha') {
        collectionName = 'asha_workers';
      } else if (roleType === 'resident') {
        collectionName = 'residents';
      } else if (roleType === 'phc') {
        collectionName = 'phc_doctors';  // Fixed: was 'phc_staff'
      }
      
      // Check if user is registered
      profileDoc = await firestore().collection(collectionName).doc(user.uid).get();
      
      if (!profileDoc.exists) {
        // User not registered - sign out and show error
        await require('@react-native-firebase/auth').default().signOut();
        Alert.alert(
          t('common.error'),
          t('login.registeredOnly', { role: config.title }),
          [{ text: t('common.ok') }]
        );
        return;
      }
      
      // Get profile data
      const profileData = profileDoc.data();
      
      // Save session with profile data
      await AsyncStorage.setItem('session_type', config.sessionKey);
      await AsyncStorage.setItem(`${config.sessionKey}_profile`, JSON.stringify({
        uid: user.uid,
        phone: `+91${phone}`,
        role: roleType,
        ...profileData,
      }));
      
      // Navigate to dashboard
      navigation.replace(config.dashboard);
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert(t('common.error'), error.message || t('login.verificationFailed'));
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // DEV MODE: Skip login for testing
  const handleDevSkipLogin = async () => {
    try {
      await AsyncStorage.setItem('session_type', config.sessionKey);
      await AsyncStorage.setItem(`${config.sessionKey}_profile`, JSON.stringify({
        uid: 'dev_user_' + roleType,
        phone: '+919999999999',
        role: roleType,
        name: 'Dev User',
        email: 'dev@test.com',
      }));
      navigation.replace(config.dashboard);
    } catch (error) {
      console.error('Dev skip error:', error);
    }
  };

  // Animated values
  const rippleScale1 = ripple1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] });
  const rippleOpacity1 = ripple1.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });
  const rippleScale2 = ripple2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] });
  const rippleOpacity2 = ripple2.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });
  const rippleScale3 = ripple3.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] });
  const rippleOpacity3 = ripple3.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });
  const logoGlow = logoGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Water Ripples Background */}
      <View style={styles.waterBackground}>
        <Animated.View style={[styles.ripple, {
          transform: [{ scale: rippleScale1 }],
          opacity: rippleOpacity1,
        }]} />
        <Animated.View style={[styles.ripple, {
          transform: [{ scale: rippleScale2 }],
          opacity: rippleOpacity2,
        }]} />
        <Animated.View style={[styles.ripple, {
          transform: [{ scale: rippleScale3 }],
          opacity: rippleOpacity3,
        }]} />
        
        {/* Floating Droplets */}
        <Animated.View style={[styles.droplet, styles.droplet1, {
          transform: [{ translateY: droplet1Y }],
        }]}>
          <Text style={styles.dropletIcon}>💧</Text>
        </Animated.View>
        <Animated.View style={[styles.droplet, styles.droplet2, {
          transform: [{ translateY: droplet2Y }],
        }]}>
          <Text style={styles.dropletIcon}>💧</Text>
        </Animated.View>
        <Animated.View style={[styles.droplet, styles.droplet3, {
          transform: [{ translateY: droplet3Y }],
        }]}>
          <Text style={styles.dropletIcon}>💧</Text>
        </Animated.View>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Icon name="back" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.formContainer, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}>
            {/* Government Emblem */}
            <View style={styles.govEmblem}>
              <Image 
                source={require('../assets/images/Emblem_of_India_(navy_blue).svg.png')}
                style={styles.emblemImage}
                resizeMode="contain"
              />
            </View>

            {/* Tricolor Stripe */}
            <View style={styles.tricolor}>
              <View style={[styles.colorBar, { backgroundColor: '#FF9933' }]} />
              <View style={[styles.colorBar, { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ddd' }]} />
              <View style={[styles.colorBar, { backgroundColor: '#138808' }]} />
            </View>

            {/* App Logo with Glow */}
            <Animated.View style={[styles.logoContainer, {
              shadowRadius: logoGlow,
              shadowOpacity: logoGlowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.4],
              }),
              shadowColor: config.color,
            }]}>
              <Image 
                source={require('../assets/images/Dashboard.jpg')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </Animated.View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.appTitle}>ArogyaJal</Text>
              <Text style={styles.appTitleHindi}>आरोग्य जल</Text>
              <View style={[styles.underline, { backgroundColor: config.color }]} />
              <Text style={[styles.subtitle, { color: config.color }]}>{config.title}</Text>
            </View>

            {/* Authentication Card */}
            <View style={styles.authCard}>
              {/* Step Indicator */}
              <View style={styles.stepIndicator}>
                <View style={[styles.step, !otpSent && styles.stepActive]}>
                  <Text style={[styles.stepNumber, !otpSent && styles.stepNumberActive]}>1</Text>
                  <Text style={[styles.stepLabel, !otpSent && styles.stepLabelActive]}>{t('login.steps.phone')}</Text>
                </View>
                <View style={[styles.stepLine, { backgroundColor: config.color }]} />
                <View style={[styles.step, otpSent && styles.stepActive]}>
                  <Text style={[styles.stepNumber, otpSent && styles.stepNumberActive]}>2</Text>
                  <Text style={[styles.stepLabel, otpSent && styles.stepLabelActive]}>{t('login.steps.verify')}</Text>
                </View>
              </View>

              {!otpSent ? (
                <>
                  {/* Phone Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('login.mobileNumber')}</Text>
                    <View style={[styles.phoneInputWrapper, { borderColor: config.color }]}>
                      <View style={styles.prefix}>
                        <Icon name="phone" size={18} color={config.color} />
                        <Text style={[styles.prefixText, { color: config.color }]}>+91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder={t('login.enterNumber')}
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={setPhone}
                        editable={!loading}
                      />
                    </View>
                    <Text style={styles.hint}>{t('login.registeredOnly', { role: roleType.toUpperCase() })}</Text>
                  </View>

                  {/* Send OTP Button */}
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: config.color }, (loading || phone.length !== 10) && styles.buttonDisabled]}
                    onPress={handleSendOTP}
                    disabled={loading || phone.length !== 10}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.buttonText}>{t('login.sendOTP')}</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* OTP Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('login.enterOTP')}</Text>
                    <Text style={styles.otpSentText}>{t('login.otpSentTo', { phone })}</Text>
                    
                    <View style={styles.otpContainer}>
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={ref => otpInputRefs.current[index] = ref}
                          style={[styles.otpInput, { borderColor: config.color }]}
                          keyboardType="number-pad"
                          maxLength={1}
                          value={digit}
                          onChangeText={(value) => handleOtpChange(value, index)}
                          onKeyPress={(e) => handleOtpKeyPress(e, index)}
                          editable={!loading}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: config.color }, (loading || otp.join('').length !== 6) && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={loading || otp.join('').length !== 6}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.buttonText}>{t('login.verifyLogin')}</Text>
                    )}
                  </TouchableOpacity>

                  {/* Resend OTP */}
                  <View style={styles.resendContainer}>
                    {resendTimer > 0 ? (
                      <Text style={styles.resendText}>
                        {t('login.resendIn', { seconds: resendTimer })}
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOTP}>
                        <Text style={[styles.resendLink, { color: config.color }]}>
                          {t('login.resendOTP')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Change Number */}
                  <TouchableOpacity
                    style={styles.changeNumberButton}
                    onPress={() => {
                      setOtpSent(false);
                      setOtp(['', '', '', '', '', '']);
                    }}
                  >
                    <Text style={styles.changeNumberText}>{t('login.changeNumber')}</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* DEV MODE: Skip Login Button */}
              {__DEV__ && (
                <TouchableOpacity
                  style={[styles.devSkipButton, { borderColor: config.color }]}
                  onPress={handleDevSkipLogin}
                >
                  <Text style={[styles.devSkipText, { color: config.color }]}>
                    ⚡ Skip Login (Dev Mode)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  waterBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: COLORS.primary,
    top: '50%',
    left: '50%',
    marginLeft: -(width * 0.75),
    marginTop: -(width * 0.75),
  },
  droplet: {
    position: 'absolute',
    fontSize: 24,
  },
  droplet1: {
    top: '15%',
    left: '20%',
  },
  droplet2: {
    top: '25%',
    right: '15%',
  },
  droplet3: {
    top: '40%',
    left: '10%',
  },
  dropletIcon: {
    fontSize: 28,
    opacity: 0.3,
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
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  govEmblem: {
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
    width: '100%',
    height: 6,
    marginBottom: SPACING.xl,
    borderRadius: 3,
    overflow: 'hidden',
  },
  colorBar: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  appTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textMedium,
    marginBottom: SPACING.sm,
  },
  authCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  step: {
    alignItems: 'center',
  },
  stepActive: {
    opacity: 1,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 4,
  },
  stepNumberActive: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.sm,
    marginRight: SPACING.sm,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    gap: 4,
  },
  prefixText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
    marginTop: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.3,
    shadowColor: COLORS.primary,
    ...SHADOWS.lg,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  underline: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
  },
  phoneInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textDark,
    paddingVertical: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  otpSentText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderRadius: RADIUS.base,
    fontSize: 22,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    backgroundColor: COLORS.background,
    color: COLORS.textDark,
  },
  button: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
    elevation: 3,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  resendContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  resendLink: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textDecorationLine: 'underline',
  },
  changeNumberButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  changeNumberText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  devSkipButton: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}10`,
  },
  devSkipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
