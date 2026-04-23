import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { GovHeader, GovCard, GovButton, GovSectionHeader } from '../components/gov';
import { COLORS, SPACING } from '../theme';
import Icon from '../components/Icon';

export default function HomeScreen({ navigation }) {
  const communityFeatures = [
    { id: 1, icon: 'waterSafe', title: 'Water Quality', subtitle: 'Check water safety in your area', route: 'WaterTesting' },
    { id: 2, icon: 'health', title: 'Health Alerts', subtitle: 'View community health updates', route: 'Alerts' },
    { id: 3, icon: 'emergency', title: 'Emergency Help', subtitle: 'Get immediate assistance', route: 'EmergencyHelp' },
    { id: 4, icon: 'ayurveda', title: 'Ayurvedic Remedies', subtitle: 'Traditional health solutions', route: 'AyurvedicRemedies' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <GovHeader 
        title="Community Portal"
        subtitle="सामुदायिक पोर्टल"
        showBack
        onBackPress={() => navigation.navigate('Launch')}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GovSectionHeader 
          title="Community Services"
          subtitle="Access health and wellness resources"
        />

        {communityFeatures.map((feature) => (
          <GovCard key={feature.id} style={styles.featureCard}>
            <View style={styles.featureContent}>
              <View style={styles.iconContainer}>
                <Icon name={feature.icon} size={32} color={COLORS.primary} />
              </View>
              <View style={styles.featureText}>
                <GovButton
                  title={feature.title}
                  subtitle={feature.subtitle}
                  onPress={() => navigation.navigate(feature.route)}
                  variant="text"
                  icon={feature.icon}
                />
              </View>
            </View>
          </GovCard>
        ))}
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
  featureCard: {
    marginBottom: SPACING.md,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureText: {
    flex: 1,
  },
});

