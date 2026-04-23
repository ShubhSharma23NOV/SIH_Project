import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import { GovHeader, GovCard } from '../components/gov';
import Icon from '../components/Icon';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'leaf' },
  { id: 'DIARRHEA', label: 'Diarrhea', icon: 'waterDrop' },
  { id: 'VOMITING', label: 'Vomiting', icon: 'vomit' },
  { id: 'FEVER', label: 'Fever', icon: 'fever' },
  { id: 'COUGH', label: 'Cough', icon: 'cough' },
  { id: 'HEADACHE', label: 'Headache', icon: 'headache' },
  { id: 'STOMACH_PAIN', label: 'Stomach Pain', icon: 'stomach' },
];

const REMEDIES = [
  {
    id: 1,
    herbName: 'Tulsi (Holy Basil)',
    scientificName: 'Ocimum sanctum',
    symptom: 'DIARRHEA',
    region: 'Northeast India',
    ingredients: 'Fresh tulsi leaves (10-15), water (1 cup)',
    preparation: '1. Wash leaves thoroughly\n2. Boil in water for 5 minutes\n3. Strain and cool slightly\n4. Drink warm',
    dosage: '1 cup, 2-3 times daily',
    avoidIf: 'Pregnancy, low blood sugar',
    emergencyFlag: 0,
  },
  {
    id: 2,
    herbName: 'Ginger (Adrak)',
    scientificName: 'Zingiber officinale',
    symptom: 'VOMITING',
    region: 'Northeast India',
    ingredients: 'Fresh ginger root (1 inch), honey (1 tsp), warm water (1 cup)',
    preparation: '1. Grate fresh ginger\n2. Boil in water for 5 minutes\n3. Strain and add honey\n4. Drink warm',
    dosage: '1 cup, 2-3 times daily after meals',
    avoidIf: 'Pregnancy, bleeding disorders, blood thinners',
    emergencyFlag: 1,
  },
  {
    id: 3,
    herbName: 'Neem (Nimba)',
    scientificName: 'Azadirachta indica',
    symptom: 'FEVER',
    region: 'Northeast India',
    ingredients: 'Fresh neem leaves (5-7), water (1 cup)',
    preparation: '1. Wash neem leaves\n2. Boil in water for 10 minutes\n3. Strain and cool\n4. Drink lukewarm',
    dosage: '1/2 cup, twice daily',
    avoidIf: 'Pregnancy, infants, kidney disease',
    emergencyFlag: 0,
  },
  {
    id: 4,
    herbName: 'Ajwain (Carom Seeds)',
    scientificName: 'Trachyspermum ammi',
    symptom: 'STOMACH_PAIN',
    region: 'Northeast India',
    ingredients: 'Ajwain seeds (1 tsp), warm water (1 cup)',
    preparation: '1. Dry roast ajwain seeds lightly\n2. Crush slightly\n3. Add to warm water\n4. Let steep for 5 minutes',
    dosage: '1 cup after meals',
    avoidIf: 'Liver disease, ulcers',
    emergencyFlag: 0,
  },
  {
    id: 5,
    herbName: 'Tulsi & Honey',
    scientificName: 'Ocimum sanctum',
    symptom: 'COUGH',
    region: 'Northeast India',
    ingredients: 'Tulsi leaves (10), honey (2 tsp), black pepper powder (pinch)',
    preparation: '1. Extract tulsi juice\n2. Mix with honey and pepper\n3. Take directly',
    dosage: '1 tsp, 3 times daily',
    avoidIf: 'Diabetes (use less honey)',
    emergencyFlag: 0,
  },
  {
    id: 6,
    herbName: 'Peppermint (Pudina)',
    scientificName: 'Mentha piperita',
    symptom: 'HEADACHE',
    region: 'Northeast India',
    ingredients: 'Fresh peppermint leaves (10-12), water (1 cup)',
    preparation: '1. Crush peppermint leaves\n2. Steep in hot water for 10 minutes\n3. Strain and drink\n4. Can also apply crushed leaves to forehead',
    dosage: '1 cup, as needed',
    avoidIf: 'GERD, acid reflux',
    emergencyFlag: 0,
  },
  {
    id: 7,
    herbName: 'Bael (Wood Apple)',
    scientificName: 'Aegle marmelos',
    symptom: 'DIARRHEA',
    region: 'Northeast India',
    ingredients: 'Bael fruit pulp (2 tbsp), water (1 cup), sugar (optional)',
    preparation: '1. Extract bael pulp\n2. Mix with water\n3. Add sugar if needed\n4. Drink fresh',
    dosage: '1 cup, 2 times daily',
    avoidIf: 'Constipation',
    emergencyFlag: 0,
  },
  {
    id: 8,
    herbName: 'Cumin (Jeera)',
    scientificName: 'Cuminum cyminum',
    symptom: 'VOMITING',
    region: 'Northeast India',
    ingredients: 'Cumin seeds (1 tsp), water (1 cup)',
    preparation: '1. Boil cumin seeds in water\n2. Simmer for 5 minutes\n3. Strain and cool\n4. Drink slowly',
    dosage: '1/2 cup, 2-3 times daily',
    avoidIf: 'None known',
    emergencyFlag: 0,
  },
];

