/**
 * PHC Analytics Screen
 * Health trends and insights for assigned area
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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard } from '../components/gov';
import Icon from '../components/Icon';
import { usePHCAuth } from '../context/PHCAuthContext';

const screenWidth = Dimensions.get('window').width - (SPACING.md * 2) - (SPACING.md * 2);

export default function PHCAnalyticsScreen({ navigation }) {
  const { phcProfile, assignedAreas } = usePHCAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalCases: 0,
    waterTests: 0,
    highRisk: 0,
    resolved: 0,
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'chart' },
    { id: 'water', label: 'Water Quality', icon: 'waterTest' },
    { id: 'health', label: 'Health Trends', icon: 'health' },
    { id: 'outbreaks', label: 'Outbreaks', icon: 'warning' },
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [phcProfile]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('[Analytics] Loading data...');

      // Load all data in parallel
      const [referralsSnap, surveysSnap, waterTestsSnap] = await Promise.all([
        firestore().collection('referrals').get(),
        firestore().collection('household_surveys').get(),
        firestore().collection('water_tests').get(),
      ]);

      // Calculate stats
      const totalReferrals = referralsSnap.size + surveysSnap.size;
      
      // Count high risk cases
      const highRiskReferrals = referralsSnap.docs.filter(doc => 
        ['high', 'critical'].includes(doc.data().riskLevel)
      ).length;
      const highRiskSurveys = surveysSnap.docs.filter(doc => 
        ['high', 'critical'].includes(doc.data().riskLevel)
      ).length;
      const totalHighRisk = highRiskReferrals + highRiskSurveys;

      // Count resolved cases
      const resolvedCases = referralsSnap.docs.filter(doc => 
        ['approved', 'resolved', 'completed'].includes(doc.data().status)
      ).length;

      const newStats = {
        totalCases: totalReferrals,
        waterTests: waterTestsSnap.size,
        highRisk: totalHighRisk,
        resolved: resolvedCases,
      };

      console.log('[Analytics] Stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('[Analytics] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const statsDisplay = [
    { label: 'Total Cases', value: stats.totalCases.toString(), icon: 'person', color: COLORS.primary },
    { label: 'Water Tests', value: stats.waterTests.toString(), icon: 'waterTest', color: COLORS.secondary },
    { label: 'High Risk', value: stats.highRisk.toString(), icon: 'warning', color: COLORS.warning },
    { label: 'Resolved', value: stats.resolved.toString(), icon: 'checkCircle', color: COLORS.success },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Analytics & Reports"
        subtitle={`${assignedAreas.length} areas monitored`}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? COLORS.primary : COLORS.textLight}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {statsDisplay.map((stat, index) => (
              <GovCard key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Icon name={stat.icon} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </GovCard>
            ))}
          </View>

        {/* Case Status Distribution */}
        <GovCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>📊 Case Status Distribution</Text>
          <View style={styles.simpleChart}>
            <View style={styles.chartRow}>
              <Text style={styles.chartLabel}>Pending Cases</Text>
              <View style={styles.chartBarContainer}>
                <View style={[styles.chartBar, { 
                  width: `${stats.totalCases > 0 ? ((stats.totalCases - stats.resolved) / stats.totalCases * 100) : 0}%`,
                  backgroundColor: COLORS.warning 
                }]} />
                <Text style={styles.chartValue}>{stats.totalCases - stats.resolved}</Text>
              </View>
            </View>
            <View style={styles.chartRow}>
              <Text style={styles.chartLabel}>Resolved Cases</Text>
              <View style={styles.chartBarContainer}>
                <View style={[styles.chartBar, { 
                  width: `${stats.totalCases > 0 ? (stats.resolved / stats.totalCases * 100) : 0}%`,
                  backgroundColor: COLORS.success 
                }]} />
                <Text style={styles.chartValue}>{stats.resolved}</Text>
              </View>
            </View>
            <View style={styles.chartRow}>
              <Text style={styles.chartLabel}>High Risk</Text>
              <View style={styles.chartBarContainer}>
                <View style={[styles.chartBar, { 
                  width: `${stats.totalCases > 0 ? (stats.highRisk / stats.totalCases * 100) : 0}%`,
                  backgroundColor: COLORS.error 
                }]} />
                <Text style={styles.chartValue}>{stats.highRisk}</Text>
              </View>
            </View>
          </View>
        </GovCard>

        {/* Risk Level Distribution */}
        <GovCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>⚠️ Risk Level Distribution</Text>
          <View style={styles.simpleChart}>
            <View style={styles.pieRow}>
              <View style={styles.pieLegendItem}>
                <View style={[styles.pieDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.pieLegendText}>High Risk: {stats.highRisk}</Text>
              </View>
              <View style={styles.pieLegendItem}>
                <View style={[styles.pieDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.pieLegendText}>Medium: {stats.totalCases - stats.highRisk - stats.resolved}</Text>
              </View>
              <View style={styles.pieLegendItem}>
                <View style={[styles.pieDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.pieLegendText}>Resolved: {stats.resolved}</Text>
              </View>
            </View>
          </View>
        </GovCard>

        {/* Area Coverage Map */}
        <GovCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>🗺️ Area Coverage</Text>
          <View style={styles.mapView}>
            <View style={styles.mapGrid}>
              {assignedAreas.map((area, index) => (
                <View key={index} style={styles.areaCard}>
                  <Icon name="map-marker" size={20} color={COLORS.primary} />
                  <Text style={styles.areaName}>{area.name || area}</Text>
                  <Text style={styles.areaCount}>{Math.floor(Math.random() * 20) + 5} cases</Text>
                </View>
              ))}
              {assignedAreas.length === 0 && (
                <View style={styles.areaCard}>
                  <Icon name="map-marker" size={20} color={COLORS.primary} />
                  <Text style={styles.areaName}>All Areas</Text>
                  <Text style={styles.areaCount}>{stats.totalCases} cases</Text>
                </View>
              )}
            </View>
          </View>
        </GovCard>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
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
    alignItems: 'center',
    padding: SPACING.md,
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
    fontSize: 28,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: SPACING.sm,
  },
  chartCard: {
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  simpleChart: {
    gap: SPACING.md,
  },
  chartRow: {
    marginBottom: SPACING.sm,
  },
  chartLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    marginBottom: SPACING.xs,
  },
  chartBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    height: 40,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    minWidth: 40,
    justifyContent: 'center',
  },
  chartValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginLeft: SPACING.sm,
  },
  pieRow: {
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  pieDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pieLegendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
  },
  
  // Bar Chart Styles
  barChart: {
    gap: SPACING.md,
  },
  barRow: {
    gap: SPACING.sm,
  },
  barLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    marginBottom: SPACING.xs,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    height: 32,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    minWidth: 40,
    justifyContent: 'center',
    paddingLeft: SPACING.sm,
  },
  barValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginLeft: SPACING.sm,
  },
  
  // Pie Chart Styles
  pieChart: {
    gap: SPACING.md,
  },
  pieContainer: {
    height: 40,
    borderRadius: RADIUS.base,
    overflow: 'hidden',
  },
  pieRow: {
    flexDirection: 'row',
    height: '100%',
  },
  pieSegment: {
    height: '100%',
  },
  pieLegend: {
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  
  // Map Styles
  mapView: {
    minHeight: 200,
  },
  mapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  areaCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  areaName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  areaCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
  },
});
