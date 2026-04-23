/**
 * Ops System Tools Screen
 * Override panel with confirmation prompts
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import Icon from '../components/Icon';
import { useOpsAuth } from '../context/OpsAuthContext';
import firestore from '@react-native-firebase/firestore';

export default function OpsSystemToolsScreen({ navigation }) {
  const { opsProfile } = useOpsAuth();

  const logAction = async (action, details) => {
    try {
      await firestore().collection('ops_audit_log').add({
        action,
        details,
        performedBy: opsProfile?.name,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const confirmAction = (title, message, action, details) => {
    Alert.alert(
      `⚠️ ${title}`,
      `${message}\n\nThis action will be logged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            await logAction(action, details);
            Alert.alert('Success', 'Action completed and logged');
          },
        },
      ]
    );
  };

  const tools = [
    {
      id: 'reset_sync',
      icon: 'sync',
      label: 'Reset Sync Status',
      description: 'Clear sync failures and retry',
      color: '#ff9800',
      action: () => confirmAction(
        'Reset Sync',
        'This will clear all sync failure flags and trigger retry.',
        'reset_sync',
        { scope: 'all' }
      ),
    },
    {
      id: 'clear_cache',
      icon: 'delete',
      label: 'Clear System Cache',
      description: 'Remove cached data',
      color: '#f44336',
      action: () => confirmAction(
        'Clear Cache',
        'This will remove all cached data from the system.',
        'clear_cache',
        { scope: 'system' }
      ),
    },
    {
      id: 'force_update',
      icon: 'refresh',
      label: 'Force App Update',
      description: 'Push update to all devices',
      color: '#9c27b0',
      action: () => confirmAction(
        'Force Update',
        'This will force all devices to update the app.',
        'force_update',
        { version: 'latest' }
      ),
    },
    {
      id: 'unlock_account',
      icon: 'unlock',
      label: 'Unlock Account',
      description: 'Unlock locked user accounts',
      color: '#2196f3',
      action: () => confirmAction(
        'Unlock Account',
        'This will unlock the specified user account.',
        'unlock_account',
        { userId: 'manual_entry' }
      ),
    },
  ];

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
          <Text style={styles.headerTitle}>SYSTEM TOOLS</Text>
          <Text style={styles.headerSubtitle}>Override Panel</Text>
        </View>
      </View>

      <View style={styles.warningBanner}>
        <Icon name="warning" size={20} color="#ff0000" />
        <Text style={styles.warningText}>
          All actions require confirmation and are logged
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={styles.toolCard}
            onPress={tool.action}
          >
            <View style={[styles.toolIcon, { backgroundColor: `${tool.color}20` }]}>
              <Icon name={tool.icon} size={28} color={tool.color} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolLabel}>{tool.label}</Text>
              <Text style={styles.toolDescription}>{tool.description}</Text>
            </View>
            <Icon name="next" size={20} color="#666" />
          </TouchableOpacity>
        ))}
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#ff0000',
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#ff0000',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#333',
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  toolInfo: {
    flex: 1,
  },
  toolLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#999',
  },
});
