/**
 * Ops Device Detail Screen
 * View detailed information about a specific device
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
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import Icon from '../components/Icon';

export default function OpsDeviceDetailScreen({ navigation, route }) {
  const { deviceId } = route?.params || {};
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState(null);

  useEffect(() => {
    if (deviceId) {
      loadDeviceDetails();
    }
  }, [deviceId]);

  const loadDeviceDetails = async () => {
    try {
      const doc = await firestore()
        .collection('devices')
        .doc(deviceId)
        .get();
      
      if (doc.exists) {
        setDevice({ id: doc.id, ...doc.data() });
      }
    } catch (error) {
      console.error('Error loading device details:', error);
    } finally {
      setLoading(false);
    }
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

  if (!device) {
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
          <Text style={styles.headerTitle}>DEVICE NOT FOUND</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="warning" size={48} color="#ff5722" />
          <Text style={styles.emptyText}>Device not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#00ff00';
      case 'offline': return '#ff5722';
      case 'maintenance': return '#ff9800';
      default: return '#666';
    }
  };

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
          <Text style={styles.headerTitle}>DEVICE DETAILS</Text>
          <Text style={styles.headerSubtitle}>{device.deviceId}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(device.status) }]} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[styles.statusValue, { color: getStatusColor(device.status) }]}>
              {device.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEVICE INFORMATION</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Device ID</Text>
              <Text style={styles.infoValue}>{device.deviceId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{device.type || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{device.location || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned To</Text>
              <Text style={styles.infoValue}>{device.assignedTo || 'Unassigned'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Sync</Text>
              <Text style={styles.infoValue}>
                {device.lastSync?.toDate().toLocaleString() || 'Never'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Battery</Text>
              <Text style={styles.infoValue}>{device.battery || 'N/A'}%</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIONS</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="sync" size={20} color="#00ff00" />
            <Text style={styles.actionText}>Force Sync</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="settings" size={20} color="#00ff00" />
            <Text style={styles.actionText}>Configure</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]}>
            <Icon name="warning" size={20} color="#ff5722" />
            <Text style={[styles.actionText, styles.actionTextDanger]}>Report Issue</Text>
          </TouchableOpacity>
        </View>
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
    fontFamily: 'monospace',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#666',
    marginTop: SPACING.md,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#00ff00',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#666',
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#fff',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  actionButtonDanger: {
    borderColor: '#ff5722',
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#00ff00',
    marginLeft: SPACING.md,
  },
  actionTextDanger: {
    color: '#ff5722',
  },
});