export default function AyurvedicRemediesScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filteredRemedies = selectedCategory === 'all'
    ? REMEDIES
    : REMEDIES.filter(r => r.symptom === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <GovHeader
        title="Health Remedies"
        subtitle="स्वास्थ्य उपचार"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.tricolor}>
        <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
      </View>

      <ScrollView style={styles.content}>
        <GovCard style={styles.filterCard}>
          <Text style={styles.filterTitle}>Filter by Symptom</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterButton,
                  selectedCategory === cat.id && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Icon 
                  name={cat.icon} 
                  size={18} 
                  color={selectedCategory === cat.id ? COLORS.white : COLORS.primary} 
                />
                <Text 
                  style={[
                    styles.filterText,
                    selectedCategory === cat.id && styles.filterTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GovCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Traditional Remedies</Text>
          <Text style={styles.sectionSubtitle}>
            {filteredRemedies.length} remedies available
          </Text>
        </View>

        {filteredRemedies.map((remedy) => (
          <GovCard key={remedy.id} style={styles.remedyCard}>
            <TouchableOpacity
              onPress={() => setExpandedId(expandedId === remedy.id ? null : remedy.id)}
              activeOpacity={0.7}
            >
              <View style={styles.remedyHeader}>
                <View style={styles.remedyTitleContainer}>
                  <Text style={styles.remedyName}>{remedy.herbName}</Text>
                  <Text style={styles.remedyScientific}>{remedy.scientificName}</Text>
                </View>
                <Icon
                  name={expandedId === remedy.id ? 'chevronUp' : 'chevronDown'}
                  size={20}
                  color={COLORS.textMedium}
                />
              </View>

              <View style={styles.remedyMeta}>
                <View style={styles.symptomBadge}>
                  <Text style={styles.symptomText}>{remedy.symptom.replace('_', ' ')}</Text>
                </View>
                <Text style={styles.regionText}>{remedy.region}</Text>
              </View>
            </TouchableOpacity>

            {expandedId === remedy.id && (
              <View style={styles.remedyDetails}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Ingredients</Text>
                  <Text style={styles.detailText}>{remedy.ingredients}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Preparation Method</Text>
                  <Text style={styles.detailText}>{remedy.preparation}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Dosage</Text>
                  <Text style={styles.detailText}>{remedy.dosage}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Precautions / Avoid If</Text>
                  <Text style={styles.detailText}>{remedy.avoidIf}</Text>
                </View>

                {remedy.emergencyFlag === 1 && (
                  <View style={styles.emergencyBanner}>
                    <Icon name="warning" size={16} color={COLORS.danger} />
                    <Text style={styles.emergencyText}>
                      Emergency symptom - seek medical care if severe
                    </Text>
                  </View>
                )}
              </View>
            )}
          </GovCard>
        ))}

        {filteredRemedies.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="leaf" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No remedies found for this category</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tricolor: {
    flexDirection: 'row',
    height: 3,
  },
  colorBar: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  filterCard: {
    marginBottom: SPACING.md,
  },
  filterTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  filterScroll: {
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textDark,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: SPACING.xs,
  },
  remedyCard: {
    marginBottom: SPACING.md,
  },
  remedyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  remedyTitleContainer: {
    flex: 1,
  },
  remedyName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  remedyScientific: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  remedyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  symptomBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  symptomText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  regionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  remedyDetails: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  detailSection: {
    marginBottom: SPACING.md,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  emergencyText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
});
