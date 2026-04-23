/**
 * PDF Viewer Screen
 * Views downloaded PDF training documents offline
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import Icon from '../components/Icon';
import TrainingService from '../services/TrainingService';

export default function PDFViewerScreen({ navigation, route }) {
  const { filePath, module } = route.params;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleLoadComplete = (numberOfPages) => {
    setTotalPages(numberOfPages);
  };

  const handlePageChanged = (page) => {
    setCurrentPage(page);
    
    // Track completion (reached last page)
    if (!completed && page === totalPages) {
      setCompleted(true);
      TrainingService.trackModuleCompletion(module.id);
      Alert.alert(
        'Module Completed',
        'You have completed this training module!',
        [{ text: 'OK' }]
      );
    }
  };

  const handleError = (error) => {
    console.error('PDF error:', error);
    Alert.alert(
      'Error',
      'Unable to open PDF. The file may be corrupted.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {module.title}
          </Text>
          {module.titleHindi && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {module.titleHindi}
            </Text>
          )}
        </View>
        <View style={styles.pageIndicator}>
          <Text style={styles.pageText}>
            {currentPage} / {totalPages}
          </Text>
        </View>
      </View>

      {/* PDF Viewer */}
      <Pdf
        source={{ uri: `file://${filePath}` }}
        style={styles.pdf}
        onLoadComplete={handleLoadComplete}
        onPageChanged={handlePageChanged}
        onError={handleError}
        enablePaging={true}
        horizontal={false}
        spacing={10}
        fitPolicy={0}
      />

      {/* Module Info */}
      <View style={styles.infoBar}>
        {module.description && (
          <Text style={styles.infoText} numberOfLines={2}>
            {module.description}
          </Text>
        )}
      </View>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  pageIndicator: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  pageText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    fontFamily: 'monospace',
  },
  pdf: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  infoBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 18,
  },
});
