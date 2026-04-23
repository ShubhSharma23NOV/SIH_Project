/**
 * Ops Sync Monitor Screen
 * Monitor sync failures and data flow
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
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import Icon from '../components/Icon';

export default function OpsSyncMonitorScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failures, setFailures] = useState([]);

  useEffect(() => {
    loadFailures();
  }, []);

  const loadFailures = async () => {
    try {
      const snapshot = await firestore()
        .collection('sync_failures')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      const fetchedFailures = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFailures(fetchedFailures);
    } catch (error) {
      console.error('Error loading sync failures:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFailures();
    setRefreshing(false);
  };

  const renderFailure = ({ item }) => (
    <TouchableOpacity style={styles.failureCard}>
      <View style={styles.failureHeader}>
        <Icon name="sync" size={20} color="#ff5722" />
        <View style={styles.failureInfo}>
          <Text style={styles.failureType}>{item.type}</Text>
          <Text style={styles.failureDevice}>{item.deviceId}</Text>
        </View>
        <Text style={styles.failureTime}>
          {new Date(item.timestamp?.toDate()).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.failureError} numberOfLines={2}>{item.error}</Text>
      <View style={styles.failureFooter}>
        <Text style={styles.failureMeta}>Attempts: {item.retryCount || 0}</Text>
        <Text style={styles.failureMeta}>User: {item.userId}</Text>
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
          <Text style={styles.headerTitle}>SYNC MONITOR</Text>
          <Text style={styles.headerSubtitle}>{failures.length} failures</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      ) : (
        <FlatList
          data={failures}
          renderItem={renderFailure}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff00" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="checkCircle" size={48} color="#00ff00" />
              <Text style={styles.emptyText}>No sync failures</Text>
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
  listContent: {
    padding: SPACING.md,
  },
  failureCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#ff5722',
  },
  failureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  failureInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  failureType: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    marginBottom: 2,
  },
  failureDevice: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#999',
  },
  failureTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#666',
    fontFamily: 'monospace',
  },
  failureError: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#ff5722',
    marginBottom: SPACING.sm,
  },
  failureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: SPACING.xs,
  },
  failureMeta: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#666',
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
