/**
 * Ops Data Integrity Screen
 * Monitor data quality and anomalies
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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import Icon from '../components/Icon';

export default function OpsDataIntegrityScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState({
    duplicates: [],
    missing: [],
    anomalies: [],
  });

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      // TODO: Implement actual data integrity checks
      setIssues({
        duplicates: [
          { id: '1', type: 'Duplicate household', count: 3 },
          { id: '2', type: 'Duplicate water test', count: 2 },
        ],
        missing: [
          { id: '3', type: 'Missing GPS coordinates', count: 5 },
        ],
        anomalies: [
          { id: '4', type: 'Unusual pH values', count: 2 },
        ],
      });
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIssues();
    setRefreshing(false);
  };

  const renderIssueCard = (issue, type) => (
    <TouchableOpacity key={issue.id} style={styles.issueCard}>
      <View style={styles.issueHeader}>
        <Icon name="warning" size={20} color="#f44336" />
        <Text style={styles.issueType}>{issue.type}</Text>
      </View>
      <Text style={styles.issueCount}>{issue.count} records affected</Text>
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
          <Text style={styles.headerTitle}>DATA INTEGRITY</Text>
          <Text style={styles.headerSubtitle}>Quality Monitor</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff00" />
          }
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔴 DUPLICATES</Text>
            {issues.duplicates.map(issue => renderIssueCard(issue, 'duplicate'))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ MISSING DATA</Text>
            {issues.missing.map(issue => renderIssueCard(issue, 'missing'))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 ANOMALIES</Text>
            {issues.anomalies.map(issue => renderIssueCard(issue, 'anomaly'))}
          </View>
        </ScrollView>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    marginBottom: SPACING.md,
  },
  issueCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  issueType: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
  issueCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
