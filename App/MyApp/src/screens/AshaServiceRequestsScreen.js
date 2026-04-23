/**
 * ASHA Service Requests Screen
 * View and manage service requests from residents
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
  RefreshControl,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from '../components/Icon';

export default function AshaServiceRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'assigned', 'completed'

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Please login to view requests');
        return;
      }

      console.log('🔍 Loading requests for ASHA UID:', currentUser.uid);

      const snapshot = await firestore()
        .collection('service_requests')
        .where('assignedAshaId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get();

      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRequests(requestsList);
      console.log('✅ Loaded', requestsList.length, 'service requests for ASHA:', currentUser.uid);
      
      if (requestsList.length === 0) {
        console.log('⚠️ No requests found. Checking all requests...');
        // Debug: Check all requests to see what assignedAshaId values exist
        const allSnapshot = await firestore()
          .collection('service_requests')
          .limit(5)
          .get();
        
        console.log('📋 Sample requests in database:');
        allSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('  - Request ID:', doc.id);
          console.log('    assignedAshaId:', data.assignedAshaId);
          console.log('    residentName:', data.residentName);
          console.log('    status:', data.status);
        });
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const acknowledgeRequest = async (requestId) => {
    try {
      const currentUser = auth().currentUser;
      await firestore()
        .collection('service_requests')
        .doc(requestId)
        .update({
          acknowledged: true,
          acknowledgedAt: firestore.FieldValue.serverTimestamp(),
          acknowledgedBy: currentUser.uid,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert('Acknowledged', 'Request has been acknowledged successfully');
      loadRequests();
    } catch (error) {
      console.error('Error acknowledging request:', error);
      Alert.alert('Error', 'Failed to acknowledge request');
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      await firestore()
        .collection('service_requests')
        .doc(requestId)
        .update({
          status: newStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
          ...(newStatus === 'completed' && { completedAt: firestore.FieldValue.serverTimestamp() }),
        });

      Alert.alert('Success', 'Request status updated');
      loadRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request');
    }
  };

  const getTimeRemaining = (createdAt) => {
    if (!createdAt) return null;
    
    const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const remaining = deadline - now;
    
    if (remaining <= 0) return { expired: true, text: 'Overdue' };
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return { expired: false, text: `${hours}h ${minutes}m left`, urgent: hours < 3 };
    }
    return { expired: false, text: `${minutes}m left`, urgent: true };
  };

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

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Service Requests</Text>
          <Text style={styles.headerTitleHindi}>सेवा अनुरोध</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{requests.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{requests.filter(r => r.status === 'assigned').length}</Text>
              <Text style={styles.statLabel}>New</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{requests.filter(r => r.status === 'in_progress').length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          {[
            { id: 'all', label: 'All', icon: 'apps', count: requests.length },
            { id: 'assigned', label: 'New', icon: 'bell', count: requests.filter(r => r.status === 'assigned').length },
            { id: 'in_progress', label: 'Active', icon: 'play', count: requests.filter(r => r.status === 'in_progress').length },
            { id: 'completed', label: 'Done', icon: 'checkCircle', count: requests.filter(r => r.status === 'completed').length },
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.id}
              style={[styles.filterTab, filter === filterOption.id && styles.filterTabActive]}
              onPress={() => setFilter(filterOption.id)}
              activeOpacity={0.7}
            >
              <Icon 
                name={filterOption.icon} 
                size={18} 
                color={filter === filterOption.id ? COLORS.white : COLORS.textMedium} 
              />
              <Text style={[styles.filterText, filter === filterOption.id && styles.filterTextActive]}>
                {filterOption.label}
              </Text>
              {filterOption.count > 0 && (
                <View style={[styles.filterBadge, filter === filterOption.id && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, filter === filterOption.id && styles.filterBadgeTextActive]}>
                    {filterOption.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="bell" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No requests found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'Service requests from residents will appear here'
                : `No ${filter} requests at the moment`}
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <TouchableOpacity 
              key={request.id} 
              style={styles.requestCard}
              onPress={() => navigation.navigate('AshaServiceRequestDetail', { request })}
              activeOpacity={0.7}
            >
              {/* Header */}
              <View style={styles.requestHeader}>
                <View style={styles.requestTypeContainer}>
                  <View style={[styles.typeIcon, { backgroundColor: `${getStatusColor(request.status)}15` }]}>
                    <Icon name={getTypeIcon(request.type)} size={20} color={getStatusColor(request.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestType}>{getTypeLabel(request.type)}</Text>
                    <Text style={styles.requestDate}>
                      {request.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </Text>
                  </View>
                </View>
                <View style={styles.headerBadges}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{request.status}</Text>
                  </View>
                  {!request.acknowledged && request.createdAt && (() => {
                    const timeInfo = getTimeRemaining(request.createdAt);
                    if (timeInfo) {
                      return (
                        <View style={[
                          styles.timerBadge, 
                          timeInfo.expired ? styles.timerExpired : timeInfo.urgent ? styles.timerUrgent : styles.timerNormal
                        ]}>
                          <Icon 
                            name="clock-outline" 
                            size={12} 
                            color={COLORS.white} 
                          />
                          <Text style={styles.timerText}>{timeInfo.text}</Text>
                        </View>
                      );
                    }
                    return null;
                  })()}
                </View>
              </View>

              {/* Acknowledge Alert - Show if not acknowledged */}
              {!request.acknowledged && (
                <View style={styles.acknowledgeAlert}>
                  <View style={styles.acknowledgeAlertContent}>
                    <Icon name="warning" size={18} color={COLORS.warning} />
                    <Text style={styles.acknowledgeAlertText}>
                      Please acknowledge this request within 24 hours
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.acknowledgeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      acknowledgeRequest(request.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="checkCircle" size={16} color={COLORS.white} />
                    <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Acknowledged Badge */}
              {request.acknowledged && (
                <View style={styles.acknowledgedBadge}>
                  <Icon name="checkCircle" size={14} color={COLORS.success} />
                  <Text style={styles.acknowledgedText}>
                    Acknowledged on {request.acknowledgedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </Text>
                </View>
              )}

              {/* Resident Info */}
              <View style={styles.residentInfo}>
                <Icon name="account" size={16} color={COLORS.textMedium} />
                <Text style={styles.residentName}>{request.residentName}</Text>
                <Text style={styles.separator}>•</Text>
                <Icon name="map-marker" size={16} color={COLORS.textMedium} />
                <Text style={styles.residentVillage}>{request.village}</Text>
              </View>

              {/* Priority */}
              <View style={styles.priorityContainer}>
                <Text style={styles.priorityLabel}>Priority:</Text>
                <View style={[styles.priorityBadge, { 
                  backgroundColor: request.priority === 'high' ? COLORS.error : 
                                   request.priority === 'medium' ? COLORS.warning : COLORS.info 
                }]}>
                  <Text style={styles.priorityText}>{request.priority}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>{request.description}</Text>

              {/* Footer Row */}
              <View style={styles.cardFooter}>
                {/* Contact */}
                {request.residentPhone && request.residentPhone !== 'Not provided' && (
                  <View style={styles.contactContainer}>
                    <Icon name="phone" size={14} color={COLORS.primary} />
                    <Text style={styles.contactText}>{request.residentPhone}</Text>
                  </View>
                )}
                
                {/* Tap to view hint */}
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Tap to view details</Text>
                  <Icon name="chevron-right" size={16} color={COLORS.textLight} />
                </View>
              </View>

              {/* Quick Actions - Only show for non-completed */}
              {request.status !== 'completed' && (
                <View style={styles.quickActionsContainer}>
                  {request.status === 'assigned' && (
                    <TouchableOpacity
                      style={[styles.quickActionButton, styles.startQuickButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        updateRequestStatus(request.id, 'in_progress');
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon name="play" size={14} color={COLORS.white} />
                      <Text style={styles.quickActionText}>Start Work</Text>
                    </TouchableOpacity>
                  )}
                  {request.status === 'in_progress' && (
                    <TouchableOpacity
                      style={[styles.quickActionButton, styles.completeQuickButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        updateRequestStatus(request.id, 'completed');
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon name="checkCircle" size={14} color={COLORS.white} />
                      <Text style={styles.quickActionText}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.primary,
    ...SHADOWS.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.white}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  headerTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: `${COLORS.white}90`,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: `${COLORS.white}80`,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: `${COLORS.white}30`,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.white}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    gap: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textMedium,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  filterBadgeActive: {
    backgroundColor: `${COLORS.white}30`,
  },
  filterBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  filterBadgeTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textMedium,
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  headerBadges: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  requestType: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  requestDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  timerNormal: {
    backgroundColor: COLORS.info,
  },
  timerUrgent: {
    backgroundColor: COLORS.warning,
  },
  timerExpired: {
    backgroundColor: COLORS.error,
  },
  timerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  acknowledgeAlert: {
    backgroundColor: `${COLORS.warning}15`,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  acknowledgeAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  acknowledgeAlertText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.base,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  acknowledgeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.base,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  acknowledgedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  residentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  residentName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  separator: {
    color: COLORS.textLight,
    marginHorizontal: SPACING.xs,
  },
  residentVillage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  priorityLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginRight: SPACING.sm,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textDark,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  contactText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  tapHintText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.base,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  startQuickButton: {
    backgroundColor: COLORS.secondary,
  },
  completeQuickButton: {
    backgroundColor: COLORS.success,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
