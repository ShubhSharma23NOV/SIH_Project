/**
 * Ops Ticket Detail Screen
 * View and resolve support tickets
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
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import Icon from '../components/Icon';
import { useOpsAuth } from '../context/OpsAuthContext';

export default function OpsTicketDetailScreen({ navigation, route }) {
  const { ticketId } = route.params;
  const { opsProfile } = useOpsAuth();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTicket();
  }, []);

  const loadTicket = async () => {
    try {
      const doc = await firestore().collection('support_tickets').doc(ticketId).get();
      if (doc.exists) {
        setTicket({ id: doc.id, ...doc.data() });
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    Alert.alert(
      'Confirm Action',
      `Mark ticket as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              await firestore().collection('support_tickets').doc(ticketId).update({
                status: newStatus,
                resolvedBy: opsProfile?.name,
                resolvedAt: firestore.FieldValue.serverTimestamp(),
                resolution: resolution || 'Resolved',
              });

              // Log action
              await firestore().collection('ops_audit_log').add({
                action: 'ticket_status_update',
                ticketId,
                newStatus,
                performedBy: opsProfile?.name,
                timestamp: firestore.FieldValue.serverTimestamp(),
              });

              Alert.alert('Success', 'Ticket updated', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error updating ticket:', error);
              Alert.alert('Error', 'Failed to update ticket');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Ticket not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="back" size={20} color="#00ff00" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>TICKET #{ticket.id.slice(0, 8)}</Text>
          <Text style={styles.headerSubtitle}>{ticket.status?.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TICKET DETAILS</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Priority:</Text>
            <Text style={[styles.detailValue, { color: ticket.priority === 'critical' ? '#ff0000' : '#00ff00' }]}>
              {ticket.priority?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reporter:</Text>
            <Text style={styles.detailValue}>{ticket.reporterName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(ticket.createdAt?.toDate()).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ISSUE</Text>
          <Text style={styles.issueTitle}>{ticket.title}</Text>
          <Text style={styles.issueDescription}>{ticket.description}</Text>
        </View>

        {ticket.status !== 'resolved' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RESOLUTION NOTES</Text>
            <TextInput
              value={resolution}
              onChangeText={setResolution}
              placeholder="Enter resolution details..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              style={styles.resolutionInput}
            />
          </View>
        )}

        {ticket.status !== 'resolved' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => updateStatus('resolved')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Icon name="checkCircle" size={20} color="#000" />
                  <Text style={styles.actionButtonText}>RESOLVE</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.pendingButton]}
              onPress={() => updateStatus('pending')}
              disabled={updating}
            >
              <Icon name="time" size={20} color="#000" />
              <Text style={styles.actionButtonText}>MARK PENDING</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#00ff00',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#00ff00',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#00ff00',
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#999',
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#fff',
  },
  issueTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    marginBottom: SPACING.sm,
  },
  issueDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#ccc',
    lineHeight: 22,
  },
  resolutionInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#00ff00',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    gap: SPACING.sm,
  },
  resolveButton: {
    backgroundColor: '#00ff00',
  },
  pendingButton: {
    backgroundColor: '#ff9800',
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#000',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#ff0000',
  },
});
