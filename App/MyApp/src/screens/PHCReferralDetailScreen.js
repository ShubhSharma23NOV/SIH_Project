/**
 * PHC Referral Detail Screen
 * Review and take action on referrals
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
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton, GovStatusBadge } from '../components/gov';
import Icon from '../components/Icon';
import { usePHCAuth } from '../context/PHCAuthContext';

export default function PHCReferralDetailScreen({ navigation, route }) {
  const { referralId } = route.params;
  const { phcProfile } = usePHCAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [referral, setReferral] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadReferralDetail();
  }, []);

  const loadReferralDetail = async () => {
    try {
      const doc = await firestore()
        .collection('referrals')
        .doc(referralId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        setReferral({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate() || null,
        });
        setDiagnosis(data.diagnosis || '');
        setNotes(data.doctorNotes || '');
      }
    } catch (error) {
      console.error('Error loading referral:', error);
      Alert.alert('Error', 'Failed to load referral details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Required', 'Please provide a diagnosis');
      return;
    }

    Alert.alert(
      'Accept Referral',
      'Are you sure you want to accept this referral?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setSubmitting(true);
            try {
              await firestore()
                .collection('referrals')
                .doc(referralId)
                .update({
                  status: 'accepted',
                  diagnosis,
                  doctorNotes: notes,
                  reviewedBy: phcProfile.name,
                  reviewedById: auth().currentUser.uid,
                  reviewedAt: firestore.FieldValue.serverTimestamp(),
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                  actionHistory: firestore.FieldValue.arrayUnion({
                    action: 'accepted',
                    by: phcProfile.name,
                    timestamp: new Date(),
                    diagnosis,
                    notes,
                  }),
                });

              Alert.alert('Success', 'Referral accepted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error accepting referral:', error);
              Alert.alert('Error', 'Failed to accept referral');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);
    try {
      await firestore()
        .collection('referrals')
        .doc(referralId)
        .update({
          status: 'rejected',
          rejectReason,
          doctorNotes: notes,
          reviewedBy: phcProfile.name,
          reviewedById: auth().currentUser.uid,
          reviewedAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
          actionHistory: firestore.FieldValue.arrayUnion({
            action: 'rejected',
            by: phcProfile.name,
            timestamp: new Date(),
            reason: rejectReason,
            notes,
          }),
        });

      Alert.alert('Referral Rejected', 'The ASHA worker will be notified', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error rejecting referral:', error);
      Alert.alert('Error', 'Failed to reject referral');
    } finally {
      setSubmitting(false);
      setShowRejectDialog(false);
    }
  };

  const handleClose = async () => {
    Alert.alert(
      'Close Case',
      'Mark this case as closed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          onPress: async () => {
            setSubmitting(true);
            try {
              await firestore()
                .collection('referrals')
                .doc(referralId)
                .update({
                  status: 'closed',
                  closedBy: phcProfile.name,
                  closedAt: firestore.FieldValue.serverTimestamp(),
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                  actionHistory: firestore.FieldValue.arrayUnion({
                    action: 'closed',
                    by: phcProfile.name,
                    timestamp: new Date(),
                  }),
                });

              Alert.alert('Case Closed', 'Referral marked as closed', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error closing referral:', error);
              Alert.alert('Error', 'Failed to close referral');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleCallASHA = () => {
    if (referral?.ashaPhone) {
      Linking.openURL(`tel:${referral.ashaPhone}`);
    } else {
      Alert.alert('No Contact', 'ASHA phone number not available');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading referral...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!referral) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Referral not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = {
    pending: { label: 'Pending Review', status: 'warning' },
    accepted: { label: 'Accepted', status: 'info' },
    rejected: { label: 'Rejected', status: 'error' },
    closed: { label: 'Closed', status: 'success' },
  }[referral.status] || { label: referral.status, status: 'inactive' };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Referral Details"
        subtitle={`Case #${referralId.slice(-6)}`}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <GovCard style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <GovStatusBadge status={statusInfo.status} label={statusInfo.label} />
            <Text style={styles.urgencyBadge}>
              {referral.urgency?.toUpperCase() || 'MEDIUM'} PRIORITY
            </Text>
          </View>
        </GovCard>

        {/* Patient Info */}
        <GovCard style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Patient Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{referral.patientName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{referral.patientAge}y</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{referral.patientGender || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Village</Text>
              <Text style={styles.infoValue}>{referral.village}</Text>
            </View>
          </View>
        </GovCard>

        {/* ASHA Info */}
        <GovCard style={styles.section}>
          <View style={styles.ashaHeader}>
            <Text style={styles.sectionTitle}>👩‍⚕️ Reported By</Text>
            <TouchableOpacity style={styles.callButton} onPress={handleCallASHA}>
              <Icon name="call" size={16} color={COLORS.white} />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.ashaName}>{referral.ashaName}</Text>
          <Text style={styles.ashaDetails}>ASHA Worker • {referral.village}</Text>
        </GovCard>

        {/* Symptoms */}
        {referral.symptoms && referral.symptoms.length > 0 && (
          <GovCard style={styles.section}>
            <Text style={styles.sectionTitle}>🩺 Symptoms</Text>
            <View style={styles.symptomsGrid}>
              {referral.symptoms.map((symptom, index) => (
                <View key={index} style={styles.symptomChip}>
                  <Text style={styles.symptomText}>{symptom}</Text>
                </View>
              ))}
            </View>
          </GovCard>
        )}

        {/* ASHA Observations */}
        {referral.observations && (
          <GovCard style={styles.section}>
            <Text style={styles.sectionTitle}>📝 ASHA Observations</Text>
            <Text style={styles.observationText}>{referral.observations}</Text>
          </GovCard>
        )}

        {/* Diagnosis (if pending) */}
        {referral.status === 'pending' && (
          <GovCard style={styles.section}>
            <Text style={styles.sectionTitle}>💊 Diagnosis *</Text>
            <TextInput
              style={styles.textArea}
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="Enter your diagnosis..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </GovCard>
        )}

        {/* Doctor Notes */}
        {referral.status === 'pending' && (
          <GovCard style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Doctor Notes</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes or instructions..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </GovCard>
        )}

        {/* Existing Diagnosis/Notes (if reviewed) */}
        {referral.status !== 'pending' && referral.diagnosis && (
          <GovCard style={styles.section}>
            <Text style={styles.sectionTitle}>💊 Diagnosis</Text>
            <Text style={styles.reviewText}>{referral.diagnosis}</Text>
            {referral.doctorNotes && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: SPACING.md }]}>📋 Doctor Notes</Text>
                <Text style={styles.reviewText}>{referral.doctorNotes}</Text>
              </>
            )}
            <Text style={styles.reviewedBy}>
              Reviewed by Dr. {referral.reviewedBy} on{' '}
              {referral.reviewedAt?.toLocaleDateString('en-IN')}
            </Text>
          </GovCard>
        )}

        {/* Action Buttons */}
        {referral.status === 'pending' && (
          <View style={styles.actionsContainer}>
            <GovButton
              title="Accept Referral"
              subtitle="Approve case"
              onPress={handleAccept}
              variant="primary"
              icon="checkCircle"
              fullWidth
              loading={submitting}
              disabled={submitting}
              style={styles.actionButton}
            />
            <GovButton
              title="Reject Referral"
              subtitle="Decline case"
              onPress={() => setShowRejectDialog(true)}
              variant="secondary"
              icon="close"
              fullWidth
              disabled={submitting}
            />
          </View>
        )}

        {referral.status === 'accepted' && (
          <View style={styles.actionsContainer}>
            <GovButton
              title="Close Case"
              subtitle="Mark as resolved"
              onPress={handleClose}
              variant="primary"
              icon="checkCircle"
              fullWidth
              loading={submitting}
              disabled={submitting}
            />
          </View>
        )}
      </ScrollView>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Reject Referral</Text>
            <Text style={styles.dialogSubtitle}>Please provide a reason</Text>
            <TextInput
              style={styles.dialogInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason for rejection..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogButton}
                onPress={() => setShowRejectDialog(false)}
              >
                <Text style={styles.dialogButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonPrimary]}
                onPress={handleReject}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.dialogButtonTextPrimary}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
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
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error,
  },
  statusCard: {
    marginBottom: SPACING.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgencyBadge: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.error,
  },
  section: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  ashaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    gap: SPACING.xs,
  },
  callButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
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
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  symptomChip: {
    backgroundColor: `${COLORS.info}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
  },
  symptomText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.info,
  },
  observationText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  textArea: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    minHeight: 100,
  },
  reviewText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  reviewedBy: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    marginBottom: SPACING.sm,
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  dialog: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.xl,
  },
  dialogTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  dialogSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginBottom: SPACING.md,
  },
  dialogInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    minHeight: 100,
    marginBottom: SPACING.md,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  dialogButtonPrimary: {
    backgroundColor: COLORS.error,
  },
  dialogButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  dialogButtonTextPrimary: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
