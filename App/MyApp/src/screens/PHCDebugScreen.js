/**
 * PHC Debug Screen - Development Tool
 * Shows all Firestore data for debugging
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
import { usePHCAuth } from '../context/PHCAuthContext';

export default function PHCDebugScreen({ navigation }) {
  const { phcProfile } = usePHCAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    referrals: [],
    surveys: [],
    waterTests: [],
    ashaWorkers: [],
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [referralsSnap, surveysSnap, waterSnap, ashaSnap] = await Promise.all([
        firestore().collection('referrals').get(),
        firestore().collection('household_surveys').get(),
        firestore().collection('water_tests').limit(10).get(),
        firestore().collection('asha_workers').get(),
      ]);

      setData({
        referrals: referralsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        surveys: surveysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        waterTests: waterSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ashaWorkers: ashaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      });
    } catch (error) {
      console.error('Error loading debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = (item, index) => (
    <View key={index} style={styles.dataItem}>
      <Text style={styles.dataId}>ID: {item.id}</Text>
      <Text style={styles.dataText} numberOfLines={3}>
        {JSON.stringify(item, null, 2).substring(0, 200)}...
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧪 Debug Data</Text>
        <TouchableOpacity onPress={loadAllData} style={styles.refreshBtn}>
          <Icon name="refresh" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* PHC Profile */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PHC Profile</Text>
            <View style={styles.dataItem}>
              <Text style={styles.dataText}>
                {phcProfile ? JSON.stringify(phcProfile, null, 2) : 'Not loaded'}
              </Text>
            </View>
          </View>

          {/* Referrals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Referrals ({data.referrals.length})
            </Text>
            {data.referrals.length === 0 ? (
              <Text style={styles.emptyText}>No referrals found</Text>
            ) : (
              data.referrals.map((item, index) => renderItem(item, index))
            )}
          </View>

          {/* Household Surveys */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Household Surveys ({data.surveys.length})
            </Text>
            {data.surveys.length === 0 ? (
              <Text style={styles.emptyText}>No surveys found</Text>
            ) : (
              data.surveys.map((item, index) => renderItem(item, index))
            )}
          </View>

          {/* Water Tests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Water Tests ({data.waterTests.length})
            </Text>
            {data.waterTests.length === 0 ? (
              <Text style={styles.emptyText}>No water tests found</Text>
            ) : (
              data.waterTests.map((item, index) => renderItem(item, index))
            )}
          </View>

          {/* ASHA Workers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ASHA Workers ({data.ashaWorkers.length})
            </Text>
            {data.ashaWorkers.length === 0 ? (
              <Text style={styles.emptyText}>No ASHA workers found</Text>
            ) : (
              data.ashaWorkers.map((item, index) => renderItem(item, index))
            )}
          </View>
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.white}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    marginLeft: SPACING.md,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.white}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  dataItem: {
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: RADIUS.base,
    marginBottom: SPACING.sm,
  },
  dataId: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  dataText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    fontFamily: 'monospace',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
});
