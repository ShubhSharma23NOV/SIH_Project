/**
 * Water Testing Screen - Entry Point
 * Choose between Manual Test (FTK) or Sensor Test
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';
import Icon from '../components/Icon';

export default function WaterTestingScreen({ navigation }) {
  const [sensorConnected, setSensorConnected] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Test Water Source"
        subtitle="Choose Testing Method • परीक्षण विधि चुनें"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Manual Test Option */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ManualWaterTest')}
          activeOpacity={0.7}
        >
          <GovCard style={styles.optionCard}>
            <View style={styles.optionIcon}>
              <Icon name="water" size={40} color={COLORS.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Manual Water Test</Text>
              <Text style={styles.optionTitleHindi}>मैनुअल पानी परीक्षण</Text>
              <Text style={styles.optionDescription}>
                FTK Parameters: pH, FRC, Turbidity, TDS, Hardness
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🔬 Field Test Kit</Text>
              </View>
            </View>
            <Icon name="next" size={20} color={COLORS.textLight} />
          </GovCard>
        </TouchableOpacity>

        {/* Sensor Test Option */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SensorTest')}
          activeOpacity={0.7}
        >
          <GovCard style={styles.optionCard}>
            <View style={[styles.optionIcon, { backgroundColor: `${COLORS.accent}15` }]}>
              <Icon name="bluetooth" size={40} color={COLORS.accent} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Sensor Water Test</Text>
              <Text style={styles.optionTitleHindi}>सेंसर पानी परीक्षण</Text>
              <Text style={styles.optionDescription}>
                Bluetooth sensor for automated testing
              </Text>
              {sensorConnected ? (
                <View style={[styles.badge, { backgroundColor: `${COLORS.success}20` }]}>
                  <Text style={[styles.badgeText, { color: COLORS.success }]}>
                    ✓ Sensor Detected
                  </Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: `${COLORS.warning}20` }]}>
                  <Text style={[styles.badgeText, { color: COLORS.warning }]}>
                    Connect Sensor
                  </Text>
                </View>
              )}
            </View>
            <Icon name="next" size={20} color={COLORS.textLight} />
          </GovCard>
        </TouchableOpacity>

        {/* View History */}
        <View style={styles.historySection}>
          <GovButton
            title="📋 View Previous Tests"
            subtitle="पिछले परीक्षण देखें"
            onPress={() => navigation.navigate('WaterTestsHistory')}
            variant="secondary"
            fullWidth
          />
        </View>

        {/* Info Card */}
        <GovCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Testing Guidelines</Text>
          <Text style={styles.infoText}>
            • Collect water sample from the source{'\n'}
            • Use clean containers{'\n'}
            • Test within 2 hours of collection{'\n'}
            • Record all observations accurately
          </Text>
        </GovCard>
      </ScrollView>
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
    padding: SPACING.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  optionTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginBottom: SPACING.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: `${COLORS.primary}15`,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  historySection: {
    marginVertical: SPACING.lg,
  },
  infoCard: {
    backgroundColor: `${COLORS.info}10`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
});
