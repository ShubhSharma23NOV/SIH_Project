/**
 * ASHA Service Request Detail Screen
 * View full details of a service request and take actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';

export default function AshaServiceRequestDetailScreen({ navigation, route }) {
  const { request } = route.params;
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(request.status);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'assigned': return COLORS.info;
      case 'in_progress': return COLORS.secondary;
      case 'completed': return COLORS.success;
      default: return COLORS.textMedium;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'asha_visit': return 'person';
      case 'water_test': return 'waterTest';
      case 'complaint': return 'warning';
      case 'referral': return 'health';
      default: return 'bell';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'asha_visit': return 'ASHA Visit';
      case 'water_test': return 'Water Testing';
      case 'complaint': return 'Health Complaint';
      case 'referral': return 'Referral Status';
      default: return type;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.info;
      default: return COLORS.textMedium;
    }
  };

  const getPreferredTimeLabel = (time) => {
    switch (time) {
      case 'morning': return 'Morning (8 AM - 12 PM)';
      case 'afternoon': return 'Afternoon (12 PM - 4 PM)';
      case 'evening': return 'Evening (4 PM - 8 PM)';
      case 'anytime': return 'Anytime';
      default: return time || 'Not specified';
    }
  };

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      await firestore()
        .collection('service_requests')
        .doc(request.id)
        .update({
          status: newStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          ...(newStatus === 'completed' && { completedAt: firestore.FieldValue.serverTimestamp() }),
        });

      setCurrentStatus(newStatus);
      Alert.alert('Success', `Request marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (request.residentPhone && request.residentPhone !== 'N/A') {
      Linking.openURL(`tel:${request.residentPhone}`);
    } else {
      Alert.alert('No Phone Number', 'Resident phone number not available');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Request Details</Text>
          <Text style={styles.headerSubtitle}>ID: {request.id.slice(0, 8)}...</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
          <Text style={styles.statusText}>{currentStatus}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Acknowledgment Status */}
        {!request.acknowledged && (
          <View style={[styles.card, styles.acknowledgeCard]}>
            <View style={styles.acknowledgeHeader}>
              <Icon name="warning" size={24} color={COLORS.warning} />
              <Text style={styles.acknowledgeTitle}>Action Required</Text>
            </View>
            <Text style={styles.acknowledgeMessage}>
              Please acknowledge this request to confirm you have received it.
            </Text>
            <TouchableOpacity
              style={styles.acknowledgeButtonLarge}
              onPress={async () => {
                try {
                  await firestore()
                    .collection('service_requests')
                    .doc(request.id)
                    .update({
                      acknowledged: true,
                      acknowledgedAt: firestore.FieldValue.serverTimestamp(),
                      acknowledgedBy: auth().currentUser?.uid,
                    });
                  Alert.alert('Success', 'Request acknowledged successfully');
                  navigation.goBack();
                } catch (error) {
                  Alert.alert('Error', 'Failed to acknowledge request');
                }
              }}
            >
              <Icon name="checkCircle" size={20} color={COLORS.white} />
              <Text style={styles.acknowledgeButtonTextLarge}>Acknowledge Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {request.acknowledged && (
          <View style={[styles.card, styles.acknowledgedCard]}>
            <View style={styles.acknowledgedHeader}>
              <Icon name="checkCircle" size={24} color={COLORS.success} />
              <Text style={styles.acknowledgedTitle}>Acknowledged</Text>
            </View>
            <Text style={styles.acknowledgedMessage}>
              You acknowledged this request on{' '}
              {request.acknowledgedAt?.toDate?.()?.toLocaleDateString() || 'Recently'} at{' '}
              {request.acknowledgedAt?.toDate?.()?.toLocaleTimeString() || ''}
            </Text>
          </View>
        )}

        {/* Request Type Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.typeIconLarge, { backgroundColor: `${getStatusColor(currentStatus)}15` }]}>
              <Icon name={getTypeIcon(request.type)} size={32} color={getStatusColor(currentStatus)} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{getTypeLabel(request.type)}</Text>
              <Text style={styles.cardSubtitle}>
                {request.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'} at{' '}
                {request.createdAt?.toDate?.()?.toLocaleTimeString() || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Priority Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Icon name="warning" size={20} color={COLORS.textMedium} />
            <Text style={styles.infoLabel}>Priority Level</Text>
          </View>
          <View style={[styles.priorityBadgeLarge, { backgroundColor: getPriorityColor(request.priority) }]}>
            <Text style={styles.priorityTextLarge}>{request.priority?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Icon name="document" size={20} color={COLORS.textMedium} />
            <Text style={styles.infoLabel}>Description</Text>
          </View>
          <Text style={styles.description}>{request.description}</Text>
        </View>

        {/* Resident Information Card */}
        <View style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <Icon name="account" size={20} color={COLORS.primary} />
            <Text style={styles.cardSectionTitle}>Resident Information</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="account" size={18} color={COLORS.textMedium} />
            <View style={styles.infoContent}>
              <Text style={styles.infoItemLabel}>Name</Text>
              <Text style={styles.infoItemValue}>{request.residentName}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="phone" size={18} color={COLORS.textMedium} />
            <View style={styles.infoContent}>
              <Text style={styles.infoItemLabel}>Phone</Text>
              <Text style={styles.infoItemValue}>{request.residentPhone}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Icon name="location" size={18} color={COLORS.textMedium} />
            <View style={styles.infoContent}>
              <Text style={styles.infoItemLabel}>Village</Text>
              <Text style={styles.infoItemValue}>{request.village}</Text>
            </View>
          </View>

          {request.householdId && (
            <View style={styles.infoItem}>
              <Icon name="home" size={18} color={COLORS.textMedium} />
              <View style={styles.infoContent}>
                <Text style={styles.infoItemLabel}>Household ID</Text>
                <Text style={styles.infoItemValue}>{request.householdId}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Visit Preferences Card */}
        {request.preferredTime && (
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Icon name="clock-outline" size={20} color={COLORS.textMedium} />
              <Text style={styles.infoLabel}>Preferred Visit Time</Text>
            </View>
            <Text style={styles.preferredTime}>{getPreferredTimeLabel(request.preferredTime)}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Call Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
          >
            <Icon name="phone" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Call Resident</Text>
          </TouchableOpacity>

          {/* Status Update Buttons */}
          {currentStatus === 'assigned' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => updateStatus('in_progress')}
              disabled={loading}
            >
              <Icon name="play" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Start Work</Text>
            </TouchableOpacity>
          )}

          {currentStatus === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => updateStatus('completed')}
              disabled={loading}
            >
              <Icon name="checkCircle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Timeline */}
        {request.statusHistory && request.statusHistory.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardSectionHeader}>
              <Icon name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.cardSectionTitle}>Timeline</Text>
            </View>
            {request.statusHistory.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>{item.status}</Text>
                  <Text style={styles.timelineNote}>{item.note}</Text>
                  <Text style={styles.timelineDate}>
                    {item.timestamp?.toDate?.()?.toLocaleString() || 'Recently'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: SPACING.xs,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  cardSectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  priorityBadgeLarge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignSelf: 'flex-start',
  },
  priorityTextLarge: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    lineHeight: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  preferredTime: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  actionsContainer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  callButton: {
    backgroundColor: COLORS.primary,
  },
  startButton: {
    backgroundColor: COLORS.secondary,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textTransform: 'capitalize',
  },
  timelineNote: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: 2,
  },
  timelineDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  acknowledgeCard: {
    backgroundColor: `${COLORS.warning}10`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  acknowledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  acknowledgeTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.warning,
  },
  acknowledgeMessage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  acknowledgeButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  acknowledgeButtonTextLarge: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  acknowledgedCard: {
    backgroundColor: `${COLORS.success}10`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  acknowledgedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  acknowledgedTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
  acknowledgedMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
});
