/**
 * Ops Devices Screen
 * Device registry and pairing management
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
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import Icon from '../components/Icon';

export default function OpsDevicesScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadDevices();
  }, [filter]);

  const loadDevices = async () => {
    try {
      let query = firestore().collection('devices');
      
      if (filter !== 'all') {
        query = query.where('status', '==', filter);
      }

      const snapshot = await query.get();
      const fetchedDevices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDevices(fetchedDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#00ff00';
      case 'offline': return '#666';
      case 'error': return '#ff0000';
      default: return '#ff9800';
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => navigation.navigate('OpsDeviceDetail', { deviceId: item.id })}
    >
      <View style={styles.deviceHeader}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name || item.deviceId}</Text>
          <Text style={styles.deviceType}>{item.type}</Text>
        </View>
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.deviceDetails}>
        <Text style={styles.detailText}>ID: {item.deviceId}</Text>
        <Text style={styles.detailText}>Assigned: {item.assignedTo || 'Unassigned'}</Text>
        <Text style={styles.detailText}>Last Sync: {item.lastSync || 'Never'}</Text>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>DEVICE REGISTRY</Text>
          <Text style={styles.headerSubtitle}>{devices.length} devices</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Add Device', 'Device pairing wizard coming soon')}
        >
          <Icon name="add" size={20} color="#00ff00" />
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {['all', 'online', 'offline', 'error'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      ) : (
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff00" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="settings" size={48} color="#333" />
              <Text style={styles.emptyText}>No devices found</Text>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#00ff0020',
    borderColor: '#00ff00',
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#666',
  },
  filterTextActive: {
    color: '#00ff00',
  },
  listContent: {
    padding: SPACING.md,
  },
  deviceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#333',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#999',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontFamily: 'monospace',
  },
  deviceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: SPACING.sm,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#666',
    marginTop: SPACING.md,
  },
});
