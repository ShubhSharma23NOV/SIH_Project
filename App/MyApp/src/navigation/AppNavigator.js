import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, BackHandler, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from '../screens/LoadingScreen';
import LaunchScreen from '../screens/LaunchScreen';
import HomeScreen from '../screens/HomeScreen';
import UnifiedLoginScreen from '../screens/UnifiedLoginScreen';
import AshaDashboardScreen from '../screens/AshaDashboardScreen';
import AshaServiceRequestsScreen from '../screens/AshaServiceRequestsScreen';
import AshaServiceRequestDetailScreen from '../screens/AshaServiceRequestDetailScreen';
import AshaReportCaseScreen from '../screens/AshaReportCaseScreen';
import SensorUploadScreen from '../screens/SensorUploadScreen';
import GeneratedDataScreen from '../screens/GeneratedDataScreen';
import AlertsScreen from '../screens/AlertsScreen';
import HouseholdHealthCheckScreen from '../screens/HouseholdHealthCheckScreen';
import ConsentScreen from '../screens/ConsentScreen';
import HouseholdSurveyScreen from '../screens/HouseholdSurveyScreen';
import WaterTestingScreen from '../screens/WaterTestingScreen';
import ManualWaterTestScreen from '../screens/ManualWaterTestScreen';
import SensorTestScreen from '../screens/SensorTestScreen';
import WaterTestsHistoryScreen from '../screens/WaterTestsHistoryScreen';
import SymptomHeatmapScreen from '../screens/SymptomHeatmapScreen';
import CombinedHeatmapScreen from '../screens/CombinedHeatmapScreen';
import SatelliteMapScreen from '../screens/SatelliteMapScreen';
import AyurvedicRemediesScreen from '../screens/AyurvedicRemediesScreen';
import EmergencyHelpScreen from '../screens/EmergencyHelpScreen';
import EnhancedEmergencyScreen from '../screens/EnhancedEmergencyScreen';
import WaterLifespanScreen from '../screens/WaterLifespanScreen';
import AshaProfileScreen from '../screens/AshaProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ViewCertificateScreen from '../screens/ViewCertificateScreen';
import OfflineReportsScreen from '../screens/OfflineReportsScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import WaterTestDetailScreen from '../screens/WaterTestDetailScreen';

// Resident Module Screens
import ResidentAuthScreen from '../screens/ResidentAuthScreen';
import ResidentDashboardScreen from '../screens/ResidentDashboardScreen';
import ResidentAlertsScreen from '../screens/ResidentAlertsScreen';
import ResidentHouseholdScreen from '../screens/ResidentHouseholdScreen';
import ResidentRequestScreen from '../screens/ResidentRequestScreen';
import ResidentRequestHistoryScreen from '../screens/ResidentRequestHistoryScreen';
import ResidentContactScreen from '../screens/ResidentContactScreen';
import ResidentFeedbackScreen from '../screens/ResidentFeedbackScreen';

// PHC Module Screens
import PHCDashboardScreen from '../screens/PHCDashboardScreen';
import PHCReferralsScreen from '../screens/PHCReferralsScreen';
import PHCReferralDetailScreen from '../screens/PHCReferralDetailScreen';
import PHCEmergenciesScreen from '../screens/PHCEmergenciesScreen';
import PHCEmergencyDetailScreen from '../screens/PHCEmergencyDetailScreen';
import PHCAnalyticsScreen from '../screens/PHCAnalyticsScreen';
import PHCDirectoryScreen from '../screens/PHCDirectoryScreen';
import PHCDebugScreen from '../screens/PHCDebugScreen';

// Ops Module - Removed (moved to web admin portal)

// Training Module Screens
import TrainingModulesScreen from '../screens/TrainingModulesScreen';
// import VideoPlayerScreen from '../screens/VideoPlayerScreen';
// import PDFViewerScreen from '../screens/PDFViewerScreen';

