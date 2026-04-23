/**
 * Training Modules Screen
 * Shows list of training modules with download functionality
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
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard } from '../components/gov';
import Icon from '../components/Icon';
import TrainingService from '../services/TrainingService';
// import DownloadService from '../services/DownloadService'; // Temporarily disabled

export default function TrainingModulesScreen({ navigation }) {
  const { t } = useTranslation();
  const [modules, setModules] = useState([]);
  const [downloadedModules, setDownloadedModules] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(new Map());
  const [downloadProgress, setDownloadProgress] = useState(new Map());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [storageUsed, setStorageUsed] = useState('0 MB');

  const categories = [
    { id: 'all', label: t('training.categories.all'), icon: 'star' },
    { id: 'water_testing', label: t('training.categories.waterTesting'), icon: 'waterTest' },
    { id: 'surveys', label: t('training.categories.surveys'), icon: 'survey' },
    { id: 'health', label: t('training.categories.health'), icon: 'health' },
    { id: 'emergency', label: t('training.categories.emergency'), icon: 'emergency' },
  ];

  useEffect(() => {
    loadModules();
    loadDownloadedModules();
    loadStorageInfo();
  }, [selectedCategory]);

  const loadModules = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with Firestore data later
      const mockModules = [
        {
          id: '1',
          title: 'Water Quality Testing Basics',
          titleHindi: 'जल गुणवत्ता परीक्षण मूल बातें',
          description: 'Learn the fundamentals of water quality testing and how to use testing kits effectively.',
          type: 'video',
          category: 'water_testing',
          duration: '15 min',
          fileSize: '45 MB',
          difficulty: 'beginner',
          thumbnailUrl: null,
        },
        {
          id: '2',
          title: 'Community Health Survey Guide',
          titleHindi: 'सामुदायिक स्वास्थ्य सर्वेक्षण गाइड',
          description: 'Step-by-step guide for conducting household health surveys in your community.',
          type: 'pdf',
          category: 'surveys',
          duration: '10 min',
          fileSize: '5 MB',
          difficulty: 'beginner',
          thumbnailUrl: null,
        },
        {
          id: '3',
          title: 'Emergency Response Protocol',
          titleHindi: 'आपातकालीन प्रतिक्रिया प्रोटोकॉल',
          description: 'Learn how to respond to water-related health emergencies in your area.',
          type: 'video',
          category: 'emergency',
          duration: '20 min',
          fileSize: '60 MB',
          difficulty: 'intermediate',
          thumbnailUrl: null,
        },
        {
          id: '4',
          title: 'Using the Mobile App',
          titleHindi: 'मोबाइल ऐप का उपयोग',
          description: 'Complete tutorial on how to use all features of the Arogya Jal mobile application.',
          type: 'video',
          category: 'all',
          duration: '25 min',
          fileSize: '75 MB',
          difficulty: 'beginner',
          thumbnailUrl: null,
        },
      ];

      // Filter by category
      let filteredModules = mockModules;
      if (selectedCategory !== 'all') {
        filteredModules = mockModules.filter(m => m.category === selectedCategory);
      }

      setModules(filteredModules);
      
      // Try to load from Firestore as well
      // let result;
      // if (selectedCategory === 'all') {
      //   result = await TrainingService.getAllModules();
      // } else {
      //   result = await TrainingService.getModulesByCategory(selectedCategory);
      // }
      // if (result.success && result.modules.length > 0) {
      //   setModules(result.modules);
      // }
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDownloadedModules = async () => {
    try {
      const result = await TrainingService.getAllDownloadedModules();
      if (result.success) {
        const downloadedIds = new Set(result.modules.map(m => m.module_id));
        setDownloadedModules(downloadedIds);
      }
    } catch (error) {
      console.error('Error loading downloaded modules:', error);
    }
  };

  const loadStorageInfo = async () => {
    const storage = await TrainingService.getTotalStorageUsed();
    setStorageUsed(storage);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadModules();
    await loadDownloadedModules();
    await loadStorageInfo();
    setRefreshing(false);
  };

  const handleDownload = async (module) => {
    Alert.alert(
      t('training.messages.comingSoon'),
      t('training.messages.setupRequired'),
      [{ text: t('common.ok') }]
    );
    
    // TODO: Uncomment when native modules are ready
    // try {
    //   const storageInfo = await DownloadService.getAvailableStorage();
    //   if (storageInfo.success) {
    //     console.log('Available storage:', storageInfo.freeSpace);
    //   }
    //   setDownloading(prev => new Map(prev).set(module.id, true));
    //   const url = module.videoUrl || module.pdfUrl || module.imageUrl;
    //   if (!url) {
    //     Alert.alert('Error', 'No download URL available');
    //     return;
    //   }
    //   const result = await DownloadService.downloadFile(url, {...}, (progress) => {...});
    //   if (result.success) {
    //     Alert.alert('Download Complete', `${module.title} is now available offline`);
    //     await loadDownloadedModules();
    //     await loadStorageInfo();
    //   }
    // } catch (error) {
    //   console.error('Download error:', error);
    //   Alert.alert('Error', 'Failed to download module');
    // }
  };

  const handleDelete = (module) => {
    Alert.alert(t('training.messages.comingSoon'), t('training.messages.setupRequired'));
  };

  const handleOpenModule = async (module) => {
    Alert.alert(
      t('training.messages.comingSoon'),
      t('training.messages.setupRequired'),
      [{ text: t('common.ok') }]
    );
  };

  const renderModule = (module) => {
    const isDownloaded = downloadedModules.has(module.id);
    const isDownloading = downloading.get(module.id);
    const progress = downloadProgress.get(module.id);

    return (
      <TouchableOpacity
        key={module.id}
        style={styles.moduleCard}
        onPress={() => isDownloaded ? handleOpenModule(module) : handleDownload(module)}
        activeOpacity={0.7}
      >
        <View style={styles.cardInner}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: getCategoryColor(module.category) }]}>
              <Icon name={getCategoryIcon(module.type)} size={40} color="rgba(255,255,255,0.9)" />
            </View>
            {isDownloaded && (
              <View style={styles.downloadedBadge}>
                <Icon name="checkCircle" size={20} color={COLORS.success} />
              </View>
            )}
            {/* Type Badge */}
            <View style={[styles.typeBadge, { backgroundColor: module.type === 'video' ? '#ef4444' : '#3b82f6' }]}>
              <Text style={styles.typeBadgeText}>{module.type.toUpperCase()}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.moduleContent}>
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.moduleTitle} numberOfLines={2}>{module.title}</Text>
                {module.titleHindi && (
                  <Text style={styles.moduleTitleHindi} numberOfLines={1}>{module.titleHindi}</Text>
                )}
              </View>
            </View>
            
            {module.description && (
              <Text style={styles.moduleDescription} numberOfLines={2}>
                {module.description}
              </Text>
            )}

            {/* Meta Info */}
            <View style={styles.metaRow}>
              {module.duration && (
                <View style={styles.metaItem}>
                  <Icon name="clock" size={12} color={COLORS.textLight} />
                  <Text style={styles.metaText}>{module.duration}</Text>
                </View>
              )}
              {module.fileSize && (
                <View style={styles.metaItem}>
                  <Icon name="storage" size={12} color={COLORS.textLight} />
                  <Text style={styles.metaText}>{module.fileSize}</Text>
                </View>
              )}
              {module.difficulty && (
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(module.difficulty) }]}>
                  <Text style={styles.difficultyText}>{module.difficulty}</Text>
                </View>
              )}
            </View>

            {/* Action Button */}
            {isDownloading ? (
              <View style={styles.downloadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.downloadingText}>
                  {progress ? t('training.downloading', { progress: progress.progress }) : t('training.preparing')}
                </Text>
              </View>
            ) : (
              <View style={[styles.actionButton, isDownloaded ? styles.openButton : styles.downloadButton]}>
                <Icon name={isDownloaded ? 'play' : 'download'} size={14} color={COLORS.white} />
                <Text style={styles.actionButtonText}>
                  {isDownloaded ? t('training.open') : t('training.download')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      water_testing: COLORS.secondary,
      surveys: COLORS.primary,
      health: COLORS.success,
      emergency: COLORS.error,
    };
    return colors[category] || COLORS.info;
  };

  const getCategoryIcon = (type) => {
    const icons = {
      video: 'play',
      pdf: 'document',
      image: 'image',
    };
    return icons[type] || 'star';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: `${COLORS.success}20`,
      intermediate: `${COLORS.warning}20`,
      advanced: `${COLORS.error}20`,
    };
    return colors[difficulty] || `${COLORS.info}20`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title={t('training.title')}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoItem}>
          <Icon name="star" size={18} color={COLORS.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoValue}>{modules.length}</Text>
            <Text style={styles.infoLabel}>{t('training.available')}</Text>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Icon name="checkCircle" size={18} color={COLORS.success} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoValue}>{downloadedModules.size}</Text>
            <Text style={styles.infoLabel}>{t('training.downloaded')}</Text>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Icon name="storage" size={18} color={COLORS.secondary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoValue}>{storageUsed}</Text>
            <Text style={styles.infoLabel}>{t('training.storage')}</Text>
          </View>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
            activeOpacity={0.7}
          >
            <Icon
              name={cat.icon}
              size={14}
              color={selectedCategory === cat.id ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modules List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : modules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="info" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>{t('training.messages.noModules')}</Text>
            <Text style={styles.emptySubtext}>{t('training.messages.checkLater')}</Text>
          </View>
        ) : (
          modules.map(renderModule)
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {downloadedModules.size} {t('common.of')} {modules.length} {t('training.downloaded')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoTextContainer: {
    alignItems: 'flex-start',
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    lineHeight: 20,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: -2,
  },
  infoDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  categoryScroll: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 56,
  },
  categoryContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 6,
    height: 32,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  emptySubtext: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
  moduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cardInner: {
    flexDirection: 'row',
  },
  thumbnailContainer: {
    position: 'relative',
    width: 120,
    height: 140,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 2,
    ...SHADOWS.sm,
  },
  typeBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  moduleContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  titleContainer: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    lineHeight: 20,
    marginBottom: 2,
  },
  moduleTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
  },
  moduleDescription: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.base,
    gap: 6,
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
  },
  openButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 8,
  },
  downloadingText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
});
