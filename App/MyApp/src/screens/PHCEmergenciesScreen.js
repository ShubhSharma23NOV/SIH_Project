/**
 * PHC Emergencies Screen
 * Active emergency cases requiring immediate attention
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

export default function PHCEmergenciesScreen({ navigation }) {
  const { phcProfile } = usePHCAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    loadEmergencies();
  }, []);

  const loadEmergencies = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || !phcProfile) {
        setLoading(false);
        return;
      }

      // Simplified query to avoid composite index requirement
      // Fetch all emergencies and filter in memory
      const snapshot = await firestore()
        .collection('emergencies')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const fetchedEmergencies = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        })
        .filter(emergency => {
          // Filter in memory for phcId and status
          const matchesPhc = emergency.phcId === phcProfile.phcId;
          const matchesStatus = ['active', 'responding'].includes(emergency.status);
          return matchesPhc && matchesStatus;
        });

      setEmergencies(fetchedEmergencies);
    } catch (error) {
      console.error('Error loading emergencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmergencies();
    setRefreshing(false);
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderEmergency = ({ item }) => (
    <TouchableOpacity
      style={styles.emergencyCard}
      onPress={() => navigation.navigate('PHCEmergencyDetail', { emergencyId: item.id })}
    >
      <View style={styles.emergencyHeader}>
        <View style={styles.emergencyLeft}>
          <View style={styles.criticalBadge}>
            <Icon name="emergency" size={16} color={COLORS.white} />
            <Text style={styles.criticalText}>CRITICAL</Text>
          </View>
          <Text style={styles.emergencyType}>{item.type || 'Emergency'}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'responding' && styles.statusResponding]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'ACTIVE' : 'RESPONDING'}
          </Text>
        </View>
      </View>

      <Text style={styles.emergencyDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.emergencyInfo}>
        <View style={styles.infoRow}>
          <Icon name="location" size={14} color={COLORS.textLight} />
          <Text style={styles.infoText}>{item.village || item.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="person" size={14} color={COLORS.textLight} />
          <Text style={styles.infoText}>{item.reportedByName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="calendar" size={14} color={COLORS.textLight} />
          <Text style={styles.infoText}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleCall(item.contactNumber);
          }}
        >
          <Icon name="call" size={16} color={COLORS.white} />
          <Text style={styles.quickActionText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, styles.quickActionSecondary]}
          onPress={(e) => {
            e.stopPropagation();
            handleCall('108');
          }}
        >
          <Icon name="emergency" size={16} color={COLORS.white} />
          <Text style={styles.quickActionText}>Ambulance</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🚨 Emergency Panel</Text>
          <Text style={styles.headerSubtitle}>{emergencies.length} Active Cases</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.error} />
          <Text style={styles.loadingText}>Loading emergencies...</Text>
        </View>
      ) : (
        <FlatList
          data={emergencies}
          renderItem={renderEmergency}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="checkCircle" size={64} color={COLORS.success} />
              <Text style={styles.emptyText}>No Active Emergencies</Text>
              <Text style={styles.emptySubtext}>All systems operational</Text>
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
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
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
    color: COLORS.textDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  listContent: {
    padding: SPACING.md,
  },
  emergencyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    ...SHADOWS.md,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  emergencyLeft: {
    flex: 1,
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  criticalText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  emergencyType: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  statusBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusResponding: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  emergencyDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  emergencyInfo: {
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.base,
    gap: SPACING.xs,
  },
  quickActionSecondary: {
    backgroundColor: COLORS.error,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
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
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});
