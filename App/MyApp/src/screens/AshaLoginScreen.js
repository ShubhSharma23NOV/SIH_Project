import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, ActivityIndicator, Image, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';

const { width, height } = Dimensions.get('window');

export default function AshaLoginScreen({ navigation }) {
  // Auth context
  const { 
    sendOTP: authSendOTP, 
    verifyOTP: authVerifyOTP, 
    resendOTP: authResendOTP,
    validatePhoneNumber,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuth();

  // Local state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [focusedInput, setFocusedInput] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoGlowAnim = useRef(new Animated.Value(0)).current;
  const underlineAnim = useRef(new Animated.Value(0)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple3 = useRef(new Animated.Value(0)).current;
  const droplet1Y = useRef(new Animated.Value(0)).current;
  const droplet2Y = useRef(new Animated.Value(0)).current;
  const droplet3Y = useRef(new Animated.Value(0)).current;
  const focusLineAnim = useRef(new Animated.Value(0)).current;

  // OTP input refs
  const otpInputRefs = useRef([]);
  
  // Start animations on mount
  useEffect(() => {
    // Entrance animation
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

    // Underline animation
    Animated.timing(underlineAnim, {
      toValue: 1,
      duration: 1200,
      delay: 400,
      useNativeDriver: false,
    }).start();

    // Water ripple animations
    const createRippleAnimation = (ripple) => {
      return Animated.loop(
        Animated.sequence([
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

    createRippleAnimation(ripple1).start();
    setTimeout(() => createRippleAnimation(ripple2).start(), 1000);
    setTimeout(() => createRippleAnimation(ripple3).start(), 2000);

    // Floating droplets
    const createDropletAnimation = (droplet) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(droplet, {
            toValue: -150,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(droplet, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createDropletAnimation(droplet1Y).start();
    setTimeout(() => createDropletAnimation(droplet2Y).start(), 1500);
    setTimeout(() => createDropletAnimation(droplet3Y).start(), 3000);
  }, []);

  // Focus line animation
  useEffect(() => {
    if (focusedInput !== null) {
      Animated.timing(focusLineAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(focusLineAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [focusedInput]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const loading = authLoading || localLoading;

  const sendOtp = async () => {
    // Validate phone number
    const validation = validatePhoneNumber(phone);
    if (!validation.valid) {
      Alert.alert('Error', validation.error + '\n' + validation.errorHindi);
      return;
    }

    setLocalLoading(true);
    clearError();

    try {
      const result = await authSendOTP(phone);
      
      if (result.success) {
        setOtpSent(true);
        setResendTimer(60);
        Alert.alert('OTP Sent', result.message + '\n' + result.messageHindi);
        // Focus first OTP input
        setTimeout(() => otpInputRefs.current[0]?.focus(), 300);
      } else {
        Alert.alert('Error', result.message + (result.messageHindi ? '\n' + result.messageHindi : ''));
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
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
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLocalLoading(true);
    clearError();

    try {
      const result = await authVerifyOTP(otpString);
      
      if (result.success) {
        console.log('✅ User verified, navigating to dashboard');
        // Navigate to dashboard
        if (navigation && navigation.navigate) {
          navigation.navigate('AshaDashboard');
        }
      } else {
        Alert.alert('Error', result.message + (result.messageHindi ? '\n' + result.messageHindi : ''));
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLocalLoading(true);
    clearError();

    try {
      const result = await authResendOTP();
      
      if (result.success) {
        setResendTimer(60);
        Alert.alert('OTP Resent', result.message + '\n' + result.messageHindi);
      } else {
        Alert.alert('Error', result.message + (result.messageHindi ? '\n' + result.messageHindi : ''));
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleFastAccess = async () => {
    // Development fast access - does NOT persist session
    // Clear any existing session data to prevent confusion
    try {
      await AsyncStorage.multiRemove(['session_type', 'user_data', 'asha_profile']);
      console.log('[FastAccess] Cleared session data - this is temporary access only');
      
      // Set a flag to indicate this is fast access mode (not a real session)
      global.isFastAccessMode = true;
      
      if (navigation && navigation.navigate) {
        navigation.navigate('AshaDashboard');
      }
    } catch (error) {
      console.error('[FastAccess] Error:', error);
      navigation.navigate('AshaDashboard');
    }
  };



  const rippleScale1 = ripple1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.5],
  });
  const rippleOpacity1 = ripple1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const rippleScale2 = ripple2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.5],
  });
  const rippleOpacity2 = ripple2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const rippleScale3 = ripple3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.5],
  });
  const rippleOpacity3 = ripple3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const logoGlow = logoGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const underlineWidth = underlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '60%'],
  });

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

        {/* Decorative Bubbles */}
        <View style={[styles.bubble, styles.bubble1]} />
        <View style={[styles.bubble, styles.bubble2]} />
        <View style={[styles.bubble, styles.bubble3]} />
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation && navigation.navigate && navigation.navigate('Launch')}
        activeOpacity={0.7}
      >
        <Icon name="back" size={20} color={COLORS.primary} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Animated.View style={[styles.content, {
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
            <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
            <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
            <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
          </View>

          {/* App Logo with Glow */}
          <Animated.View style={[styles.logoContainer, {
            shadowRadius: logoGlow,
          }]}>
            <Image 
              source={require('../assets/images/Dashboard.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </Animated.View>

          {/* App Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.appTitle}>ArogyaJal</Text>
            <Text style={styles.appTitleHindi}>आरोग्य जल</Text>
            <Animated.View style={[styles.titleUnderline, { width: underlineWidth }]} />
            <Text style={styles.subtitle}>ASHA Worker Authentication</Text>
            <Text style={styles.subtitleHindi}>आशा कार्यकर्ता प्रमाणीकरण</Text>
          </View>

          {/* Authentication Card */}
          <View style={styles.authCard}>
            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.step, !otpSent && styles.stepActive]}>
                <Text style={[styles.stepNumber, !otpSent && styles.stepNumberActive]}>1</Text>
                <Text style={[styles.stepLabel, !otpSent && styles.stepLabelActive]}>Phone</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.step, otpSent && styles.stepActive]}>
                <Text style={[styles.stepNumber, otpSent && styles.stepNumberActive]}>2</Text>
                <Text style={[styles.stepLabel, otpSent && styles.stepLabelActive]}>Verify</Text>
              </View>
            </View>

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
                      onFocus={() => setFocusedInput('phone')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                  <Animated.View style={[styles.focusLine, {
                    width: focusedInput === 'phone' ? focusLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }) : '0%',
                  }]} />
                  <Text style={styles.hint}>Registered ASHA worker number only</Text>
                </View>

                {/* Send OTP Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, (loading || phone.length !== 10) && styles.buttonDisabled]}
                  onPress={sendOtp}
                  disabled={loading || phone.length !== 10}
                  activeOpacity={0.8}
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

                {/* Fast Access (Development) */}
                <TouchableOpacity
                  style={styles.fastAccessButton}
                  onPress={handleFastAccess}
                >
                  <Icon name="flash" size={16} color={COLORS.textLight} />
                  <Text style={styles.fastAccessText}>Fast Access (Dev)</Text>
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
                  style={[styles.primaryButton, (loading || otp.some(d => !d)) && styles.buttonDisabled]}
                  onPress={() => verifyOtp()}
                  disabled={loading || otp.some(d => !d)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Verify & Login</Text>
                  <Text style={styles.buttonTextHindi}>सत्यापित करें और लॉगिन करें</Text>
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
            <Text style={styles.footerTitle}>Ministry of Health & Family Welfare</Text>
            <Text style={styles.footerTitleHindi}>स्वास्थ्य और परिवार कल्याण मंत्रालय</Text>
            <Text style={styles.footerSubtext}>Government of India • भारत सरकार</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: `${COLORS.secondary}08`,
  },
  
  // Water Background
  waterBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  droplet: {
    position: 'absolute',
    opacity: 0.3,
  },
  droplet1: {
    left: '20%',
    bottom: 0,
  },
  droplet2: {
    left: '50%',
    bottom: 0,
  },
  droplet3: {
    left: '80%',
    bottom: 0,
  },
  dropletIcon: {
    fontSize: 24,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: `${COLORS.secondary}15`,
    borderRadius: 50,
  },
  bubble1: {
    width: 60,
    height: 60,
    top: '20%',
    left: '10%',
  },
  bubble2: {
    width: 40,
    height: 40,
    top: '60%',
    right: '15%',
  },
  bubble3: {
    width: 80,
    height: 80,
    bottom: '30%',
    left: '70%',
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

  scrollView: {
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

  // Government Emblem
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

  // Tricolor
  tricolor: {
    flexDirection: 'row',
    height: 3,
    width: 100,
    marginBottom: SPACING.lg,
  },
  colorBar: {
    flex: 1,
  },

  // Logo
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.secondary,
    overflow: 'hidden',
    ...SHADOWS.lg,
    shadowColor: COLORS.secondary,
  },
  logoImage: {
    width: 100,
    height: 100,
  },

  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
  titleUnderline: {
    height: 3,
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    marginBottom: SPACING.md,
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

  // Auth Card
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.xl,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  step: {
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[200],
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: SPACING.xs,
  },
  stepNumberActive: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
  },
  stepLabelActive: {
    color: COLORS.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  stepActive: {},
  // Input Group
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },

  // Phone Input
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
  focusLine: {
    height: 3,
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    marginTop: SPACING.xs,
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },

  // OTP Input
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

  // Buttons
  primaryButton: {
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
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  fastAccessText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
  },

  // Resend
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

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  footerTitleHindi: {
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
});
