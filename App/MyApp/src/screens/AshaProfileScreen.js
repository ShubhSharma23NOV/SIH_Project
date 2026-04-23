/**
 * ASHA Profile Screen - Government of India
 * ArogyaJal - Water Health Initiative
 * Using Official Design System v2.0.0
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton, GovStatusBadge } from '../components/gov';
import Icon from '../components/Icon';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService from '../database/DatabaseService';

export default function AshaProfileScreen({ navigation }) {
  const [ashaData, setAshaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    households: 0,
    completedSurveys: 0,
    waterTestsConducted: 0,
    alertsRaised: 0,
  });

  useEffect(() => {
    loadProfileData();
    loadStatistics();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No authenticated user found');
        navigation.navigate('Launch');
        return;
      }

      // Try to get from cache first
      const cachedProfile = await AsyncStorage.getItem('asha_profile');
      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile);
        setAshaData(profile);
      }

      // Fetch fresh data from Firestore
      const doc = await firestore()
        .collection('asha_workers')
        .doc(user.uid)
        .get();

      if (doc.exists) {
        const profile = doc.data();
        setAshaData(profile);
        
        // Update cache
        await AsyncStorage.setItem('asha_profile', JSON.stringify(profile));
      } else {
        Alert.alert('Error', 'Profile not found');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      console.log('[AshaProfile] Loading statistics...');
      
      // Get household surveys from AsyncStorage
      let surveys = [];
      try {
        const surveysData = await AsyncStorage.getItem('pending_household_surveys');
        surveys = surveysData ? JSON.parse(surveysData) : [];
        console.log('[AshaProfile] Loaded', surveys.length, 'household surveys');
      } catch (error) {
        console.error('[AshaProfile] Error loading surveys:', error);
      }
      
      // Get water tests from database using operations
      let waterTests = [];
      try {
        const { getAllWaterTests } = require('../database/operations');
        waterTests = await getAllWaterTests();
        console.log('[AshaProfile] Loaded', waterTests.length, 'water tests');
      } catch (error) {
        console.error('[AshaProfile] Error loading water tests:', error);
      }
      
      // Count alerts (surveys with health issues)
      let alertsCount = 0;
      try {
        alertsCount = surveys.filter(survey => {
          const healthIssues = survey.healthIssues ? JSON.parse(survey.healthIssues) : [];
          return healthIssues.length > 0;
        }).length;
      } catch (error) {
        console.error('[AshaProfile] Error counting alerts:', error);
      }

      const newStats = {
        households: surveys.length,
        completedSurveys: surveys.length,
        waterTestsConducted: waterTests.length,
        alertsRaised: alertsCount,
      };
      
      console.log('[AshaProfile] Stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('[AshaProfile] Error loading statistics:', error);
      // Set default stats on error
      setStats({
        households: 0,
        completedSurveys: 0,
        waterTestsConducted: 0,
        alertsRaised: 0,
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?\nक्या आप लॉगआउट करना चाहते हैं?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              await AsyncStorage.multiRemove(['user_data', 'asha_profile']);
              navigation.navigate('Launch');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    if (!ashaData) return;
    
    // Navigate to edit profile screen with current data
    navigation.navigate('EditProfile', { profileData: ashaData });
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'To change your password, you will be logged out and need to verify your phone number again.\n\nक्या आप जारी रखना चाहते हैं?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              await auth().signOut();
              await AsyncStorage.multiRemove(['user_data', 'asha_profile']);
              navigation.navigate('Launch');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleViewCertificate = () => {
    if (!ashaData) return;
    
    if (!ashaData.certification || ashaData.certification === 'NA') {
      Alert.alert(
        'No Certificate',
        'No certification information available.\n\nकोई प्रमाणपत्र जानकारी उपलब्ध नहीं है।'
      );
      return;
    }
    
    // Navigate to certificate viewer
    navigation.navigate('ViewCertificate', { 
      certification: ashaData.certification,
      name: ashaData.name,
      ashaId: ashaData.ashaId,
      district: ashaData.district,
      createdAt: ashaData.createdAt,
    });
  };

  const handleSyncData = async () => {
    try {
      const SyncService = require('../services/SyncService').default;
      Alert.alert('Sync Data', 'Starting data synchronization...');
      await SyncService.syncAll();
      Alert.alert('Success', 'Data synchronized successfully');
      loadStatistics(); // Refresh stats
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  const handleDownloadReports = () => {
    navigation.navigate('OfflineReports');
  };

  const handleRefresh = () => {
    loadProfileData();
    loadStatistics();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <GovHeader
          title="ASHA Profile"
          subtitle="आशा प्रोफ़ाइल"
          showBack
          onBackPress={() => navigation.navigate('AshaDashboard')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ashaData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <GovHeader
          title="ASHA Profile"
          subtitle="आशा प्रोफ़ाइल"
          showBack
          onBackPress={() => navigation.navigate('AshaDashboard')}
        />
        <View style={styles.errorContainer}>
          <Icon name="warning" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="ASHA Profile"
        subtitle="आशा प्रोफ़ाइल"
        showBack
        onBackPress={() => navigation.navigate('AshaDashboard')}
      >
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </GovHeader>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <GovCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Icon name="person" size={48} color={COLORS.white} />
              </View>
              <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{ashaData.name || 'ASHA Worker'}</Text>
              {ashaData.nameHindi && <Text style={styles.profileNameHindi}>{ashaData.nameHindi}</Text>}
              <Text style={styles.profileId}>{ashaData.ashaId || ashaData.uid || 'N/A'}</Text>
              <View style={styles.badgeRow}>
                <GovStatusBadge 
                  status={ashaData.status === 'active' ? 'success' : 'warning'} 
                  label={ashaData.status || 'Active'} 
                />
                {ashaData.certification && (
                  <View style={styles.certBadge}>
                    <Icon name="certificate" size={14} color={COLORS.accent} />
                    <Text style={styles.certText}>{ashaData.certification}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleEditProfile}>
              <Icon name="edit" size={20} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleViewCertificate}>
              <Icon name="certificate" size={20} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Certificate</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleChangePassword}>
              <Icon name="lock" size={20} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Password</Text>
            </TouchableOpacity>
          </View>
        </GovCard>

        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <GovCard style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="household" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{stats.households}</Text>
            <Text style={styles.statLabel}>Households</Text>
            <Text style={styles.statLabelHindi}>घर</Text>
          </GovCard>

          <GovCard style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="survey" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{stats.completedSurveys}</Text>
            <Text style={styles.statLabel}>Surveys</Text>
            <Text style={styles.statLabelHindi}>सर्वेक्षण</Text>
          </GovCard>

          <GovCard style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="waterTest" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.statValue}>{stats.waterTestsConducted}</Text>
            <Text style={styles.statLabel}>Water Tests</Text>
            <Text style={styles.statLabelHindi}>जल परीक्षण</Text>
          </GovCard>

          <GovCard style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="warning" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.statValue}>{stats.alertsRaised}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
            <Text style={styles.statLabelHindi}>अलर्ट</Text>
          </GovCard>
        </View>

        {/* Contact Information */}
        <GovCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="phone" size={24} color={COLORS.primary} />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <Text style={styles.sectionTitleHindi}>संपर्क जानकारी</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="call" size={20} color={COLORS.textMedium} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{ashaData.phoneNumber || 'Not Set'}</Text>
            </View>
          </View>

          {ashaData.email && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Icon name="email" size={20} color={COLORS.textMedium} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>{ashaData.email}</Text>
                </View>
              </View>
            </>
          )}
        </GovCard>

        {/* Work Location */}
        <GovCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="mapMarker" size={24} color={COLORS.primary} />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Work Location</Text>
              <Text style={styles.sectionTitleHindi}>कार्य स्थान</Text>
            </View>
          </View>

          <View style={styles.locationGrid}>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>District • जिला</Text>
              <Text style={styles.locationValue}>{ashaData.district || 'Not Set'}</Text>
              {ashaData.districtHindi && <Text style={styles.locationValueHindi}>{ashaData.districtHindi}</Text>}
            </View>

            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Block • ब्लॉक</Text>
              <Text style={styles.locationValue}>{ashaData.block || 'Not Set'}</Text>
              {ashaData.blockHindi && <Text style={styles.locationValueHindi}>{ashaData.blockHindi}</Text>}
            </View>

            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Village • गाँव</Text>
              <Text style={styles.locationValue}>{ashaData.village || 'Not Set'}</Text>
              {ashaData.villageHindi && <Text style={styles.locationValueHindi}>{ashaData.villageHindi}</Text>}
            </View>

            {ashaData.createdAt && (
              <View style={styles.locationItem}>
                <Text style={styles.locationLabel}>Join Date • शामिल होने की तिथि</Text>
                <Text style={styles.locationValue}>
                  {ashaData.createdAt?.toDate ? 
                    ashaData.createdAt.toDate().toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long' 
                    }) : 
                    'Not Available'
                  }
                </Text>
              </View>
            )}
          </View>
        </GovCard>

        {/* Actions */}
        <GovCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="settings" size={24} color={COLORS.primary} />
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <Text style={styles.sectionTitleHindi}>कार्रवाई</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionItem} onPress={handleSyncData}>
            <View style={styles.actionLeft}>
              <Icon name="sync" size={22} color={COLORS.accent} />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Sync Data</Text>
                <Text style={styles.actionSubtitle}>Upload pending surveys</Text>
              </View>
            </View>
            <Icon name="chevronRight" size={20} color={COLORS.textLight} />
          </TouchableOpacity>

          <View style={styles.infoDivider} />

          <TouchableOpacity style={styles.actionItem} onPress={handleDownloadReports}>
            <View style={styles.actionLeft}>
              <Icon name="download" size={22} color={COLORS.info} />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>View Reports</Text>
                <Text style={styles.actionSubtitle}>View all submitted reports</Text>
              </View>
            </View>
            <Icon name="chevronRight" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </GovCard>

        {/* Logout Button */}
        <GovButton
          title="Logout"
          subtitle="लॉगआउट"
          onPress={handleLogout}
          variant="danger"
          icon="logout"
          fullWidth
          style={styles.logoutButton}
        />

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ArogyaJal • आरोग्य जल</Text>
          <Text style={styles.footerSubtext}>Ministry of Health & Family Welfare</Text>
          <Text style={styles.footerSubtext}>स्वास्थ्य और परिवार कल्याण मंत्रालय</Text>
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
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
  },
  retryButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile Header
  profileCard: {
    marginBottom: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.md,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  profileNameHindi: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  profileId: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xs,
    gap: SPACING.xs,
  },
  certText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.accent,
  },
  quickActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.md,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  actionDivider: {
    width: 1,
    backgroundColor: COLORS.borderLight,
  },

  // Statistics
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
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
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
  },
  statLabelHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
  },

  // Section Cards
  sectionCard: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionTitleContainer: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  sectionTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.xs,
  },

  // Location
  locationGrid: {
    gap: SPACING.md,
  },
  locationItem: {
    paddingVertical: SPACING.sm,
  },
  locationLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  locationValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  locationValueHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    marginTop: 2,
  },

  // Actions
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
  },

  // Logout
  logoutButton: {
    marginBottom: SPACING.lg,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  footerSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
