/**
 * Resident Request History Screen
 * Track service requests and their status
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
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovStatusBadge } from '../components/gov';
import Icon from '../components/Icon';
import { useResidentAuth } from '../context/ResidentAuthContext';

export default function ResidentRequestHistoryScreen({ navigation }) {
  const { residentProfile } = useResidentAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const currentUser = auth().currentUser;
      
      if (!currentUser) {
        console.log('User not authenticated, cannot load requests');
        setLoading(false);
        return;
      }

      console.log('Loading requests for user:', currentUser.uid);

      // Fetch requests from Firestore
      const snapshot = await firestore()
        .collection('service_requests')
        .where('residentId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get();

      const fetchedRequests = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate() || null,
          assignedAt: data.assignedAt?.toDate() || null,
        };
      });

      console.log('Loaded requests:', fetchedRequests.length);
      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      
      // If permission denied or no index, show empty state
      if (error.code === 'firestore/permission-denied') {
        console.log('Permission denied - user may be using Fast Access');
      } else if (error.code === 'firestore/failed-precondition') {
        console.log('Firestore index required - requests will be empty until index is created');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', labelHindi: 'लंबित', status: 'warning' };
      case 'assigned':
        return { label: 'Assigned', labelHindi: 'सौंपा गया', status: 'info' };
      case 'completed':
        return { label: 'Completed', labelHindi: 'पूर्ण', status: 'success' };
      case 'cancelled':
        return { label: 'Cancelled', labelHindi: 'रद्द', status: 'error' };
      default:
        return { label: status, labelHindi: status, status: 'inactive' };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'asha_visit': return { name: 'person', color: COLORS.primary };
      case 'water_test': return { name: 'waterTest', color: COLORS.secondary };
      case 'complaint': return { name: 'warning', color: COLORS.warning };
      case 'referral': return { name: 'health', color: COLORS.accent };
      default: return { name: 'info', color: COLORS.info };
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRequestTitle = (type) => {
    switch (type) {
      case 'asha_visit':
        return { en: 'ASHA Visit Request', hi: 'आशा विज़िट अनुरोध' };
      case 'water_test':
        return { en: 'Water Test Request', hi: 'जल परीक्षण अनुरोध' };
      case 'complaint':
        return { en: 'Health Complaint', hi: 'स्वास्थ्य शिकायत' };
      case 'referral':
        return { en: 'Referral Status', hi: 'रेफरल स्थिति' };
      default:
        return { en: 'Service Request', hi: 'सेवा अनुरोध' };
    }
  };

  const renderRequest = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const typeIcon = getTypeIcon(item.type);
    const title = getRequestTitle(item.type);

    return (
      <TouchableOpacity style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={[styles.requestIcon, { backgroundColor: `${typeIcon.color}15` }]}>
            <Icon name={typeIcon.name} size={20} color={typeIcon.color} />
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.requestTitle}>
              {language === 'en' ? title.en : title.hi}
            </Text>
            <Text style={styles.requestDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <GovStatusBadge
            status={statusInfo.status}
            label={language === 'en' ? statusInfo.label : statusInfo.labelHindi}
          />
        </View>
        
        <Text style={styles.requestDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {item.assignedTo && (
          <View style={styles.requestFooter}>
            <Icon name="person" size={14} color={COLORS.textLight} />
            <Text style={styles.requestWorker}>
              {language === 'en' ? 'Assigned to ASHA worker' : 'आशा कार्यकर्ता को सौंपा गया'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title={language === 'en' ? 'Request History' : 'अनुरोध इतिहास'}
        subtitle={language === 'en' ? 'Track your requests' : 'अपने अनुरोध ट्रैक करें'}
        showBack
        onBackPress={() => navigation.goBack()}
      >
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        >
          <Text style={styles.langText}>{language === 'en' ? 'हिं' : 'EN'}</Text>
        </TouchableOpacity>
      </GovHeader>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {language === 'en' ? 'Loading requests...' : 'अनुरोध लोड हो रहे हैं...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="calendar" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                {language === 'en' ? 'No requests yet' : 'अभी तक कोई अनुरोध नहीं'}
              </Text>
              <Text style={styles.emptySubtext}>
                {language === 'en' 
                  ? 'Submit a request to see it here'
                  : 'इसे यहां देखने के लिए एक अनुरोध सबमिट करें'}
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
  langButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
  },
  langText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  listContent: {
    padding: SPACING.md,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  requestIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  requestDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  requestDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  requestWorker: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    marginTop: SPACING.md,
  },
});