// Placeholder screen for features under development
function PlaceholderScreen({ title, subtitle, navigation }) {
  return (
    <SafeAreaView style={placeholderStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={placeholderStyles.header}>
        <TouchableOpacity 
          style={placeholderStyles.backButton}
          onPress={() => navigation.navigate('AshaDashboard')}
        >
          <Text style={placeholderStyles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={placeholderStyles.headerTitle}>{title}</Text>
      </View>
      <View style={placeholderStyles.content}>
        <Text style={placeholderStyles.emoji}>🚧</Text>
        <Text style={placeholderStyles.title}>{title}</Text>
        <Text style={placeholderStyles.subtitle}>{subtitle}</Text>
        <Text style={placeholderStyles.message}>Coming Soon</Text>
        <Text style={placeholderStyles.messageHi}>जल्द आ रहा है</Text>
      </View>
    </SafeAreaView>
  );
}

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 20,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#14b8a6',
    marginBottom: 8,
  },
  messageHi: {
    fontSize: 16,
    color: '#6B7280',
  },
});

// Navigation Stack Manager - Maps routes to their parent dashboards
const ROUTE_HIERARCHY = {
  // Resident Module
  ResidentDashboard: null, // Root for resident module
  ResidentAlerts: 'ResidentDashboard',
  ResidentHousehold: 'ResidentDashboard',
  ResidentRequest: 'ResidentDashboard',
  ResidentRequestHistory: 'ResidentDashboard',
  ResidentContact: 'ResidentDashboard',
  ResidentFeedback: 'ResidentDashboard',
  
  // PHC Module
  PHCDashboard: null, // Root for PHC module
  PHCReferrals: 'PHCDashboard',
  PHCReferralDetail: 'PHCReferrals',
  PHCEmergencies: 'PHCDashboard',
  PHCEmergencyDetail: 'PHCEmergencies',
  PHCAnalytics: 'PHCDashboard',
  PHCDirectory: 'PHCDashboard',
  PHCDebug: 'PHCDashboard',
  
  // ASHA Module
  AshaDashboard: null, // Root for ASHA module
  Home: 'AshaDashboard',
  AshaServiceRequests: 'AshaDashboard',
  AshaServiceRequestDetail: 'AshaServiceRequests',
  AshaReportCase: 'AshaDashboard',
  SensorUpload: 'AshaDashboard',
  GeneratedData: 'SensorUpload',
  Alerts: 'AshaDashboard',
  HouseholdCheck: 'AshaDashboard',
  Consent: 'HouseholdCheck',
  HouseholdSurvey: 'Consent',
  WaterTesting: 'AshaDashboard',
  ManualWaterTest: 'WaterTesting',
  SensorTest: 'WaterTesting',
  WaterTestsHistory: 'WaterTesting',
  WaterTestDetail: 'WaterTestsHistory',
  SymptomHeatmap: 'AshaDashboard',
  SatelliteMap: 'SymptomHeatmap',
  AyurvedicRemedies: 'AshaDashboard',
  EmergencyHelp: 'AshaDashboard',
  WaterLifespan: 'AshaDashboard',
  AshaProfile: 'AshaDashboard',
  EditProfile: 'AshaProfile',
  ViewCertificate: 'AshaProfile',
  OfflineReports: 'AshaDashboard',
  ReportDetail: 'OfflineReports',
  TrainingModules: 'AshaDashboard',
  VideoPlayer: 'TrainingModules',
  PDFViewer: 'TrainingModules',
  
  // Auth screens
  Launch: null,
  Loading: null,
  UnifiedLogin: 'Launch',
};

// Get the root dashboard for a given route
const getRootDashboard = (routeName) => {
  if (routeName.startsWith('Resident')) return 'ResidentDashboard';
  if (routeName.startsWith('PHC')) return 'PHCDashboard';
  return 'AshaDashboard';
};

