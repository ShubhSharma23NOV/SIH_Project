/**
 * ASHA Dashboard Screen - Government of India
 * ArogyaJal - Water Health Initiative
 * Professional Dashboard with Government Branding
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  AppState,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';
import OfflineBanner from '../components/OfflineBanner';
import LanguageSelector from '../components/LanguageSelector';

export default function AshaDashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    waterTests: 0,
    completedSurveys: 0,
    serviceRequests: 0,
    pendingRequests: 0,
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardScale = useRef([...Array(8)].map(() => new Animated.Value(1))).current;
  const statPulse = useRef([...Array(6)].map(() => new Animated.Value(1))).current;

  // Decorative elements
  const droplet1Y = useRef(new Animated.Value(0)).current;
  const droplet2Y = useRef(new Animated.Value(0)).current;
  const droplet3Y = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Load real stats from database
  const loadStats = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const firestore = require('@react-native-firebase/firestore').default;
      const auth = require('@react-native-firebase/auth').default;
      
      const currentUser = auth().currentUser;
      
      if (!currentUser) {
        console.log('⚠️ No user logged in - showing local data only');
        // Continue to show local data even without authentication
      } else {
        console.log('📊 Loading stats for user:', currentUser.uid);
      }
      
      // Get water tests from SQLite (local pending)
      let localWaterTests = 0;
      let pendingWaterTests = 0;
      try {
        const { getAllWaterTests } = require('../database/operations');
        const waterTests = await getAllWaterTests();
        localWaterTests = waterTests ? waterTests.length : 0;
        // Check for both synced column and status for backward compatibility
        pendingWaterTests = waterTests ? waterTests.filter(t => {
          // If synced column exists, use it; otherwise check status
          if (t.synced !== undefined && t.synced !== null) {
            return t.synced !== 1;
          }
          return t.status === 'pending_sync';
        }).length : 0;
        console.log('Local water tests:', localWaterTests, 'pending:', pendingWaterTests);
      } catch (dbError) {
        console.log('SQLite error:', dbError.message);
      }
      
      // Get household surveys from AsyncStorage (local pending)
      let localSurveys = 0;
      let pendingSurveys = 0;
      try {
        const surveysData = await AsyncStorage.getItem('pending_household_surveys');
        const surveys = JSON.parse(surveysData || '[]');
        localSurveys = surveys.length;
        pendingSurveys = surveys.filter(s => s.synced !== 1).length;
        console.log('Local surveys:', localSurveys, 'pending:', pendingSurveys);
      } catch (storageError) {
        console.log('AsyncStorage error:', storageError.message);
      }
      
      // Fetch from Firestore to get ALL synced data (only if user is logged in)
      let firestoreWaterTests = 0;
      let firestoreSurveys = 0;
      
      if (currentUser) {
        try {
          // Get water tests from Firestore
          const waterTestsSnapshot = await firestore()
            .collection('water_tests')
            .where('ashaId', '==', currentUser.uid)
            .get();
          firestoreWaterTests = waterTestsSnapshot.size;
          console.log('✅ Firestore water tests:', firestoreWaterTests);
          
          // Get household surveys from Firestore
          const surveysSnapshot = await firestore()
            .collection('household_surveys')
            .where('ashaId', '==', currentUser.uid)
            .get();
          firestoreSurveys = surveysSnapshot.size;
          console.log('✅ Firestore surveys:', firestoreSurveys);
          
          // Get service requests assigned to this ASHA worker
          console.log('🔍 Querying service requests for ASHA UID:', currentUser.uid);
          const requestsSnapshot = await firestore()
            .collection('service_requests')
            .where('assignedAshaId', '==', currentUser.uid)
            .get();
          const totalRequests = requestsSnapshot.size;
          const pendingRequests = requestsSnapshot.docs.filter(
            doc => doc.data().status === 'assigned' || doc.data().status === 'pending'
          ).length;
          console.log('✅ Service requests:', totalRequests, 'pending:', pendingRequests);
          
          if (totalRequests === 0) {
            console.log('⚠️ No requests found for this ASHA. Checking sample requests...');
            const sampleSnapshot = await firestore()
              .collection('service_requests')
              .limit(3)
              .get();
            console.log('📋 Sample requests in database:');
            sampleSnapshot.docs.forEach(doc => {
              const data = doc.data();
              console.log('  - assignedAshaId:', data.assignedAshaId, '(expected:', currentUser.uid + ')');
            });
          }
          
          // Store service requests in stats
          setStats(prev => ({
            ...prev,
            serviceRequests: totalRequests,
            pendingRequests: pendingRequests,
          }));
        } catch (firestoreError) {
          console.log('⚠️ Firestore fetch error:', firestoreError.message);
          // If Firestore fails, use local data only
        }
      } else {
        console.log('📱 Using local data only (no authentication)');
      }
      
      // Total calculation:
      // - If logged in: Firestore (synced) + Local pending (not yet synced)
      // - If not logged in: All local data
      const totalWaterTests = currentUser 
        ? (firestoreWaterTests + pendingWaterTests)
        : localWaterTests;
      const totalSurveys = currentUser
        ? (firestoreSurveys + pendingSurveys)
        : localSurveys;
      
      // Calculate totals
      const totalReports = totalWaterTests + totalSurveys;
      const pendingReports = pendingWaterTests + pendingSurveys;
      
      setStats({
        totalReports,
        pendingReports,
        waterTests: totalWaterTests,
        completedSurveys: totalSurveys,
      });
      
      console.log('📊 Final dashboard stats:', { 
        totalReports, 
        pendingReports, 
        waterTests: totalWaterTests, 
        surveys: totalSurveys,
        breakdown: {
          firestoreWaterTests,
          firestoreSurveys,
          pendingWaterTests,
          pendingSurveys
        }
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      // Keep default values on error - don't crash
      setStats({
        totalReports: 0,
        pendingReports: 0,
        waterTests: 0,
        completedSurveys: 0,
      });
    }
  };

  useEffect(() => {
    // Load stats on mount
    loadStats();
    
    // Refresh stats every 2 seconds for more responsive updates
    const statsInterval = setInterval(loadStats, 2000);
    
    // Also refresh when app comes to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('🔄 App became active - refreshing stats');
        loadStats();
      }
    });
    
    return () => {
      clearInterval(statsInterval);
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating droplets
    const createDropletAnimation = (droplet) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(droplet, {
            toValue: -100,
            duration: 5000,
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

    // Wave animation for decorative background
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered stat card pulse animation
    statPulse.forEach((anim, index) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, index * 200);
    });
  }, []);

  const handleCardPressIn = (index) => {
    Animated.spring(cardScale[index], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPressOut = (index) => {
    Animated.spring(cardScale[index], {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  const quickActions = [
    { 
      id: 1, 
      icon: 'bell', 
      title: 'Service Requests', 
      screen: 'AshaServiceRequests', 
      color: COLORS.accent,
      badge: stats.pendingRequests > 0 ? stats.pendingRequests : null,
    },
    { id: 2, icon: 'household', title: t('householdSurvey.title'), screen: 'HouseholdCheck', color: COLORS.primary },
    { id: 3, icon: 'waterTest', title: t('waterTesting.title'), screen: 'WaterTesting', color: COLORS.secondary },
    { id: 4, icon: 'heatmap', title: t('heatmap.title'), screen: 'SymptomHeatmap', color: COLORS.accent },
    { id: 5, icon: 'ayurveda', title: t('ayurvedicRemedies.title'), screen: 'AyurvedicRemedies', color: COLORS.success },
    { id: 6, icon: 'emergency', title: t('emergency.title'), screen: 'EmergencyHelp', color: COLORS.danger },
    { id: 7, icon: 'report', title: t('reports.title'), screen: 'OfflineReports', color: COLORS.info },
    { id: 8, icon: 'school', title: t('training.title'), screen: 'TrainingModules', color: '#8b5cf6' },
  ];

  const getCurrentDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <OfflineBanner />

      {/* Decorative Water Droplets */}
      <View style={styles.decorativeBackground}>
        <Animated.View style={[styles.droplet, styles.droplet1, { transform: [{ translateY: droplet1Y }] }]}>
          <Text style={styles.dropletIcon}>💧</Text>
        </Animated.View>
        <Animated.View style={[styles.droplet, styles.droplet2, { transform: [{ translateY: droplet2Y }] }]}>
          <Text style={styles.dropletIcon}>💧</Text>
        </Animated.View>
        <Animated.View style={[styles.droplet, styles.droplet3, { transform: [{ translateY: droplet3Y }] }]}>
          <Text style={styles.dropletIcon}>💧</Text>
        </Animated.View>
        <View style={[styles.bubble, styles.bubble1]} />
        <View style={[styles.bubble, styles.bubble2]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.emblemContainer}>
            <Image 
              source={require('../assets/images/Emblem_of_India_(navy_blue).svg.png')}
              style={styles.emblemImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>🇮🇳 ArogyaJal</Text>
            <Text style={styles.headerSubtitle}>Government of India</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              console.log('🔄 Manual refresh triggered');
              loadStats();
            }}
          >
            <Icon name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <LanguageSelector buttonStyle={styles.iconButton} />
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation && navigation.navigate && navigation.navigate('AshaProfile')}
          >
            <Icon name="person" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tricolor Stripe */}
      <View style={styles.tricolor}>
        <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Animated.View style={[styles.content, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }]}>
          {/* Welcome Card */}
          <Animated.View 
            style={[
              styles.welcomeCard,
              {
                transform: [
                  { 
                    translateY: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>{t('dashboard.welcome', { name: 'ASHA Worker' })}</Text>
              <Text style={styles.welcomeDate}>{getCurrentDate()}</Text>
            </View>
            <Animated.Text 
              style={[
                styles.welcomeIcon,
                {
                  transform: [
                    {
                      rotate: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '10deg'],
                      })
                    }
                  ]
                }
              ]}
            >
              💧
            </Animated.Text>
          </Animated.View>

          {/* Quick Stats */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
          </View>

          <View style={styles.statsGrid}>
            <Animated.View 
              style={[
                styles.statCard,
                { transform: [{ scale: statPulse[0] }] }
              ]}
            >
              <View style={styles.statIconContainer}>
                <Icon name="report" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalReports}</Text>
              <Text style={styles.statLabel}>{t('dashboard.stats.totalReports')}</Text>
            </Animated.View>

            <Animated.View 
              style={[
                styles.statCard,
                { transform: [{ scale: statPulse[1] }] }
              ]}
            >
              <View style={styles.statIconContainer}>
                <Icon name="pending" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.statValue}>{stats.pendingReports}</Text>
              <Text style={styles.statLabel}>{t('dashboard.stats.pendingReports')}</Text>
            </Animated.View>

            <Animated.View 
              style={[
                styles.statCard,
                { transform: [{ scale: statPulse[2] }] }
              ]}
            >
              <View style={styles.statIconContainer}>
                <Icon name="waterDrop" size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.statValue}>{stats.waterTests}</Text>
              <Text style={styles.statLabel}>{t('dashboard.stats.waterTests')}</Text>
            </Animated.View>

            <Animated.View 
              style={[
                styles.statCard,
                { transform: [{ scale: statPulse[3] }] }
              ]}
            >
              <View style={styles.statIconContainer}>
                <Icon name="completed" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.statValue}>{stats.completedSurveys}</Text>
              <Text style={styles.statLabel}>{t('dashboard.stats.completedSurveys')}</Text>
            </Animated.View>

            {/* Service Requests Card */}
            {stats.serviceRequests > 0 && (
              <Animated.View 
                style={[
                  styles.statCard,
                  styles.statCardWide,
                  { transform: [{ scale: statPulse[0] }] }
                ]}
              >
                <View style={styles.statIconContainer}>
                  <Icon name="bell" size={24} color={COLORS.accent} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{stats.pendingRequests}</Text>
                  <Text style={styles.statLabel}>Pending Requests</Text>
                  <Text style={styles.statSubtext}>{stats.serviceRequests} total requests</Text>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
          </View>

          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.id}
                style={{ transform: [{ scale: cardScale[index] }] }}
              >
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation && navigation.navigate && navigation.navigate(action.screen)}
                  onPressIn={() => handleCardPressIn(index)}
                  onPressOut={() => handleCardPressOut(index)}
                  activeOpacity={1}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}15` }]}>
                    <Icon name={action.icon} size={32} color={action.color} />
                    {action.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{action.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Icon name="shield" size={16} color={COLORS.textLight} />
            <Text style={styles.footerText}>{t('sync.lastSync', { time: 'Just now' })}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Decorative Background
  decorativeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  droplet: {
    position: 'absolute',
    opacity: 0.08,
  },
  droplet1: {
    left: '15%',
    bottom: 0,
  },
  droplet2: {
    left: '50%',
    bottom: 0,
  },
  droplet3: {
    left: '85%',
    bottom: 0,
  },
  dropletIcon: {
    fontSize: 20,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: `${COLORS.secondary}08`,
    borderRadius: 50,
  },
  bubble1: {
    width: 80,
    height: 80,
    top: '30%',
    right: '10%',
  },
  bubble2: {
    width: 60,
    height: 60,
    bottom: '40%',
    left: '5%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emblemContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  emblemImage: {
    width: 36,
    height: 36,
  },
  headerText: {
    marginLeft: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tricolor
  tricolor: {
    flexDirection: 'row',
    height: 3,
    zIndex: 10,
  },
  colorBar: {
    flex: 1,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    ...SHADOWS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  welcomeTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  welcomeDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
  },
  welcomeIcon: {
    fontSize: 32,
  },

  // Section Header
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  statCardWide: {
    minWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent}10`,
    borderColor: COLORS.accent,
  },
  statContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.lg,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  actionTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    textAlign: 'center',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
  },
});
