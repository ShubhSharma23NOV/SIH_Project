/**
 * Household Health Check Screen - Redirect to Consent Flow
 * ArogyaJal - Water Health Initiative
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import { GovHeader } from '../components/gov';

export default function HouseholdHealthCheckScreen({ navigation }) {
  // Redirect to consent screen
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Consent', { returnScreen: 'HouseholdSurvey' });
    }, 500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <GovHeader
        title="Household Survey"
        subtitle="घरेलू सर्वेक्षण"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading survey...</Text>
        <Text style={styles.loadingTextHindi}>सर्वेक्षण लोड हो रहा है...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  loadingTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
});