export default function AppNavigator() {
  const [route, setRoute] = useState('Loading');
  const [routeParams, setRouteParams] = useState({});
  const [navigationStack, setNavigationStack] = useState([{ route: 'Loading', params: {} }]);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  const navigationRef = useRef({
    navigate: (name, params) => {
      console.log('📍 Navigate to:', name, 'with params:', params);
      setRoute(name);
      setRouteParams(params || {});
      setNavigationStack(prev => [...prev, { route: name, params: params || {} }]);
    },
    replace: (name, params) => {
      console.log('🔄 Replace with:', name, 'with params:', params);
      setRoute(name);
      setRouteParams(params || {});
      // Replace current screen in stack
      setNavigationStack(prev => {
        const newStack = [...prev];
        newStack[newStack.length - 1] = { route: name, params: params || {} };
        return newStack;
      });
    },
    goBack: () => {
      console.log('⬅️  Go back from:', route);
      setNavigationStack(prev => {
        console.log('Current stack:', prev.map(s => s.route));
        
        if (prev.length > 1) {
          // Pop current screen and go to previous
          const newStack = prev.slice(0, -1);
          const previousScreen = newStack[newStack.length - 1];
          console.log('Going back to:', previousScreen.route);
          setRoute(previousScreen.route);
          setRouteParams(previousScreen.params);
          return newStack;
        }
        
        // No history - navigate to appropriate dashboard
        const parentRoute = ROUTE_HIERARCHY[route];
        const defaultRoute = parentRoute || getRootDashboard(route);
        
        console.log('No history, going to:', defaultRoute);
        setRoute(defaultRoute);
        setRouteParams({});
        return [{ route: defaultRoute, params: {} }];
      });
    },
  });

  // Check for existing session on app start
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('[Navigation] Checking for existing session...');
        
        // Always show Loading screen first
        setRoute('Loading');
        setNavigationStack([{ route: 'Loading', params: {} }]);
        setIsCheckingSession(false);
        
        // Check session type
        const sessionType = await AsyncStorage.getItem('session_type');
        console.log('[Navigation] Session type:', sessionType);
        
        // Set up auth state listener to check sessions
        const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
          console.log('[Navigation] Firebase User:', firebaseUser?.uid);
          
          if (!firebaseUser) {
            // No Firebase user - definitely not authenticated
            console.log('[Navigation] No Firebase user found');
            global.hasExistingSession = false;
            global.hasResidentSession = false;
            global.hasPHCSession = false;
            global.sessionType = null;
            unsubscribe();
            return;
          }
          
          // Check each session type based on stored session_type
          let hasValidSession = false;
          
          if (sessionType === 'asha') {
            // Check ASHA worker auth
            const AuthService = require('../services/AuthService').default;
            const cachedAshaProfile = await AuthService.getCachedProfile();
            
            if (cachedAshaProfile) {
              // Verify the profile still exists in Firestore
              const roleCheck = await AuthService.verifyASHARole(firebaseUser.uid);
              hasValidSession = roleCheck.success;
              global.hasExistingSession = hasValidSession;
              console.log('[Navigation] ASHA session valid:', hasValidSession);
            } else {
              global.hasExistingSession = false;
            }
          } else if (sessionType === 'resident') {
            // Check Resident auth
            const cachedResidentProfile = await AsyncStorage.getItem('resident_profile');
            hasValidSession = !!cachedResidentProfile;
            global.hasResidentSession = hasValidSession;
            console.log('[Navigation] Resident session valid:', hasValidSession);
          } else if (sessionType === 'phc') {
            // Check PHC auth
            const cachedPHCProfile = await AsyncStorage.getItem('phc_profile');
            hasValidSession = !!cachedPHCProfile;
            global.hasPHCSession = hasValidSession;
            console.log('[Navigation] PHC session valid:', hasValidSession);
          } else {
            // No session type stored - user needs to login
            console.log('[Navigation] No session type stored');
            global.hasExistingSession = false;
            global.hasResidentSession = false;
            global.hasPHCSession = false;
          }
          
          global.sessionType = hasValidSession ? sessionType : null;
          console.log('[Navigation] Final session type:', global.sessionType);
          
          // Unsubscribe after first check
          unsubscribe();
        });
      } catch (error) {
        console.error('[Navigation] Error checking session:', error);
        global.hasExistingSession = false;
        global.hasResidentSession = false;
        global.hasPHCSession = false;
        global.hasOpsSession = false;
        global.sessionType = null;
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    console.log('Current route:', route);
  }, [route]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🔙 Hardware back button pressed on:', route);
      
      // Define root screens where back button should show exit confirmation
      const rootScreens = [
        'Launch',
        'Loading',
        'AshaDashboard',
        'ResidentDashboard',
        'PHCDashboard',
      ];
      
      // If on a root screen, show exit confirmation
      if (rootScreens.includes(route)) {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?\nक्या आप बाहर निकलना चाहते हैं?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true; // Prevent default behavior
      }
      
      // For other screens, use navigation goBack
      if (navigationStack.length > 1) {
        navigationRef.current.goBack();
        return true; // Prevent default behavior
      }
      
      // If no navigation stack, go to appropriate root
      const parentRoute = ROUTE_HIERARCHY[route];
      if (parentRoute) {
        setRoute(parentRoute);
        setRouteParams({});
        setNavigationStack([{ route: parentRoute, params: {} }]);
        return true;
      }
      
      // Default: show exit confirmation
      Alert.alert(
        'Exit App',
        'Are you sure you want to exit?\nक्या आप बाहर निकलना चाहते हैं?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, [route, navigationStack]);

  const navigation = navigationRef.current;

  // Show loading screen while checking session
  if (isCheckingSession) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0369a1', marginBottom: 8 }}>ArogyaJal</Text>
        <Text style={{ fontSize: 14, color: '#64748b' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (route === 'Loading') {
    return <LoadingScreen key="Loading" navigation={navigation} />;
  }

  if (route === 'Launch') {
    return <LaunchScreen key="Launch" navigation={navigation} />;
  }

  if (route === 'UnifiedLogin') {
    return <UnifiedLoginScreen key="UnifiedLogin" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'ResidentAuth') {
    return <ResidentAuthScreen key="ResidentAuth" navigation={navigation} />;
  }

  if (route === 'AshaDashboard') {
    return <AshaDashboardScreen key="AshaDashboard" navigation={navigation} />;
  }

  if (route === 'AshaServiceRequests') {
    return <AshaServiceRequestsScreen key="AshaServiceRequests" navigation={navigation} />;
  }

  if (route === 'AshaServiceRequestDetail') {
    return <AshaServiceRequestDetailScreen key="AshaServiceRequestDetail" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'AshaReportCase') {
    return <AshaReportCaseScreen key="AshaReportCase" navigation={navigation} />;
  }

  if (route === 'SensorUpload') {
    return <SensorUploadScreen key="SensorUpload" navigation={navigation} />;
  }

  if (route === 'GeneratedData') {
    return <GeneratedDataScreen key="GeneratedData" navigation={navigation} route={{ params: {} }} />;
  }

  if (route === 'Alerts') {
    return <AlertsScreen key="Alerts" navigation={navigation} />;
  }

  if (route === 'Home') {
    return <HomeScreen key="Home" navigation={navigation} />;
  }

  // Dashboard feature screens
  if (route === 'HouseholdCheck') {
    return <HouseholdHealthCheckScreen key="HouseholdCheck" navigation={navigation} />;
  }

  if (route === 'Consent') {
    return <ConsentScreen key="Consent" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'HouseholdSurvey') {
    return <HouseholdSurveyScreen key="HouseholdSurvey" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'WaterTesting') {
    return <WaterTestingScreen key="WaterTesting" navigation={navigation} />;
  }

  if (route === 'ManualWaterTest') {
    return <ManualWaterTestScreen key="ManualWaterTest" navigation={navigation} />;
  }

  if (route === 'SensorTest') {
    return <SensorTestScreen key="SensorTest" navigation={navigation} />;
  }

  if (route === 'WaterTestsHistory') {
    return <WaterTestsHistoryScreen key="WaterTestsHistory" navigation={navigation} />;
  }

  if (route === 'SymptomHeatmap') {
    return <CombinedHeatmapScreen key="SymptomHeatmap" navigation={navigation} />;
  }

  if (route === 'SatelliteMap') {
    return <SatelliteMapScreen key="SatelliteMap" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'AyurvedicRemedies') {
    return <AyurvedicRemediesScreen key="AyurvedicRemedies" navigation={navigation} />;
  }

  if (route === 'EmergencyHelp') {
    return <EnhancedEmergencyScreen key="EmergencyHelp" navigation={navigation} />;
  }

  if (route === 'WaterLifespan') {
    return <WaterLifespanScreen key="WaterLifespan" navigation={navigation} />;
  }

  if (route === 'AshaProfile') {
    return <AshaProfileScreen key="AshaProfile" navigation={navigation} />;
  }

  if (route === 'EditProfile') {
    return <EditProfileScreen key="EditProfile" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'ViewCertificate') {
    return <ViewCertificateScreen key="ViewCertificate" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'OfflineReports') {
    return <OfflineReportsScreen key="OfflineReports" navigation={navigation} />;
  }

  if (route === 'ReportDetail') {
    return <ReportDetailScreen key="ReportDetail" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'WaterTestDetail') {
    return <WaterTestDetailScreen key="WaterTestDetail" navigation={navigation} route={{ params: routeParams }} />;
  }

  // Resident Module Routes
  if (route === 'ResidentDashboard') {
    return <ResidentDashboardScreen key="ResidentDashboard" navigation={navigation} />;
  }

  if (route === 'ResidentAlerts') {
    return <ResidentAlertsScreen key="ResidentAlerts" navigation={navigation} />;
  }

  if (route === 'ResidentHousehold') {
    return <ResidentHouseholdScreen key="ResidentHousehold" navigation={navigation} />;
  }

  if (route === 'ResidentRequest') {
    return <ResidentRequestScreen key="ResidentRequest" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'ResidentRequestHistory') {
    return <ResidentRequestHistoryScreen key="ResidentRequestHistory" navigation={navigation} />;
  }

  if (route === 'ResidentContact') {
    return <ResidentContactScreen key="ResidentContact" navigation={navigation} />;
  }

  if (route === 'ResidentFeedback') {
    return <ResidentFeedbackScreen key="ResidentFeedback" navigation={navigation} />;
  }

  // PHC Module Routes
  if (route === 'PHCDashboard') {
    return <PHCDashboardScreen key="PHCDashboard" navigation={navigation} />;
  }

  if (route === 'PHCReferrals') {
    return <PHCReferralsScreen key="PHCReferrals" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'PHCReferralDetail') {
    return <PHCReferralDetailScreen key="PHCReferralDetail" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'PHCEmergencies') {
    return <PHCEmergenciesScreen key="PHCEmergencies" navigation={navigation} />;
  }

  if (route === 'PHCEmergencyDetail') {
    return <PHCEmergencyDetailScreen key="PHCEmergencyDetail" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'PHCAnalytics') {
    return <PHCAnalyticsScreen key="PHCAnalytics" navigation={navigation} route={{ params: routeParams }} />;
  }

  if (route === 'PHCDirectory') {
    return <PHCDirectoryScreen key="PHCDirectory" navigation={navigation} />;
  }

  if (route === 'PHCDebug') {
    return <PHCDebugScreen key="PHCDebug" navigation={navigation} />;
  }

  // Ops Module - Removed (moved to web admin portal)

  if (route === 'HouseholdSurveyDetail') {
    return (
      <PlaceholderScreen 
        key="HouseholdSurveyDetail" 
        title="Survey Details" 
        subtitle="सर्वेक्षण विवरण"
        navigation={navigation} 
      />
    );
  }

  // Training Module Routes
  if (route === 'TrainingModules') {
    return <TrainingModulesScreen key="TrainingModules" navigation={navigation} />;
  }

  if (route === 'VideoPlayer') {
    return (
      <PlaceholderScreen 
        key="VideoPlayer" 
        title="Video Player" 
        subtitle="वीडियो प्लेयर"
        navigation={navigation} 
      />
    );
  }

  if (route === 'PDFViewer') {
    return (
      <PlaceholderScreen 
        key="PDFViewer" 
        title="PDF Viewer" 
        subtitle="पीडीएफ व्यूअर"
        navigation={navigation} 
      />
    );
  }

  return <LaunchScreen key="Launch" navigation={navigation} />;
}


