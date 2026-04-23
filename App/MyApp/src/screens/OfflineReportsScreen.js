import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import { GovHeader } from '../components/gov';
import Icon from '../components/Icon';
import NetworkService from '../services/NetworkService';
import SyncService from '../services/SyncService';

export default function OfflineReportsScreen({ navigation }) {
  const [photoReports, setPhotoReports] = useState([]);
  const [symptomReports, setSymptomReports] = useState([]);
  const [waterTests, setWaterTests] = useState([]);
  const [householdSurveys, setHouseholdSurveys] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllReports();
    checkNetworkStatus();

    const unsubscribe = NetworkService.addListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const checkNetworkStatus = async () => {
    const online = await NetworkService.isOnline();
    setIsOnline(online);
  };

  const loadAllReports = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Load water tests from database
      const { getAllWaterTests } = require('../database/operations');
      const tests = await getAllWaterTests();
      setWaterTests(tests || []);
      
      // Load household surveys from AsyncStorage
      const surveysData = await AsyncStorage.getItem('pending_household_surveys');
      const surveys = JSON.parse(surveysData || '[]');
      setHouseholdSurveys(surveys);
      
      // Other report types will be loaded when implemented
      setPhotoReports([]);
      setSymptomReports([]);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllReports();
  };

  const getTotalReports = () => {
    return photoReports.length + symptomReports.length + waterTests.length + householdSurveys.length;
  };

  const getPendingCount = () => {
    return (
      photoReports.filter(r => r.synced !== 1).length +
      symptomReports.filter(r => r.synced !== 1).length +
      waterTests.filter(r => r.synced !== 1).length +
      householdSurveys.filter(r => r.synced !== 1).length
    );
  };

  const handleSyncAll = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Please connect to internet to sync data.');
      return;
    }

    const pending = getPendingCount();
    if (pending === 0) {
      Alert.alert('No Pending Data', 'All reports are already synced.');
      return;
    }

    Alert.alert(
      'Sync All Data',
      `Sync ${pending} pending items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync Now',
          onPress: async () => {
            setSyncing(true);
            try {
              await SyncService.forceSyncNow();
              await loadAllReports();
              Alert.alert('Success', 'All data synced successfully!');
            } catch (error) {
              Alert.alert('Sync Failed', 'Some items could not be synced.');
            } finally {
              setSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllSynced = async () => {
    const syncedWaterTests = waterTests.filter(t => t.synced === 1);
    const syncedSurveys = householdSurveys.filter(s => s.synced === 1);
    const totalSynced = syncedWaterTests.length + syncedSurveys.length;

    if (totalSynced === 0) {
      Alert.alert('No Synced Reports', 'There are no synced reports to delete.');
      return;
    }

    Alert.alert(
      'Delete All Synced Reports',
      `Delete ${totalSynced} synced reports from local storage?\n\n(Server copies will remain safe)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete synced water tests
              const { deleteWaterTest } = require('../database/operations');
              for (const test of syncedWaterTests) {
                await deleteWaterTest(test.id);
              }

              // Delete synced surveys
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const surveysData = await AsyncStorage.getItem('pending_household_surveys');
              const surveys = JSON.parse(surveysData || '[]');
              const unsyncedSurveys = surveys.filter(s => s.synced !== 1);
              await AsyncStorage.setItem('pending_household_surveys', JSON.stringify(unsyncedSurveys));

              await loadAllReports();
              Alert.alert('Success', `Deleted ${totalSynced} synced reports from local storage`);
            } catch (error) {
              console.error('Delete all error:', error);
              Alert.alert('Error', 'Failed to delete some reports');
            }
          },
        },
      ]
    );
  };

  const handleDeleteReport = (type, id) => {
    // Find the report to check if it's synced
    let report;
    let isSynced = false;
    
    if (type === 'water') {
      report = waterTests.find(t => t.id === id);
      isSynced = report?.synced === 1;
    } else if (type === 'survey') {
      report = householdSurveys.find(s => s.id === id);
      isSynced = report?.synced === 1;
    }

    const message = isSynced 
      ? 'This report has been synced. Delete from local storage only? (Server copy will remain)'
      : 'This report has NOT been synced yet. Deleting will permanently remove it.';

    Alert.alert(
      'Delete Report',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'water') {
                const { deleteWaterTest } = require('../database/operations');
                await deleteWaterTest(id);
                await loadAllReports();
                Alert.alert('Deleted', 'Report deleted from local storage');
              } else if (type === 'survey') {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                const surveysData = await AsyncStorage.getItem('pending_household_surveys');
                const surveys = JSON.parse(surveysData || '[]');
                const updated = surveys.filter(s => s.id !== id);
                await AsyncStorage.setItem('pending_household_surveys', JSON.stringify(updated));
                await loadAllReports();
                Alert.alert('Deleted', 'Survey deleted from local storage');
              } else {
                Alert.alert('Info', 'Delete functionality for this report type is not yet implemented');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN');
  };

  const filterReports = (reports) => {
    if (filter === 'pending') return reports.filter(r => r.synced !== 1);
    if (filter === 'synced') return reports.filter(r => r.synced === 1);
    return reports;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <GovHeader
          title="Offline Reports"
          subtitle="ऑफ़लाइन रिपोर्ट"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GovHeader
        title="Offline Reports"
        subtitle="ऑफ़लाइन रिपोर्ट"
        showBack
        onBackPress={() => navigation.goBack()}
      >
        <TouchableOpacity 
          onPress={handleSyncAll} 
          disabled={syncing || !isOnline}
          style={[
            styles.syncButton,
            (!isOnline || syncing) && styles.syncButtonDisabled
          ]}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Icon name="sync" size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </GovHeader>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Icon name="database" size={20} color={COLORS.primary} />
          <Text style={styles.statusText}>{getPendingCount()} Pending</Text>
        </View>
        <View style={styles.statusItem}>
          <Icon name={isOnline ? 'wifi' : 'wifiOff'} size={20} color={isOnline ? COLORS.success : COLORS.danger} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteAllButton}
          onPress={handleDeleteAllSynced}
        >
          <Icon name="delete" size={18} color={COLORS.danger} />
          <Text style={styles.deleteAllText}>Clear Synced</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({getTotalReports()})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending ({getPendingCount()})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'synced' && styles.filterTabActive]}
          onPress={() => setFilter('synced')}
        >
          <Text style={[styles.filterText, filter === 'synced' && styles.filterTextActive]}>
            Synced
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {getTotalReports() === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptySubtitle}>कोई रिपोर्ट नहीं मिली</Text>
            <Text style={styles.emptyDescription}>
              Reports will appear here when saved offline
            </Text>
          </View>
        ) : (
          <>
            {/* Water Tests */}
            {filterReports(waterTests).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💧 Water Tests</Text>
                {filterReports(waterTests).map((test, index) => (
                  <TouchableOpacity
                    key={test.id}
                    style={styles.reportCard}
                    onPress={() => navigation.navigate('WaterTestDetail', { testId: test.id })}
                  >
                    <View style={styles.reportHeader}>
                      <View style={styles.reportTypeContainer}>
                        <Icon name="waterDrop" size={20} color={COLORS.primary} />
                        <Text style={styles.reportType}>Water Test</Text>
                      </View>
                      <View style={[styles.statusBadge, test.synced === 1 ? styles.statusSynced : styles.statusPending]}>
                        <Icon name={test.synced === 1 ? 'checkCircle' : 'clock'} size={14} color={COLORS.white} />
                        <Text style={styles.statusText}>{test.synced === 1 ? 'Synced' : 'Pending'}</Text>
                      </View>
                    </View>
                    <View style={styles.reportBody}>
                      <Text style={styles.reportDetail}>Source: {test.sourceType}</Text>
                      <Text style={styles.reportDetail}>pH: {test.pH || 'N/A'}</Text>
                      <Text style={styles.reportDetail}>Risk: {test.riskLevel || 'Low'}</Text>
                      <Text style={styles.reportTimestamp}>{formatDate(test.createdAt)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteReport('water', test.id)}
                    >
                      <Icon name="delete" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Household Surveys */}
            {filterReports(householdSurveys).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏠 Household Surveys</Text>
                {filterReports(householdSurveys).map((survey, index) => (
                  <TouchableOpacity
                    key={survey.id}
                    style={styles.reportCard}
                    onPress={() => navigation.navigate('ReportDetail', { reportId: survey.id, reportType: 'survey' })}
                  >
                    <View style={styles.reportHeader}>
                      <View style={styles.reportTypeContainer}>
                        <Icon name="household" size={20} color={COLORS.primary} />
                        <Text style={styles.reportType}>Household Survey</Text>
                      </View>
                      <View style={[styles.statusBadge, survey.synced === 1 ? styles.statusSynced : styles.statusPending]}>
                        <Icon name={survey.synced === 1 ? 'checkCircle' : 'clock'} size={14} color={COLORS.white} />
                        <Text style={styles.statusText}>{survey.synced === 1 ? 'Synced' : 'Pending'}</Text>
                      </View>
                    </View>
                    <View style={styles.reportBody}>
                      <Text style={styles.reportDetail}>Household: {survey.headOfHousehold}</Text>
                      <Text style={styles.reportDetail}>Village: {survey.village}</Text>
                      <Text style={styles.reportDetail}>Members: {survey.totalMembers}</Text>
                      <Text style={styles.reportTimestamp}>{formatDate(survey.createdAt)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteReport('survey', survey.id)}
                    >
                      <Icon name="delete" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textDark,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textDark,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  reportType: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
  },
  statusSynced: {
    backgroundColor: COLORS.success,
  },
  reportBody: {
    gap: SPACING.xs,
  },
  reportDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  reportTimestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  deleteButton: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  syncButton: {
    padding: SPACING.xs,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: `${COLORS.danger}15`,
    borderRadius: RADIUS.sm,
  },
  deleteAllText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
