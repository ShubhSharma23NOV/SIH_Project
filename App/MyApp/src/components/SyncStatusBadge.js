import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import Icon from './Icon';
import SyncService from '../services/SyncService';

export default function SyncStatusBadge({ onPress }) {
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    isSyncing: false,
    lastSync: null,
  });

  useEffect(() => {
    // Wait a bit for database to initialize before first status check
    const initialTimeout = setTimeout(() => {
      updateSyncStatus();
    }, 1000);

    const interval = setInterval(updateSyncStatus, 10000); // Update every 10s
    const unsubscribe = SyncService.addListener((data) => {
      updateSyncStatus();
    });

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const updateSyncStatus = async () => {
    try {
      const status = await SyncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to get sync status:', error);
      // Set default status if database not ready
      setSyncStatus({
        pending: 0,
        isSyncing: false,
        lastSync: null,
      });
    }
  };

  const handlePress = async () => {
    if (onPress) {
      onPress();
    } else {
      await SyncService.forceSyncNow();
    }
  };

  if (syncStatus.pending === 0 && !syncStatus.isSyncing) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        syncStatus.isSyncing && styles.badgeSyncing,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {syncStatus.isSyncing ? (
        <>
          <ActivityIndicator size="small" color={COLORS.white} />
          <Text style={styles.badgeText}>Syncing...</Text>
        </>
      ) : (
        <>
          <Icon name="upload" size={16} color={COLORS.white} />
          <Text style={styles.badgeText}>
            {syncStatus.pending} pending sync
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  badgeSyncing: {
    backgroundColor: COLORS.info,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
});
