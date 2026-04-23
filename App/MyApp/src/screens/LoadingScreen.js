/**
 * Loading Screen - Government of India
 * ArogyaJal - Water Health Initiative
 * Initial app loading with animations
 * Design System v2.0.0
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Animated,
  Image,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme';

export default function LoadingScreen({ navigation }) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const emblemSlideAnim = useRef(new Animated.Value(-100)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations sequence
    Animated.sequence([
      // 1. Fade in and scale emblem
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(emblemSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // 2. Slide in text
      Animated.timing(textSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      
      // 3. Start progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();

    // Continuous pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous rotation for water droplet effect
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Navigate based on session after 3 seconds
    const timer = setTimeout(() => {
      // Check if session navigation already happened
      if (global.hasExistingSession) {
        console.log('[LoadingScreen] ASHA session exists, navigating to AshaDashboard');
        navigation.replace('AshaDashboard');
      } else if (global.hasResidentSession) {
        console.log('[LoadingScreen] Resident session exists, navigating to ResidentDashboard');
        navigation.replace('ResidentDashboard');
      } else if (global.hasPHCSession) {
        console.log('[LoadingScreen] PHC session exists, navigating to PHCDashboard');
        navigation.replace('PHCDashboard');
      } else if (global.hasOpsSession) {
        console.log('[LoadingScreen] Ops session exists, navigating to OpsDashboard');
        navigation.replace('OpsDashboard');
      } else {
        console.log('[LoadingScreen] No session, navigating to Launch');
        navigation.replace('Launch');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Background Gradient Effect */}
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />

      {/* Content */}
      <View style={styles.content}>
        {/* Government Emblem */}
        <Animated.View
          style={[
            styles.emblemContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: emblemSlideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.emblemCircle}>
            <Image
              source={require('../assets/images/Emblem_of_India_(navy_blue).svg.png')}
              style={styles.emblemImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.satyameva}>सत्यमेव जयते</Text>
        </Animated.View>

        {/* App Name and Tagline */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          {/* Dashboard Image above ArogyaJal */}
          <Animated.View
            style={[
              styles.dashboardImageContainer,
              {
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) },
                  { rotate: logoRotate },
                ],
              },
            ]}
          >
            <View style={styles.dashboardCircle}>
              <Image
                source={require('../assets/images/Dashboard.jpg')}
                style={styles.dashboardImage}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <Text style={styles.appName}>ArogyaJal</Text>
          <Text style={styles.appNameHindi}>आरोग्य जल</Text>
          <Text style={styles.tagline}>Water Health Initiative</Text>
          <Text style={styles.taglineHindi}>जल स्वास्थ्य पहल</Text>
        </Animated.View>

        {/* Loading Progress Bar */}
        <Animated.View
          style={[
            styles.progressContainer,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading...</Text>
        </Animated.View>

        {/* Government Footer */}
        <Animated.View
          style={[
            styles.footer,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.govText}>Government of India</Text>
          <Text style={styles.govTextHindi}>भारत सरकार</Text>
          <Text style={styles.ministryText}>Ministry of Health & Family Welfare</Text>
        </Animated.View>
      </View>

      {/* Tricolor Bottom Stripe */}
      <View style={styles.tricolor}>
        <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  
  // Background Effects
  backgroundTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.secondary,
    opacity: 0.1,
  },
  backgroundBottom: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: COLORS.white,
    opacity: 0.05,
  },
  
  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  // Emblem
  emblemContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  emblemCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    borderWidth: 3,
    borderColor: COLORS.secondary,
  },
  emblemImage: {
    width: 70,
    height: 70,
  },
  satyameva: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    marginTop: SPACING.sm,
    letterSpacing: 1,
  },
  
  // Text
  textContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  
  // Dashboard Image
  dashboardImageContainer: {
    marginBottom: SPACING.lg,
  },
  dashboardCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xl,
    borderWidth: 3,
    borderColor: COLORS.secondary,
    overflow: 'hidden',
  },
  dashboardImage: {
    width: 100,
    height: 100,
  },
  
  appName: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appNameHindi: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
    marginTop: SPACING.xs,
    opacity: 0.9,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.white,
    marginTop: SPACING.md,
    opacity: 0.8,
  },
  taglineHindi: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.white,
    marginTop: SPACING.xs,
    opacity: 0.7,
  },
  
  // Progress Bar
  progressContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.white,
    marginTop: SPACING.sm,
    opacity: 0.8,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    alignItems: 'center',
  },
  govText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  govTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
    marginTop: 2,
    opacity: 0.9,
  },
  ministryText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.white,
    marginTop: SPACING.sm,
    opacity: 0.7,
    textAlign: 'center',
  },
  
  // Tricolor
  tricolor: {
    flexDirection: 'row',
    height: 4,
  },
  colorBar: {
    flex: 1,
  },
});
