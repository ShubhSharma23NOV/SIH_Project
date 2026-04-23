/**
 * Water Tests History Screen
 * Display all water tests with offline/synced status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { GovHeader, GovCard } from '../components/gov';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme';
import { getAllWaterTests } from '../database/operations';

export default function WaterTestsHistoryScreen({ navigation }) {
  const [tests, setTests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTests = async () => {
    try {
      const allTests = await getAllWaterTests();
      setTests(allTests);
    } catch (error) {
      console.error('Error fetching water tests:', error);
      setTests([]);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTests();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRiskColor = (riskLevel) => {
    if (riskLevel === 'High') return '#ef4444';
    if (riskLevel === 'Medium') return '#f59e0b';
    return '#22c55e';
  };

  const getRiskIcon = (riskLevel) => {
    if (riskLevel === 'High') return '🔴';
    if (riskLevel === 'Medium') return '🟡';
    return '🟢';
  };

  const getSourceIcon = (sourceType) => {
    const icons = {
      well: '🪣',
      spring: '💧',
      handpump: '⛲',
      tap: '🚰',
      pond: '🏞️',
      stream: '🌊',
      river: '🏞️',
    };
    return icons[sourceType] || '💧';
  };

  const getSourceLabel = (sourceType) => {
    const labels = {
      well: 'Well',
      spring: 'Spring',
      handpump: 'Hand Pump',
      tap: 'Tap',
      pond: 'Pond',
      stream: 'Stream',
      river: 'River',
    };
    return labels[sourceType] || 'Unknown';
  };

  const renderTestCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('WaterTestDetail', { testId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceIcon}>{getSourceIcon(item.sourceType)}</Text>
          <View>
            <Text style={styles.sourceType}>{getSourceLabel(item.sourceType)}</Text>
            {item.sourceName && <Text style={styles.sourceName}>{item.sourceName}</Text>}
          </View>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.riskLevel) + '20' }]}>
          <Text style={styles.riskIcon}>{getRiskIcon(item.riskLevel)}</Text>
          <Text style={[styles.riskText, { color: getRiskColor(item.riskLevel) }]}>
            {item.riskLevel || 'Low'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.paramRow}>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>pH</Text>
            <Text style={styles.paramValue}>{item.pH || 'N/A'}</Text>
          </View>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>FRC</Text>
            <Text style={styles.paramValue}>
              {item.frc === 'present' ? '✓' : item.frc === 'not_present' ? '✗' : '?'}
            </Text>
          </View>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>Turbidity</Text>
            <Text style={styles.paramValue}>
              {item.turbidity === 'low' ? '💧' : item.turbidity === 'medium' ? '🌫️' : '🟤'}
            </Text>
          </View>
          <View style={styles.paramItem}>
            <Text style={styles.paramLabel}>Appearance</Text>
            <Text style={styles.paramValue}>
              {item.appearance === 'clear' ? '💧' : 
               item.appearance === 'slight_yellow' ? '🟡' :
               item.appearance === 'brownish' ? '🟤' :
               item.appearance === 'muddy' ? '🟫' : '🟢'}
            </Text>
          </View>
        </View>

        {item.nearbyRiskActivity && item.nearbyRiskActivity.length > 0 && (
          <View style={styles.risksRow}>
            <Text style={styles.infoLabel}>Nearby Risks:</Text>
            <View style={styles.risksList}>
              {item.nearbyRiskActivity.slice(0, 3).map((risk, index) => (
                <View key={index} style={styles.riskTag}>
                  <Text style={styles.riskTagText}>{risk}</Text>
                </View>
              ))}
              {item.nearbyRiskActivity.length > 3 && (
                <Text style={styles.moreRisks}>+{item.nearbyRiskActivity.length - 3}</Text>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, item.status === 'synced' && styles.statusBadgeSynced]}>
          <Text style={styles.statusIcon}>{item.status === 'synced' ? '☁️' : '📱'}</Text>
          <Text style={styles.statusText}>
            {item.status === 'pending_sync' ? 'Pending Sync' : item.status === 'synced' ? 'Synced' : item.status}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💧</Text>
      <Text style={styles.emptyTitle}>No Water Tests Yet</Text>
      <Text style={styles.emptyText}>Start testing water sources to see them here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Water Tests History"
        subtitle={`${tests.length} tests • ${tests.length} परीक्षण`}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={tests}
        renderItem={renderTestCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, tests.length === 0 && styles.listEmpty]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceIcon: {
    fontSize: 32,
    marginRight: SPACING.base,
  },
  sourceType: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  sourceName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.round,
  },
  riskIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  riskText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  cardBody: {
    marginBottom: SPACING.base,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  paramItem: {
    flex: 1,
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  paramValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  risksRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    marginBottom: 4,
  },
  risksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  riskTag: {
    backgroundColor: `${COLORS.warning}20`,
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.xs,
  },
  riskTagText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  moreRisks: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}20`,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  statusBadgeSynced: {
    backgroundColor: `${COLORS.success}20`,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
