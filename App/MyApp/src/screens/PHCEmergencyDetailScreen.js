/**
 * PHC Emergency Detail Screen
 * Emergency response and action tracking
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
  ActivityIndicator,
  Linking,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import Icon from '../components/Icon';
import { usePHCAuth } from '../context/PHCAuthContext';

export default function PHCEmergencyDetailScreen({ navigation, route }) {
  const { emergencyId } = route.params;
  const { phcProfile } = usePHCAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emergency, setEmergency] = useState(null);

  useEffect(() => {
    loadEmergencyDetail();
  }, []);

  const loadEmergencyDetail = async () => {
    try {
      const doc = await firestore()
        .collection('emergencies')
        .doc(emergencyId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        setEmergency({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      }
    } catch (error) {
      console.error('Error loading emergency:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setSubmitting(true);
    try {
      await firestore()
        .collection('emergencies')
        .doc(emergencyId)
        .update({
          status: newStatus,
          [`${newStatus}At`]: firestore.FieldValue.serverTimestamp(),
          [`${newStatus}By`]: phcProfile.name,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          actions: firestore.FieldValue.arrayUnion({
            action: newStatus,
            by: phcProfile.name,
            timestamp: new Date(),
          }),
        });

      Alert.alert('Success', `Emergency marked as ${newStatus}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating emergency:', error);
      Alert.alert('Error', 'Failed to update emergency status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.error} />
        </View>
      </SafeAreaView>
    );
  }

  if (!emergency) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Emergency not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.error} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🚨 Emergency Response</Text>
          <Text style={styles.headerSubtitle}>Case #{emergencyId.slice(-6)}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <GovCard style={styles.criticalCard}>
          <View style={styles.criticalHeader}>
            <Icon name="emergency" size={32} color={COLORS.error} />
            <Text style={styles.criticalText}>CRITICAL EMERGENCY</Text>
          </View>
          <Text style={styles.emergencyType}>{emergency.type}</Text>
        </GovCard>

        <GovCard style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Description</Text>
          <Text style={styles.descriptionText}>{emergency.description}</Text>
        </GovCard>

        <GovCard style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <Text style={styles.locationText}>{emergency.address || emergency.village}</Text>
        </GovCard>

        <GovCard style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Reported By</Text>
          <Text style={styles.reporterName}>{emergency.reportedByName}</Text>
          <Text style={styles.reporterRole}>{emergency.reportedByRole || 'ASHA Worker'}</Text>
        </GovCard>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonCall]}
            onPress={() => handleCall(emergency.contactNumber)}
          >
            <Icon name="call" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Call Reporter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonAmbulance]}
            onPress={() => handleCall('108')}
          >
            <Icon name="emergency" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Call 108</Text>
          </TouchableOpacity>
        </View>

        {emergency.status === 'active' && (
          <GovButton
            title="Mark as Responding"
            subtitle="Intervention started"
            onPress={() => updateStatus('responding')}
            variant="primary"
            icon="checkCircle"
            fullWidth
            loading={submitting}
            disabled={submitting}
            style={styles.statusButton}
          />
        )}

        {emergency.status === 'responding' && (
          <GovButton
            title="Mark as Resolved"
            subtitle="Emergency handled"
            onPress={() => updateStatus('resolved')}
            variant="primary"
            icon="checkCircle"
            fullWidth
            loading={submitting}
            disabled={submitting}
            style={styles.statusButton}
          />
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
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  criticalCard: {
    backgroundColor: `${COLORS.error}10`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    marginBottom: SPACING.sm,
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  criticalText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.error,
  },
  emergencyType: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  section: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  descriptionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
  },
  reporterName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  reporterRole: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    gap: SPACING.xs,
    ...SHADOWS.md,
  },
  actionButtonCall: {
    backgroundColor: COLORS.accent,
  },
  actionButtonAmbulance: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  statusButton: {
    marginBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error,
  },
});
