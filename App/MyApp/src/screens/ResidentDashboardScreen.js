/**
 * Resident Dashboard Screen
 * Main home screen for local residents
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovCard } from '../components/gov';
import Icon from '../components/Icon';
import { useResidentAuth } from '../context/ResidentAuthContext';

export default function ResidentDashboardScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' or 'hi'
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'pending' | 'syncing'
  
  const { residentProfile, householdData, loading: authLoading, logout } = useResidentAuth();
  
  const [residentData, setResidentData] = useState({
    name: 'Resident',
    nameHindi: 'निवासी',
    householdId: 'HH-2024-001',
    village: 'Rampur',
    villageHindi: 'रामपुर',
    block: 'Sadar',
    district: 'Varanasi',
    profilePhoto: null,
  });
  const [stats, setStats] = useState({
    surveyCount: 3,
    alertCount: 2,
    waterTestStatus: 'Safe',
    lastVisit: '15 Dec 2024',
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    if (residentProfile) {
      setResidentData({
        name: residentProfile.name || 'Ramesh Kumar',
        nameHindi: residentProfile.nameHindi || 'रमेश कुमार',
        householdId: residentProfile.householdId || 'HH-2024-001',
        village: residentProfile.village || 'Rampur',
        villageHindi: residentProfile.villageHindi || 'रामपुर',
        block: residentProfile.block || 'Sadar',
        district: residentProfile.district || 'Varanasi',
        profilePhoto: residentProfile.profilePhoto || null,
      });
      loadStats();
    }
  }, [residentProfile]);

  const loadStats = async () => {
    try {
      // Check if user is authenticated
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('User not authenticated, using Fast Access mode');
        // Load public data only
        await loadPublicStats();
        return;
      }

      // Check if profile exists
      if (!residentProfile) {
        console.log('No resident profile available yet');
        return;
      }

      // Load household-specific stats if householdId exists
      if (residentProfile.householdId) {
        // Load surveys for this household
        const surveysSnapshot = await firestore()
          .collection('household_surveys')
          .where('householdId', '==', residentProfile.householdId)
          .get();
        
        const surveyCount = surveysSnapshot.size;
        const lastSurvey = surveysSnapshot.docs[0];
        const lastVisit = lastSurvey ? 
          lastSurvey.data().createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 
          '15 Dec 2024';

        setStats(prev => ({
          ...prev,
          surveyCount: surveyCount || 3,
          lastVisit,
        }));
      }

      // Load area-based stats if village exists
      if (residentProfile.village && residentProfile.village !== 'N/A') {
        // Load alerts for this area
        const alertsSnapshot = await firestore()
          .collection('alerts')
          .where('area', '==', residentProfile.village)
          .get();
        
        // Filter expired alerts in JavaScript
        const activeAlerts = alertsSnapshot.docs
          .filter(doc => {
            const expiresAt = doc.data().expiresAt?.toDate();
            return !expiresAt || expiresAt > new Date();
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
          });
        
        const alertCount = activeAlerts.length;
        
        // Set recent alerts (top 3)
        setRecentAlerts(activeAlerts.slice(0, 3));

        // Load latest water test for area
        const waterTestSnapshot = await firestore()
          .collection('water_tests')
          .where('village', '==', residentProfile.village)
          .get();
        
        // Sort in JavaScript and get the latest
        const sortedTests = waterTestSnapshot.docs
          .map(doc => ({ ...doc.data(), id: doc.id }))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
          });
        
        const waterTestStatus = sortedTests.length > 0 ? 
          sortedTests[0].riskLevel || 'Unknown' : 
          'Unknown';

        setStats(prev => ({
          ...prev,
          alertCount,
          waterTestStatus,
        }));
      }
      
      // Load government schemes
      await loadSchemes();
    } catch (error) {
      console.error('Error loading stats:', error);
      // If permission denied, user is likely using Fast Access
      if (error.code === 'firestore/permission-denied') {
        console.log('Permission denied - user may be using Fast Access without authentication');
        await loadPublicStats();
      }
    }
  };

  const loadPublicStats = async () => {
    try {
      const currentUser = auth().currentUser;
      
      if (currentUser) {
        // Load public alerts (only if authenticated)
        const alertsSnapshot = await firestore()
          .collection('alerts')
          .limit(10)
          .get();
        
        const activeAlerts = alertsSnapshot.docs
          .filter(doc => {
            const expiresAt = doc.data().expiresAt?.toDate();
            return !expiresAt || expiresAt > new Date();
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
          });
        
        setStats(prev => ({
          ...prev,
          alertCount: activeAlerts.length,
        }));
        
        // Set recent alerts
        setRecentAlerts(activeAlerts.slice(0, 3));
      } else {
        console.log('📱 No authentication - showing default data');
        // Set default stats when not authenticated
        setStats(prev => ({
          ...prev,
          alertCount: 0,
        }));
        setRecentAlerts([]);
      }
      
      // Load schemes
      await loadSchemes();
    } catch (error) {
      console.error('Error loading public stats:', error);
    }
  };

  const loadSchemes = async () => {
    try {
      const currentUser = auth().currentUser;
      
      // Only try to fetch from Firestore if user is authenticated
      if (currentUser) {
        const schemesSnapshot = await firestore()
          .collection('government_schemes')
          .where('active', '==', true)
          .limit(5)
          .get();
        
        if (!schemesSnapshot.empty) {
          const schemesData = schemesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSchemes(schemesData);
          return; // Exit early if we got data
        }
      }
      
      // Set default schemes if no user or no data in database
      setSchemes([
        {
          id: 'jjm',
          title: 'Jal Jeevan Mission',
          titleHindi: 'जल जीवन मिशन',
          description: 'Providing tap water connection to every rural household',
          descriptionHindi: 'हर ग्रामीण घर में नल का पानी कनेक्शन प्रदान करना',
          icon: 'waterTest',
          color: COLORS.info,
        },
        {
          id: 'swachh',
          title: 'Swachh Bharat Mission',
          titleHindi: 'स्वच्छ भारत मिशन',
          description: 'Clean India initiative for sanitation and hygiene',
          descriptionHindi: 'स्वच्छता और स्वच्छता के लिए स्वच्छ भारत पहल',
          icon: 'health',
          color: COLORS.success,
        },
        {
          id: 'ayushman',
          title: 'Ayushman Bharat',
          titleHindi: 'आयुष्मान भारत',
          description: 'Health insurance scheme for vulnerable families',
          descriptionHindi: 'कमजोर परिवारों के लिए स्वास्थ्य बीमा योजना',
          icon: 'doctor',
          color: COLORS.primary,
        },
      ]);
    } catch (error) {
      console.error('Error loading schemes:', error);
      // Set default schemes on error
      setSchemes([
        {
          id: 'jjm',
          title: 'Jal Jeevan Mission',
          titleHindi: 'जल जीवन मिशन',
          description: 'Providing tap water connection to every rural household',
          descriptionHindi: 'हर ग्रामीण घर में नल का पानी कनेक्शन प्रदान करना',
          icon: 'waterTest',
          color: COLORS.info,
        },
      ]);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${language === 'en' ? 'minutes ago' : 'मिनट पहले'}`;
    if (diffHours < 24) return `${diffHours} ${language === 'en' ? 'hours ago' : 'घंटे पहले'}`;
    if (diffDays < 7) return `${diffDays} ${language === 'en' ? 'days ago' : 'दिन पहले'}`;
    
    return date.toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return COLORS.error;
      case 'high': return COLORS.warning;
      case 'medium': return COLORS.accent;
      case 'low': return COLORS.info;
      default: return COLORS.warning;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadStats();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handleLogout = () => {
    Alert.alert(
      language === 'en' ? 'Logout' : 'लॉगआउट',
      language === 'en' ? 'Are you sure you want to logout?' : 'क्या आप लॉगआउट करना चाहते हैं?',
      [
        {
          text: language === 'en' ? 'Cancel' : 'रद्द करें',
          style: 'cancel',
        },
        {
          text: language === 'en' ? 'Logout' : 'लॉगआउट',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Launch');
          },
        },
      ]
    );
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced': return { icon: 'checkCircle', color: COLORS.success };
      case 'pending': return { icon: 'warning', color: COLORS.warning };
      case 'syncing': return { icon: 'sync', color: COLORS.info };
      default: return { icon: 'checkCircle', color: COLORS.success };
    }
  };

  const quickActions = [
    {
      id: 'household',
      icon: 'household',
      label: 'My Household',
      labelHindi: 'मेरा घर',
      color: COLORS.primary,
      screen: 'ResidentHousehold',
    },
    {
      id: 'request_history',
      icon: 'calendar',
      label: 'Request History',
      labelHindi: 'अनुरोध इतिहास',
      color: COLORS.info,
      screen: 'ResidentRequestHistory',
    },
    {
      id: 'contact_asha',
      icon: 'call',
      label: 'Contact ASHA',
      labelHindi: 'आशा से संपर्क करें',
      color: COLORS.accent,
      screen: 'ResidentContact',
    },
    {
      id: 'feedback',
      icon: 'star',
      label: 'Give Feedback',
      labelHindi: 'प्रतिक्रिया दें',
      color: COLORS.success,
      screen: 'ResidentFeedback',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>ArogyaJal</Text>
          <Text style={styles.appTitleHindi}>आरोग्य जल</Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* Language Toggle */}
          <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
            <Text style={styles.langText}>{language === 'en' ? 'हिं' : 'EN'}</Text>
          </TouchableOpacity>
          
          {/* Sync Status */}
          <View style={styles.syncIndicator}>
            <Icon name={getSyncIcon().icon} size={16} color={getSyncIcon().color} />
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Card */}
        <GovCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {residentData.profilePhoto ? (
                <Image source={{ uri: residentData.profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={32} color={COLORS.white} />
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {language === 'en' ? residentData.name : residentData.nameHindi}
              </Text>
              <Text style={styles.householdId}>
                {language === 'en' ? 'Household ID' : 'घर आईडी'}: {residentData.householdId}
              </Text>
              <Text style={styles.location}>
                📍 {residentData.village}, {residentData.block}
              </Text>
            </View>
          </View>
        </GovCard>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('ResidentHousehold')}
          >
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.primary}15` }]}>
              <Icon name="survey" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{stats.surveyCount}</Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Surveys' : 'सर्वेक्षण'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('ResidentAlerts')}
          >
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.warning}15` }]}>
              <Icon name="warning" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.statValue}>{stats.alertCount}</Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Alerts' : 'अलर्ट'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('ResidentHousehold')}
          >
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.success}15` }]}>
              <Icon name="waterTest" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{stats.waterTestStatus}</Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Water Status' : 'जल स्थिति'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('ResidentHousehold')}
          >
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.accent}15` }]}>
              <Icon name="calendar" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{stats.lastVisit}</Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Last Visit' : 'अंतिम विज़िट'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Quick Actions' : 'त्वरित कार्रवाई'}
          </Text>
          
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionButton}
                onPress={() => {
                  if (action.action) {
                    action.action();
                  } else if (action.screen) {
                    navigation.navigate(action.screen, action.params);
                  }
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Icon name={action.icon} size={28} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>
                  {language === 'en' ? action.label : action.labelHindi}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Alerts Preview */}
        {recentAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Recent Alerts' : 'हाल की अलर्ट'}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('ResidentAlerts')}>
                <Text style={styles.viewAll}>
                  {language === 'en' ? 'View All' : 'सभी देखें'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {recentAlerts.map((alert) => (
              <GovCard 
                key={alert.id} 
                style={[
                  styles.alertPreview,
                  { borderLeftColor: getSeverityColor(alert.severity) }
                ]}
              >
                <View style={styles.alertHeader}>
                  <Icon name="warning" size={20} color={getSeverityColor(alert.severity)} />
                  <Text style={styles.alertTitle}>
                    {language === 'en' ? alert.title : alert.titleHindi || alert.title}
                  </Text>
                </View>
                <Text style={styles.alertMessage}>
                  {language === 'en' ? alert.message : alert.messageHindi || alert.message}
                </Text>
                <View style={styles.alertFooter}>
                  <Text style={styles.alertTime}>{getTimeAgo(alert.createdAt)}</Text>
                  {alert.severity && (
                    <View style={[styles.severityBadge, { backgroundColor: `${getSeverityColor(alert.severity)}20` }]}>
                      <Text style={[styles.severityText, { color: getSeverityColor(alert.severity) }]}>
                        {alert.severity}
                      </Text>
                    </View>
                  )}
                </View>
              </GovCard>
            ))}
          </View>
        )}

        {/* Government Schemes */}
        {schemes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Government Schemes' : 'सरकारी योजनाएं'}
            </Text>
            
            {schemes.map((scheme) => (
              <GovCard key={scheme.id} style={styles.schemeCard}>
                <View style={[styles.schemeIcon, { backgroundColor: `${scheme.color || COLORS.info}15` }]}>
                  <Icon name={scheme.icon || 'info'} size={20} color={scheme.color || COLORS.info} />
                </View>
                <View style={styles.schemeContent}>
                  <Text style={styles.schemeTitle}>
                    {language === 'en' ? scheme.title : scheme.titleHindi || scheme.title}
                  </Text>
                  {scheme.description && (
                    <Text style={styles.schemeDescription}>
                      {language === 'en' ? scheme.description : scheme.descriptionHindi || scheme.description}
                    </Text>
                  )}
                </View>
                <Icon name="next" size={16} color={COLORS.textLight} />
              </GovCard>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {language === 'en' 
              ? 'Ministry of Health & Family Welfare'
              : 'स्वास्थ्य और परिवार कल्याण मंत्रालय'}
          </Text>
          <Text style={styles.footerSubtext}>
            {language === 'en' ? 'Government of India' : 'भारत सरकार'}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ResidentRequest')}
      >
        <Icon name="add" size={24} color={COLORS.white} />
        <Text style={styles.fabText}>
          {language === 'en' ? 'Request Help' : 'मदद मांगें'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {},
  appTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  appTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  langButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
  },
  langText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  syncIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  profileCard: {
    marginBottom: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  householdId: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    marginBottom: SPACING.xs,
  },
  location: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  viewAll: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  alertPreview: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  alertMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  alertTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
  },
  schemeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  schemeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeContent: {
    flex: 1,
  },
  schemeTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  schemeDescription: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.round,
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  fabText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
