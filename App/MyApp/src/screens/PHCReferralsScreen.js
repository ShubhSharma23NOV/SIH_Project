/**
 * PHC Referrals Screen - REDESIGNED (Core USP Feature)
 * Simplified, Fast Referral Review System
 * Focus: Quick Approve/Reject + Escalate
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
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';
import { usePHCAuth } from '../context/PHCAuthContext';

export default function PHCReferralsScreen({ navigation, route }) {
  const { phcProfile } = usePHCAuth();
  const { filter } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [activeFilter, setActiveFilter] = useState(filter || 'pending');

  // SIMPLIFIED: Only 3 essential filters
  const filters = [
    { id: 'pending', label: 'Pending', icon: 'clock', count: 0 },
    { id: 'approved', label: 'Approved', icon: 'checkCircle', count: 0 },
    { id: 'all', label: 'All', icon: 'apps', count: 0 },
  ];

  useEffect(() => {
    loadReferrals();
  }, [activeFilter, phcProfile]);

  // OPTIMIZED: Fast data loading - Load BOTH referrals AND household surveys
  const loadReferrals = async () => {
    try {
      if (!phcProfile) {
        setLoading(false);
        return;
      }

      // Load from BOTH collections in parallel
      const [referralsSnapshot, householdSurveysSnapshot] = await Promise.all([
        // Load explicit referrals
        firestore()
          .collection('referrals')
          .get(),
        
        // Load household surveys (which should also appear as referrals)
        firestore()
          .collection('household_surveys')
          .get(),
      ]);

      console.log('📋 Fetched referrals count:', referralsSnapshot.size);
      console.log('📋 Fetched household surveys count:', householdSurveysSnapshot.size);

      // Map referrals
      let fetchedReferrals = referralsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        source: 'referrals',
      }));

      // Map household surveys to referral format
      const surveyReferrals = householdSurveysSnapshot.docs.map(doc => {
        const survey = doc.data();
        
        // Extract patient info from members if available
        let patientAge = 'Unknown';
        let patientGender = 'Unknown';
        if (survey.members && survey.members.length > 0) {
          const head = survey.members.find(m => m.relation === 'Self' || m.relation === 'Head');
          if (head) {
            patientAge = head.age || 'Unknown';
            patientGender = head.gender || 'Unknown';
          }
        }

        return {
          id: doc.id,
          type: 'household_survey',
          surveyId: doc.id,
          householdId: survey.householdId,
          patientName: survey.headOfHousehold || 'Unknown',
          patientAge: patientAge,
          patientGender: patientGender,
          village: survey.village || 'Unknown',
          district: survey.district || 'Unknown',
          riskLevel: survey.riskLevel || 'medium',
          symptoms: [
            survey.recommendedAction || 'Household survey',
            `Risk: ${survey.riskLevel || 'medium'}`,
          ],
          priority: survey.riskLevel === 'critical' ? 'high' : 'medium',
          ashaId: survey.ashaId,
          ashaName: survey.ashaName || survey.filedBy || 'ASHA Worker',
          phcId: survey.phcId,
          status: survey.status || 'pending',
          urgent: survey.riskLevel === 'critical',
          createdAt: survey.createdAt?.toDate() || new Date(),
          source: 'household_surveys',
        };
      });

      // Combine both sources
      fetchedReferrals = [...fetchedReferrals, ...surveyReferrals];

      console.log('📋 Total combined referrals:', fetchedReferrals.length);
      if (fetchedReferrals.length > 0) {
        console.log('📋 First referral sample:', JSON.stringify(fetchedReferrals[0], null, 2));
      }

      // Apply filter in memory
      if (activeFilter === 'pending') {
        fetchedReferrals = fetchedReferrals.filter(r => 
          r.status === 'pending' || r.status === 'pending_sync'
        );
      } else if (activeFilter === 'approved') {
        fetchedReferrals = fetchedReferrals.filter(r => 
          ['approved', 'accepted'].includes(r.status)
        );
      }

      // Sort by date (most recent first)
      fetchedReferrals.sort((a, b) => b.createdAt - a.createdAt);

      // Limit to 50 for performance
      setReferrals(fetchedReferrals.slice(0, 50));
    } catch (error) {
      console.error('Error loading referrals:', error);
      Alert.alert('Error', 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReferrals();
    setRefreshing(false);
  };

  // QUICK ACTIONS (USP Feature)
  const handleQuickApprove = async (referralId) => {
    try {
      await firestore()
        .collection('referrals')
        .doc(referralId)
        .update({
          status: 'approved',
          reviewedAt: firestore.FieldValue.serverTimestamp(),
          reviewedBy: phcProfile.uid,
        });
      
      Alert.alert('Success', 'Referral approved');
      loadReferrals();
    } catch (error) {
      console.error('Error approving referral:', error);
      Alert.alert('Error', 'Failed to approve referral');
    }
  };

  const handleQuickReject = async (referralId) => {
    Alert.alert(
      'Reject Referral',
      'Are you sure you want to reject this referral?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('referrals')
                .doc(referralId)
                .update({
                  status: 'rejected',
                  reviewedAt: firestore.FieldValue.serverTimestamp(),
                  reviewedBy: phcProfile.uid,
                });
              
              Alert.alert('Rejected', 'Referral has been rejected');
              loadReferrals();
            } catch (error) {
              console.error('Error rejecting referral:', error);
              Alert.alert('Error', 'Failed to reject referral');
            }
          },
        },
      ]
    );
  };

  // ESCALATE TO DISTRICT (USP Feature)
  const handleEscalate = async (referralId) => {
    Alert.alert(
      'Escalate to District',
      'This case will be escalated to district level for immediate attention.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Escalate',
          onPress: async () => {
            try {
              await firestore()
                .collection('referrals')
                .doc(referralId)
                .update({
                  escalated: true,
                  escalatedAt: firestore.FieldValue.serverTimestamp(),
                  escalatedBy: phcProfile.uid,
                  escalationLevel: 'district',
                });
              
              Alert.alert('Escalated', 'Case escalated to district level');
              loadReferrals();
            } catch (error) {
              console.error('Error escalating:', error);
              Alert.alert('Error', 'Failed to escalate case');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      default: return COLORS.info;
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // SIMPLIFIED REFERRAL CARD
  const renderReferral = ({ item }) => {
    const priorityColor = getPriorityColor(item.priority || 'medium');
    const isPending = item.status === 'pending';
    const isHighRisk = item.riskLevel === 'high' || item.type === 'pregnancy';

    return (
      <View style={[styles.referralCard, isHighRisk && styles.highRiskCard]}>
        {/* Header - One Tap to Details */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => navigation.navigate('PHCReferralDetail', { referralId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{item.patientName}</Text>
              <Text style={styles.patientMeta}>
                {item.patientAge}y • {item.patientGender} • {item.village}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
            {isHighRisk && (
              <View style={styles.highRiskBadge}>
                <Icon name="warning" size={12} color={COLORS.white} />
                <Text style={styles.highRiskText}>HIGH RISK</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Quick Patient Summary */}
        <View style={styles.summaryRow}>
          <Icon name="person" size={14} color={COLORS.textLight} />
          <Text style={styles.summaryText} numberOfLines={1}>
            ASHA: {item.ashaName}
          </Text>
        </View>

        {item.symptoms && (
          <View style={styles.summaryRow}>
            <Icon name="health" size={14} color={COLORS.textLight} />
            <Text style={styles.summaryText} numberOfLines={1}>
              {item.symptoms.slice(0, 2).join(', ')}
              {item.symptoms.length > 2 && ` +${item.symptoms.length - 2}`}
            </Text>
          </View>
        )}

        {/* QUICK ACTION BUTTONS (USP) */}
        {isPending && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleQuickApprove(item.id)}
              activeOpacity={0.7}
            >
              <Icon name="checkCircle" size={16} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleQuickReject(item.id)}
              activeOpacity={0.7}
            >
              <Icon name="close" size={16} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.escalateBtn]}
              onPress={() => handleEscalate(item.id)}
              activeOpacity={0.7}
            >
              <Icon name="arrow-up-bold" size={16} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Escalate</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Badge for Non-Pending */}
        {!isPending && (
          <View style={styles.statusRow}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'approved' ? COLORS.success : COLORS.error }
            ]}>
              <Text style={styles.statusText}>
                {item.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
              </Text>
            </View>
            {item.escalated && (
              <View style={styles.escalatedBadge}>
                <Icon name="arrow-up-bold" size={12} color={COLORS.warning} />
                <Text style={styles.escalatedText}>Escalated</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* SIMPLIFIED HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Referrals</Text>
          <Text style={styles.headerSubtitle}>{referrals.length} cases</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Icon name="refresh" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* SIMPLE FILTERS */}
      <View style={styles.filtersBar}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              activeFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter.id)}
            activeOpacity={0.7}
          >
            <Icon 
              name={filter.icon} 
              size={16} 
              color={activeFilter === filter.id ? COLORS.white : COLORS.textMedium} 
            />
            <Text style={[
              styles.filterLabel,
              activeFilter === filter.id && styles.filterLabelActive,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={referrals}
          renderItem={renderReferral}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="checkCircle" size={64} color={COLORS.success} />
              <Text style={styles.emptyText}>All Clear!</Text>
              <Text style={styles.emptySubtext}>
                {activeFilter === 'pending'
                  ? 'No pending referrals at the moment'
                  : `No ${activeFilter} referrals found`}
              </Text>
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
  
  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.white}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: `${COLORS.white}80`,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.white}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FILTERS
  filtersBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    gap: SPACING.xs,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textMedium,
  },
  filterLabelActive: {
    color: COLORS.white,
  },

  // LIST
  listContent: {
    padding: SPACING.md,
  },

  // REFERRAL CARD
  referralCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  highRiskCard: {
    borderColor: COLORS.warning,
    borderWidth: 2,
    backgroundColor: `${COLORS.warning}05`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  patientMeta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  highRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  highRiskText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },

  // SUMMARY
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  summaryText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },

  // QUICK ACTIONS (USP)
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.base,
    gap: SPACING.xs,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
  },
  rejectBtn: {
    backgroundColor: COLORS.error,
  },
  escalateBtn: {
    backgroundColor: COLORS.warning,
  },
  actionBtnText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },

  // STATUS
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  escalatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  escalatedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.warning,
  },

  // LOADING & EMPTY
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
