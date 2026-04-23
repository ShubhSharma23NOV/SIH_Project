/**
 * PHC Dashboard Screen - REDESIGNED
 * Simplified, Fast, High-Impact Command Center for PHC Doctors
 * Focus: Core USP Features Only
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  Animated,
  Image,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';
import { usePHCAuth } from '../context/PHCAuthContext';

export default function PHCDashboardScreen({ navigation }) {
  const { phcProfile, assignedAreas, logout, refreshData } = usePHCAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // SIMPLIFIED: Only 4 Essential KPIs
  const [stats, setStats] = useState({
    pendingReferrals: 0,
    highRiskPregnancies: 0,
    activeEmergencies: 0,
    abnormalWaterTests: 0,
    totalASHAs: 0,
  });

  // Critical Alerts (Real-time)
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  
  // Animation refs (matching ASHA dashboard)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // If profile is not loaded, try to refresh it
    if (!phcProfile && refreshData) {
      console.log('[PHCDashboard] Profile not loaded, refreshing...');
      refreshData();
    }
    
    loadDashboardData();
    
    // Real-time listener for critical alerts
    const unsubscribe = setupRealtimeAlerts();
    return () => unsubscribe && unsubscribe();
  }, [phcProfile]);
  
  // Entrance animations (matching ASHA dashboard)
  useEffect(() => {
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
  }, []);

  // OPTIMIZED: Fast, parallel data loading
  const loadDashboardData = async () => {
    try {
      if (!phcProfile) {
        console.log('⚠️ PHC Profile not loaded yet');
        return;
      }

      const phcId = phcProfile.phcId;
      console.log('📊 Loading dashboard for PHC:', phcId);
      
      // Parallel queries for speed
      const [
        referralsSnap,
        householdSurveysSnap,
        pregnanciesSnap,
        waterTestsSnap,
        emergenciesSnap,
        ashaSnap,
      ] = await Promise.all([
        // Load explicit referrals
        firestore()
          .collection('referrals')
          .get()
          .then(snap => {
            const filtered = snap.docs.filter(doc => doc.data().status === 'pending');
            return { docs: filtered, size: filtered.length };
          }),
        
        // Load household surveys (count as referrals)
        firestore()
          .collection('household_surveys')
          .get()
          .then(snap => {
            const filtered = snap.docs.filter(doc => {
              const status = doc.data().status;
              return status === 'pending' || status === 'pending_sync';
            });
            return { docs: filtered, size: filtered.length };
          }),
        
        // DEV MODE: Fetch ALL referrals (no phcId filter for testing)
        firestore()
          .collection('referrals')
          // .where('phcId', '==', phcId)  // Commented for testing
          .get()
          .then(snap => {
            const filtered = snap.docs.filter(doc => {
              const data = doc.data();
              return data.riskLevel === 'high' && data.type === 'pregnancy';
            });
            return { docs: filtered, size: filtered.length };
          }),
        
        // Simplified query to avoid index requirement during development
        firestore()
          .collection('water_tests')
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get()
          .then(snap => {
            // Filter in memory for high/critical risk
            const filtered = snap.docs.filter(doc => 
              ['high', 'critical'].includes(doc.data().riskLevel)
            );
            return { docs: filtered, size: filtered.length };
          }),
        
        // DEV MODE: Fetch ALL emergencies (no phcId filter for testing)
        firestore()
          .collection('emergencies')
          // .where('phcId', '==', phcId)  // Commented for testing
          .get()
          .then(snap => {
            // Filter for active status in memory
            const filtered = snap.docs.filter(doc => doc.data().status === 'active');
            return { docs: filtered, size: filtered.length };
          }),
        
        // DEV MODE: Fetch ALL ASHA workers (no phcId filter for testing)
        firestore()
          .collection('asha_workers')
          // .where('phcId', '==', phcId)  // Commented for testing
          .where('status', '==', 'active')
          .get(),
      ]);

      // Combine referrals from both sources
      const totalPendingReferrals = referralsSnap.size + householdSurveysSnap.size;
      
      console.log('📊 Dashboard Stats:', {
        explicitReferrals: referralsSnap.size,
        householdSurveys: householdSurveysSnap.size,
        totalPendingReferrals: totalPendingReferrals,
        highRiskPregnancies: pregnanciesSnap.size,
        abnormalWaterTests: waterTestsSnap.size,
        activeEmergencies: emergenciesSnap.size,
        totalASHAs: ashaSnap.size,
      });

      if (householdSurveysSnap.size > 0) {
        console.log('📋 Sample household survey:', householdSurveysSnap.docs[0]?.data());
      }

      const newStats = {
        pendingReferrals: totalPendingReferrals,
        highRiskPregnancies: pregnanciesSnap.size,
        abnormalWaterTests: waterTestsSnap.size,
        activeEmergencies: emergenciesSnap.size,
        totalASHAs: ashaSnap.size,
      };
      
      console.log('✅ Setting stats to:', newStats);
      setStats(newStats);
      setDataLoaded(true);

      // Build critical alerts list (include household surveys)
      const combinedReferrals = {
        docs: [...referralsSnap.docs, ...householdSurveysSnap.docs],
        size: totalPendingReferrals,
      };
      buildCriticalAlerts(combinedReferrals, pregnanciesSnap, emergenciesSnap, waterTestsSnap);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
      setDataLoaded(true);
    }
  };

  // REAL-TIME ALERTS (USP Feature)
  const setupRealtimeAlerts = () => {
    if (!phcProfile) return;

    return firestore()
      .collection('referrals')
      .where('phcId', '==', phcProfile.phcId)
      .where('status', '==', 'pending')
      .where('urgent', '==', true)
      .onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const urgentCount = snapshot.size;
          // Show notification badge
          console.log(`🚨 ${urgentCount} urgent referrals need attention`);
        }
      });
  };

  // Build critical alerts from data
  const buildCriticalAlerts = (referrals, pregnancies, emergencies, waterTests) => {
    const alerts = [];

    // Urgent referrals
    referrals.docs.forEach(doc => {
      const data = doc.data();
      if (data.urgent || data.priority === 'high') {
        alerts.push({
          id: doc.id,
          type: 'referral',
          title: `Urgent Referral: ${data.patientName}`,
          subtitle: data.symptoms || 'Requires immediate review',
          time: data.createdAt,
          action: () => navigation.navigate('PHCReferralDetail', { referralId: doc.id }),
        });
      }
    });

    // High-risk pregnancies
    pregnancies.docs.forEach(doc => {
      const data = doc.data();
      alerts.push({
        id: doc.id,
        type: 'pregnancy',
        title: `High-Risk Pregnancy: ${data.patientName}`,
        subtitle: data.complications || 'Requires monitoring',
        time: data.createdAt,
        action: () => navigation.navigate('PHCReferralDetail', { referralId: doc.id }),
      });
    });

    // Active emergencies
    emergencies.docs.forEach(doc => {
      const data = doc.data();
      alerts.push({
        id: doc.id,
        type: 'emergency',
        title: `Active Emergency: ${data.patientName}`,
        subtitle: data.condition || 'Emergency response needed',
        time: data.createdAt,
        action: () => navigation.navigate('PHCEmergencyDetail', { emergencyId: doc.id }),
      });
    });

    // Sort by time (most recent first)
    alerts.sort((a, b) => {
      const timeA = a.time?.toDate?.() || new Date(0);
      const timeB = b.time?.toDate?.() || new Date(0);
      return timeB - timeA;
    });

    setCriticalAlerts(alerts.slice(0, 5)); // Show top 5 only
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh PHC profile data
    if (refreshData) {
      await refreshData();
    }
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Launch');
          },
        },
      ]
    );
  };

  // Get time ago string
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get alert icon and color
  const getAlertStyle = (type) => {
    switch (type) {
      case 'emergency':
        return { icon: 'emergency', color: COLORS.error, bg: `${COLORS.error}15` };
      case 'pregnancy':
        return { icon: 'health', color: COLORS.warning, bg: `${COLORS.warning}15` };
      case 'referral':
        return { icon: 'person', color: COLORS.accent, bg: `${COLORS.accent}15` };
      default:
        return { icon: 'warning', color: COLORS.info, bg: `${COLORS.info}15` };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header - Matching ASHA Dashboard */}
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
            <Text style={styles.headerTitle}>🇮🇳 PHC Command Center</Text>
            <Text style={styles.headerSubtitle}>Government of India</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={onRefresh}
          >
            <Icon name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tricolor Stripe */}
      <View style={styles.tricolor}>
        <View style={[styles.colorBar, { backgroundColor: '#FF9933' }]} />
        <View style={[styles.colorBar, { backgroundColor: '#FFFFFF' }]} />
        <View style={[styles.colorBar, { backgroundColor: '#138808' }]} />
      </View>
      
      {/* Doctor Info Card */}
      <Animated.View style={[styles.doctorCard, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <View style={styles.doctorAvatar}>
          <Icon name="person" size={32} color={COLORS.primary} />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>Dr. {phcProfile?.name || 'Medical Officer'}</Text>
          <Text style={styles.phcName}>{phcProfile?.phcName || 'PHC'}</Text>
          <Text style={styles.ashaCount}>
            {stats.totalASHAs} ASHA Workers {dataLoaded ? '✓' : '⏳'}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* 4 ESSENTIAL KPIs - HIGH IMPACT ONLY */}
        <View style={styles.kpiGrid}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <TouchableOpacity 
              style={[styles.kpiCard, stats.pendingReferrals > 0 && styles.kpiCardUrgent]}
              onPress={() => navigation.navigate('PHCReferrals')}
              activeOpacity={0.7}
            >
              <View style={[styles.kpiIcon, { backgroundColor: COLORS.error }]}>
                <Icon name="account" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.kpiValue}>{stats.pendingReferrals}</Text>
              <Text style={styles.kpiLabel}>Pending{'\n'}Referrals</Text>
              {stats.pendingReferrals > 0 && (
                <View style={styles.urgentDot} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.kpiCard, stats.highRiskPregnancies > 0 && styles.kpiCardWarning]}
              onPress={() => navigation.navigate('PHCReferrals', { filter: 'high_risk_pregnancy' })}
              activeOpacity={0.7}
            >
              <View style={[styles.kpiIcon, { backgroundColor: COLORS.warning }]}>
                <Icon name="health" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.kpiValue}>{stats.highRiskPregnancies}</Text>
              <Text style={styles.kpiLabel}>High-Risk{'\n'}Pregnancies</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <TouchableOpacity 
              style={[styles.kpiCard, stats.activeEmergencies > 0 && styles.kpiCardUrgent]}
              onPress={() => navigation.navigate('PHCEmergencies')}
              activeOpacity={0.7}
            >
              <View style={[styles.kpiIcon, { backgroundColor: COLORS.error }]}>
                <Icon name="emergency" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.kpiValue}>{stats.activeEmergencies}</Text>
              <Text style={styles.kpiLabel}>Active{'\n'}Emergencies</Text>
              {stats.activeEmergencies > 0 && (
                <View style={styles.urgentDot} />
              )}
            </TouchableOpacity>

            <View 
              style={[styles.kpiCard, stats.abnormalWaterTests > 0 && styles.kpiCardWarning]}
            >
              <View style={[styles.kpiIcon, { backgroundColor: COLORS.secondary }]}>
                <Icon name="waterTest" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.kpiValue}>{stats.abnormalWaterTests}</Text>
              <Text style={styles.kpiLabel}>Abnormal{'\n'}Water Tests</Text>
            </View>
          </View>
        </View>

        {/* CRITICAL ALERTS PANEL (USP Feature) */}
        {criticalAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <View style={styles.alertsHeader}>
              <View style={styles.alertsHeaderLeft}>
                <View style={styles.alertsBadge}>
                  <Text style={styles.alertsBadgeText}>{criticalAlerts.length}</Text>
                </View>
                <Text style={styles.alertsTitle}>Critical Alerts</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PHCReferrals')}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>

            {criticalAlerts.map((alert) => {
              const style = getAlertStyle(alert.type);
              return (
                <TouchableOpacity
                  key={alert.id}
                  style={styles.alertItem}
                  onPress={alert.action}
                  activeOpacity={0.7}
                >
                  <View style={[styles.alertItemIcon, { backgroundColor: style.bg }]}>
                    <Icon name={style.icon} size={20} color={style.color} />
                  </View>
                  <View style={styles.alertItemContent}>
                    <Text style={styles.alertItemTitle}>{alert.title}</Text>
                    <Text style={styles.alertItemSubtitle}>{alert.subtitle}</Text>
                  </View>
                  <View style={styles.alertItemRight}>
                    <Text style={styles.alertItemTime}>{getTimeAgo(alert.time)}</Text>
                    <Icon name="chevronRight" size={16} color={COLORS.textLight} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* QUICK ACTIONS - STREAMLINED */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PHCReferrals')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                <Icon name="person" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Review{'\n'}Referrals</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PHCEmergencies')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.error}15` }]}>
                <Icon name="emergency" size={28} color={COLORS.error} />
              </View>
              <Text style={styles.quickActionLabel}>Emergency{'\n'}Panel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PHCAnalytics')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.info}15` }]}>
                <Icon name="chart" size={28} color={COLORS.info} />
              </View>
              <Text style={styles.quickActionLabel}>Analytics{'\n'}& Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PHCDirectory')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${COLORS.accent}15` }]}>
                <Icon name="people" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.quickActionLabel}>ASHA{'\n'}Directory</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty State */}
        {criticalAlerts.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="checkCircle" size={48} color={COLORS.success} />
            <Text style={styles.emptyStateText}>All Clear!</Text>
            <Text style={styles.emptyStateSubtext}>No critical alerts at the moment</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Ministry of Health & Family Welfare • Government of India</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header - Matching ASHA Dashboard
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emblemContainer: {
    width: 40,
    height: 40,
    marginRight: SPACING.sm,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    marginTop: 2,
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
  
  // Tricolor Stripe
  tricolor: {
    flexDirection: 'row',
    height: 4,
  },
  colorBar: {
    flex: 1,
  },
  
  // Doctor Info Card
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.lg,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  phcName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: `${COLORS.white}90`,
    marginTop: 2,
  },
  ashaCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: `${COLORS.white}70`,
    marginTop: 2,
  },
  
  content: {
    flex: 1,
  },

  // 4 ESSENTIAL KPIs
  kpiGrid: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.md,
    position: 'relative',
  },
  kpiCardUrgent: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}08`,
  },
  kpiCardWarning: {
    borderColor: COLORS.warning,
    backgroundColor: `${COLORS.warning}08`,
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  kpiValue: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  kpiLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 16,
  },
  urgentDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  // CRITICAL ALERTS PANEL
  alertsSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  alertsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  alertsBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  alertsTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  viewAllLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  alertItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  alertItemContent: {
    flex: 1,
  },
  alertItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  alertItemSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
  },
  alertItemRight: {
    alignItems: 'flex-end',
  },
  alertItemTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: 4,
  },

  // QUICK ACTIONS
  quickActionsSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
    lineHeight: 18,
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    marginHorizontal: SPACING.md,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: SPACING.xs,
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
