/**
 * Ops Training Screen
 * Manage training content for ASHA workers
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

export default function OpsTrainingScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const snapshot = await firestore()
        .collection('training_content')
        .orderBy('createdAt', 'desc')
        .get();
      
      const fetchedContent = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setContent(fetchedContent);
    } catch (error) {
      console.error('Error loading training content:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  };

  const renderContent = ({ item }) => (
    <TouchableOpacity style={styles.contentCard}>
      <View style={styles.contentHeader}>
        <Icon name="star" size={24} color="#2196f3" />
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle}>{item.title}</Text>
          <Text style={styles.contentType}>{item.type}</Text>
        </View>
        <Text style={styles.contentStatus}>{item.status}</Text>
      </View>
      <Text style={styles.contentDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.contentFooter}>
        <Text style={styles.contentMeta}>Views: {item.views || 0}</Text>
        <Text style={styles.contentMeta}>
          {new Date(item.createdAt?.toDate()).toLocaleDateString()}
        </Text>
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
          <Text style={styles.headerTitle}>TRAINING CONTENT</Text>
          <Text style={styles.headerSubtitle}>{content.length} items</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Upload', 'Content upload coming soon')}
        >
          <Icon name="add" size={20} color="#00ff00" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      ) : (
        <FlatList
          data={content}
          renderItem={renderContent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff00" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="star" size={48} color="#333" />
              <Text style={styles.emptyText}>No training content</Text>
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
  listContent: {
    padding: SPACING.md,
  },
  contentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#333',
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  contentInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  contentTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    marginBottom: 2,
  },
  contentType: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#999',
  },
  contentStatus: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#2196f3',
  },
  contentDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#999',
    marginBottom: SPACING.sm,
  },
  contentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: SPACING.xs,
  },
  contentMeta: {
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
