/**
 * PHC Directory Screen
 * ASHA workers assigned to PHC
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard } from '../components/gov';
import Icon from '../components/Icon';
import { usePHCAuth } from '../context/PHCAuthContext';

export default function PHCDirectoryScreen({ navigation }) {
  const { phcProfile } = usePHCAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ashaWorkers, setAshaWorkers] = useState([]);

  useEffect(() => {
    loadASHAWorkers();
  }, []);

  const loadASHAWorkers = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || !phcProfile) {
        setLoading(false);
        return;
      }

      console.log('[Directory] Loading ASHA workers for PHC:', phcProfile.phcId);

      // Load ASHA workers (no filter for dev mode)
      const snapshot = await firestore()
        .collection('asha_workers')
        .get();

      console.log('[Directory] Found', snapshot.size, 'ASHA workers');

      // Load referrals and surveys to calculate stats
      const [referralsSnap, surveysSnap] = await Promise.all([
        firestore().collection('referrals').get(),
        firestore().collection('household_surveys').get(),
      ]);

      const workers = snapshot.docs.map(doc => {
        const data = doc.data();
        const ashaId = doc.id;

        // Count referrals for this ASHA
        const ashaReferrals = referralsSnap.docs.filter(ref => 
          ref.data().ashaId === ashaId
        );
        const pendingReferrals = ashaReferrals.filter(ref => 
          ref.data().status === 'pending'
        ).length;
        const completedReferrals = ashaReferrals.filter(ref => 
          ['approved', 'resolved', 'completed'].includes(ref.data().status)
        ).length;

        // Count surveys for this ASHA
        const ashaSurveys = surveysSnap.docs.filter(survey => 
          survey.data().ashaId === ashaId
        );
        const pendingSurveys = ashaSurveys.filter(survey => 
          ['pending', 'pending_sync'].includes(survey.data().status)
        ).length;

        return {
          id: ashaId,
          ...data,
          activeCases: ashaReferrals.length + ashaSurveys.length,
          pendingReferrals: pendingReferrals + pendingSurveys,
          completedCases: completedReferrals,
        };
      });

      console.log('[Directory] Processed workers with stats');
      setAshaWorkers(workers);
    } catch (error) {
      console.error('[Directory] Error loading ASHA workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadASHAWorkers();
    setRefreshing(false);
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const renderASHA = ({ item }) => (
    <GovCard style={styles.ashaCard}>
      <View style={styles.ashaHeader}>
        <View style={styles.avatarPlaceholder}>
          <Icon name="person" size={24} color={COLORS.white} />
        </View>
        <View style={styles.ashaInfo}>
          <Text style={styles.ashaName}>{item.name}</Text>
          <Text style={styles.ashaDetails}>
            {item.village} • {item.block}
          </Text>
          <Text style={styles.ashaPhone}>{item.phoneNumber}</Text>
        </View>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => handleCall(item.phoneNumber)}
        >
          <Icon name="call" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.ashaStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.activeCases || 0}</Text>
          <Text style={styles.statLabel}>Active Cases</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.pendingReferrals || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.completedCases || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
    </GovCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="ASHA Directory"
        subtitle={`${ashaWorkers.length} workers`}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading ASHA workers...</Text>
        </View>
      ) : (
        <FlatList
          data={ashaWorkers}
          renderItem={renderASHA}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No ASHA workers found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
  },
  ashaCard: {
    marginBottom: SPACING.sm,
  },
  ashaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  ashaInfo: {
    flex: 1,
  },
  ashaName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  ashaDetails: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginBottom: 2,
  },
  ashaPhone: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ashaStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
});
