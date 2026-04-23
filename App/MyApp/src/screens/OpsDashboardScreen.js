/**
 * Ops Dashboard Screen
 * Control panel for field support operations
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
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';
import { useOpsAuth } from '../context/OpsAuthContext';

export default function OpsDashboardScreen({ navigation }) {
  const { opsProfile, logout } = useOpsAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    openTickets: 0,
    devicesOnline: 0,
    syncFailures: 0,
    dataAnomalies: 0,
    pendingTraining: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load system stats
      // TODO: Implement actual queries
      setStats({
        openTickets: 12,
        devicesOnline: 45,
        syncFailures: 3,
        dataAnomalies: 7,
        pendingTraining: 5,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Exit Ops Control Panel?',
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

  const modules = [
    {
      id: 'devices',
      icon: 'settings',
      label: 'Device Registry',
      sublabel: `${stats.devicesOnline} online`,
      color: '#00ff00',
      screen: 'OpsDevices',
      critical: false,
    },
    {
      id: 'tickets',
      icon: 'warning',
      label: 'Support Tickets',
      sublabel: `${stats.openTickets} open`,
      color: '#ff9800',
      screen: 'OpsTickets',
      critical: stats.openTickets > 0,
    },
    {
      id: 'training',
      icon: 'star',
      label: 'Training Content',
      sublabel: `${stats.pendingTraining} pending`,
      color: '#2196f3',
      screen: 'OpsTraining',
      critical: false,
    },
    {
      id: 'integrity',
      icon: 'chart',
      label: 'Data Integrity',
      sublabel: `${stats.dataAnomalies} issues`,
      color: '#f44336',
      screen: 'OpsDataIntegrity',
      critical: stats.dataAnomalies > 0,
    },
    {
      id: 'tools',
      icon: 'settings',
      label: 'System Tools',
      sublabel: 'Override & Fix',
      color: '#9c27b0',
      screen: 'OpsSystemTools',
      critical: false,
    },
    {
      id: 'sync',
      icon: 'sync',
      label: 'Sync Monitor',
      sublabel: `${stats.syncFailures} failures`,
      color: '#ff5722',
      screen: 'OpsSyncMonitor',
      critical: stats.syncFailures > 0,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>OPS CONTROL</Text>
          <Text style={styles.userName}>{opsProfile?.name || 'Field Support'}</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* System Status */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.statusText}>SYSTEM OPERATIONAL</Text>
          </View>
          <Text style={styles.statusTime}>
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Critical Alerts */}
        {(stats.openTickets > 0 || stats.syncFailures > 0 || stats.dataAnomalies > 0) && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>⚠️ CRITICAL ALERTS</Text>
            {stats.openTickets > 0 && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => navigation.navigate('OpsTickets')}
              >
                <Icon name="warning" size={20} color="#ff9800" />
                <Text style={styles.alertText}>{stats.openTickets} open support tickets</Text>
                <Icon name="next" size={16} color="#666" />
              </TouchableOpacity>
            )}
            {stats.syncFailures > 0 && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => navigation.navigate('OpsSyncMonitor')}
              >
                <Icon name="sync" size={20} color="#ff5722" />
                <Text style={styles.alertText}>{stats.syncFailures} sync failures detected</Text>
                <Icon name="next" size={16} color="#666" />
              </TouchableOpacity>
            )}
            {stats.dataAnomalies > 0 && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => navigation.navigate('OpsDataIntegrity')}
              >
                <Icon name="chart" size={20} color="#f44336" />
                <Text style={styles.alertText}>{stats.dataAnomalies} data anomalies found</Text>
                <Icon name="next" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Control Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>🛠️ CONTROL MODULES</Text>
          <View style={styles.modulesGrid}>
            {modules.map((module) => (
              <TouchableOpacity
                key={module.id}
                style={[
                  styles.moduleCard,
                  module.critical && styles.moduleCardCritical,
                ]}
                onPress={() => navigation.navigate(module.screen)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: `${module.color}20` }]}>
                  <Icon name={module.icon} size={28} color={module.color} />
                </View>
                <Text style={styles.moduleLabel}>{module.label}</Text>
                <Text style={styles.moduleSublabel}>{module.sublabel}</Text>
                {module.critical && (
                  <View style={styles.criticalBadge}>
                    <Text style={styles.criticalText}>!</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 SYSTEM STATS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.devicesOnline}</Text>
              <Text style={styles.statLabel}>Devices Online</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.openTickets}</Text>
              <Text style={styles.statLabel}>Open Tickets</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.syncFailures}</Text>
              <Text style={styles.statLabel}>Sync Failures</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.dataAnomalies}</Text>
              <Text style={styles.statLabel}>Data Issues</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ArogyaJal Ops & Support</Text>
          <Text style={styles.footerSubtext}>All actions are logged</Text>
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
    letterSpacing: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
    letterSpacing: 1,
  },
  statusTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    fontFamily: 'monospace',
  },
  alertsSection: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.warning,
    ...SHADOWS.sm,
  },
  alertText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textDark,
  },
  modulesSection: {
    padding: SPACING.md,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  moduleCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.sm,
  },
  moduleCardCritical: {
    borderColor: COLORS.error,
  },
  moduleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  moduleLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  moduleSublabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  criticalBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
  statsSection: {
    padding: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  footerSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});
