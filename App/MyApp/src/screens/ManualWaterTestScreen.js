/**
 * Manual Water Test Screen - Redesigned for Field Efficiency
 * Multi-screen flow with visual interactions and zero-typing
 * ArogyaJal - Water Health Initiative
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { GovHeader, GovCard } from '../components/gov';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';
import Icon from '../components/Icon';
import { saveWaterTestOffline } from '../database/operations';

const TOTAL_STEPS = 4;

export default function ManualWaterTestScreen({ navigation, route }) {
  const { householdData } = route?.params || {};
  
  const [currentStep, setCurrentStep] = useState(1);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Water Source (auto-linked if from household)
    sourceType: householdData?.waterSource || '',
    sourceName: householdData?.sourceName || '',
    linkedHouseholdId: householdData?.householdId || null,
    location: householdData?.village || '',
    gpsLocation: householdData?.gpsLocation || { lat: null, long: null },
    
    // Step 2: FTK Parameters
    ph: '',
    frc: '',
    turbidity: '',
    tds: 50, // Default middle value for slider
    hardness: '',
    
    // Step 3: Visual Indicators
    appearance: '',
    odour: '',
    suspendedMatter: '',
    
    // Step 4: Environmental Factors
    nearbyRisks: [],
    recentRainfall: '',
    
    // Auto-calculated
    riskLevel: 'Low',
    riskScore: 0,
    testDate: new Date().toISOString(),
    testerId: 'ASHA-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  });

  // Auto-save after each step
  useEffect(() => {
    if (currentStep > 1) {
      autoSaveProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Calculate risk when moving to final step
  useEffect(() => {
    if (currentStep === TOTAL_STEPS) {
      calculateRiskLevel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const autoSaveProgress = async () => {
    setAutoSaving(true);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('water_test_draft', JSON.stringify(formData));
      setLastSaved(new Date().toLocaleTimeString());
      setTimeout(() => setAutoSaving(false), 500);
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleRisk = (risk) => {
    setFormData(prev => ({
      ...prev,
      nearbyRisks: prev.nearbyRisks.includes(risk)
        ? prev.nearbyRisks.filter(r => r !== risk)
        : [...prev.nearbyRisks, risk],
    }));
  };

  const calculateRiskLevel = () => {
    let score = 0;

    // pH risk (0-10 scale)
    if (formData.ph === '0-4' || formData.ph === '10-14') score += 10;
    else if (formData.ph === '4-6' || formData.ph === '8-10') score += 6;
    else if (formData.ph === '6-7' || formData.ph === '7-8') score += 2;

    // FRC risk
    if (formData.frc === 'not_present') score += 8;
    else if (formData.frc === 'not_tested') score += 4;

    // Turbidity risk
    if (formData.turbidity === 'high') score += 10;
    else if (formData.turbidity === 'medium') score += 5;

    // TDS risk (0-100 scale, higher is worse)
    if (formData.tds > 80) score += 8;
    else if (formData.tds > 60) score += 4;

    // Hardness risk
    if (formData.hardness === 'high') score += 4;

    // Appearance risk
    if (formData.appearance === 'muddy' || formData.appearance === 'brownish') score += 6;
    else if (formData.appearance === 'greenish' || formData.appearance === 'slight_yellow') score += 3;

    // Odour risk
    if (formData.odour === 'sewage' || formData.odour === 'chemical') score += 10;
    else if (formData.odour === 'strong') score += 5;
    else if (formData.odour === 'mild') score += 2;

    // Suspended matter risk
    if (formData.suspendedMatter === 'algae') score += 6;
    else if (formData.suspendedMatter === 'dirt') score += 4;
    else if (formData.suspendedMatter === 'fine') score += 2;

    // Environmental risks (each adds 3 points)
    score += formData.nearbyRisks.length * 3;

    // Recent rainfall
    if (formData.recentRainfall === 'yes') score += 4;

    let riskLevel = 'Low';
    if (score >= 30) riskLevel = 'High';
    else if (score >= 15) riskLevel = 'Medium';

    if (formData.riskLevel !== riskLevel || formData.riskScore !== score) {
      setFormData(prev => ({
        ...prev,
        riskLevel,
        riskScore: score,
      }));
    }
  };

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.sourceType) {
          Alert.alert('Required', 'Please select water source type');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.ph || !formData.frc || !formData.turbidity) {
          Alert.alert('Required', 'Please complete all FTK parameters');
          return false;
        }
        return true;
      
      case 3:
        if (!formData.appearance) {
          Alert.alert('Required', 'Please select water appearance');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const submitTest = async () => {
    try {
      const testData = {
        sourceType: formData.sourceType,
        sourceName: formData.sourceName,
        linkedHouseholdId: formData.linkedHouseholdId,
        appearance: formData.appearance,
        odour: formData.odour,
        suspendedMatter: formData.suspendedMatter,
        pH: formData.ph,
        frc: formData.frc,
        turbidity: formData.turbidity,
        tds: formData.tds,
        hardness: formData.hardness,
        rainfall24h: formData.recentRainfall,
        nearbyRiskActivity: formData.nearbyRisks,
        riskLevel: formData.riskLevel,
        riskScore: formData.riskScore,
        latitude: formData.gpsLocation.lat,
        longitude: formData.gpsLocation.long,
        reporterId: formData.testerId,
        reporterType: 'ASHA',
        testDate: formData.testDate,
      };

      const testId = await saveWaterTestOffline(testData);
      console.log('✅ Water test saved successfully:', testId, 'synced: 0');

      // Clear draft
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('water_test_draft');

      Alert.alert(
        'Test Saved Successfully ✓',
        `Water test saved offline!\n\nRisk Level: ${formData.riskLevel}\nRisk Score: ${formData.riskScore}/100\n\nWill sync when online.`,
        [
          { text: 'Test Another', onPress: () => navigation.replace('ManualWaterTest') },
          { text: 'Done', onPress: () => navigation.navigate('AshaDashboard') },
        ]
      );
    } catch (error) {
      console.error('Error saving water test:', error);
      Alert.alert('Error', 'Failed to save test. Please try again.');
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {[1, 2, 3, 4].map(step => (
          <View
            key={step}
            style={[
              styles.progressStep,
              step <= currentStep && styles.progressStepActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>Step {currentStep} of {TOTAL_STEPS}</Text>
      {autoSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={COLORS.success} />
          <Text style={styles.savingText}>Auto-saving...</Text>
        </View>
      )}
      {lastSaved && !autoSaving && (
        <Text style={styles.savedText}>✓ Saved at {lastSaved}</Text>
      )}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <GovCard style={styles.card}>
        <View style={styles.stepHeader}>
          <Icon name="waterDrop" size={40} color={COLORS.secondary} />
          <Text style={styles.stepTitle}>Water Source</Text>
          <Text style={styles.stepSubtitle}>जल स्रोत</Text>
        </View>

        {/* Auto-linked info */}
        {formData.linkedHouseholdId && (
          <View style={styles.linkedBanner}>
            <Icon name="link" size={20} color={COLORS.success} />
            <View style={styles.linkedInfo}>
              <Text style={styles.linkedText}>Linked to Household Survey</Text>
              <Text style={styles.linkedId}>ID: {formData.linkedHouseholdId}</Text>
            </View>
          </View>
        )}

        {/* Water Source Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Water Source Type • जल स्रोत प्रकार *</Text>
          <View style={styles.iconGrid}>
            {[
              { value: 'tap', icon: '🚰', label: 'Tap', labelHi: 'नल' },
              { value: 'well', icon: '🪣', label: 'Well', labelHi: 'कुआं' },
              { value: 'handpump', icon: '⛲', label: 'Hand Pump', labelHi: 'हैंड पंप' },
              { value: 'borewell', icon: '🔧', label: 'Borewell', labelHi: 'बोरवेल' },
              { value: 'spring', icon: '💧', label: 'Spring', labelHi: 'झरना' },
              { value: 'pond', icon: '🏞️', label: 'Pond', labelHi: 'तालाब' },
              { value: 'river', icon: '🌊', label: 'River', labelHi: 'नदी' },
              { value: 'stream', icon: '💦', label: 'Stream', labelHi: 'धारा' },
            ].map(source => (
              <TouchableOpacity
                key={source.value}
                style={[
                  styles.sourceCard,
                  formData.sourceType === source.value && styles.sourceCardActive,
                ]}
                onPress={() => updateField('sourceType', source.value)}
              >
                <Text style={styles.sourceIcon}>{source.icon}</Text>
                <Text style={styles.sourceLabel}>{source.label}</Text>
                <Text style={styles.sourceLabelHi}>{source.labelHi}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Info */}
        {formData.location && (
          <View style={styles.infoCard}>
            <Icon name="mapMarker" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>Location: {formData.location}</Text>
          </View>
        )}
      </GovCard>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <GovCard style={styles.card}>
        <View style={styles.stepHeader}>
          <Icon name="flask" size={40} color={COLORS.primary} />
          <Text style={styles.stepTitle}>FTK Parameters</Text>
          <Text style={styles.stepSubtitle}>FTK पैरामीटर</Text>
        </View>

        {/* pH Level */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>pH Level • pH स्तर *</Text>
          <View style={styles.phGrid}>
            {[
              { value: '0-4', label: '0-4', desc: 'Highly Acidic', color: '#dc2626' },
              { value: '4-6', label: '4-6', desc: 'Acidic', color: '#f59e0b' },
              { value: '6-7', label: '6-7', desc: 'Slightly Acidic', color: '#fbbf24' },
              { value: '7', label: '7', desc: 'Neutral ✓', color: '#22c55e' },
              { value: '7-8', label: '7-8', desc: 'Slightly Alkaline', color: '#fbbf24' },
              { value: '8-10', label: '8-10', desc: 'Alkaline', color: '#f59e0b' },
              { value: '10-14', label: '10-14', desc: 'Highly Alkaline', color: '#dc2626' },
            ].map(ph => (
              <TouchableOpacity
                key={ph.value}
                style={[
                  styles.phCard,
                  formData.ph === ph.value && { 
                    backgroundColor: ph.color + '20',
                    borderColor: ph.color,
                    borderWidth: 3,
                  },
                ]}
                onPress={() => updateField('ph', ph.value)}
              >
                <Text style={[styles.phValue, formData.ph === ph.value && { color: ph.color }]}>
                  {ph.label}
                </Text>
                <Text style={styles.phDesc}>{ph.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FRC (Free Residual Chlorine) */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>Free Residual Chlorine (FRC) *</Text>
          <View style={styles.frcButtons}>
            {[
              { value: 'present', icon: '✓', label: 'Present', labelHi: 'उपस्थित', color: COLORS.success },
              { value: 'not_present', icon: '✗', label: 'Not Present', labelHi: 'अनुपस्थित', color: COLORS.danger },
              { value: 'not_tested', icon: '?', label: 'Not Tested', labelHi: 'परीक्षण नहीं', color: COLORS.textLight },
            ].map(frc => (
              <TouchableOpacity
                key={frc.value}
                style={[
                  styles.frcButton,
                  formData.frc === frc.value && { 
                    backgroundColor: frc.color,
                    borderColor: frc.color,
                  },
                ]}
                onPress={() => updateField('frc', frc.value)}
              >
                <Text style={[
                  styles.frcIcon,
                  formData.frc === frc.value && styles.frcIconActive,
                ]}>
                  {frc.icon}
                </Text>
                <Text style={[
                  styles.frcLabel,
                  formData.frc === frc.value && styles.frcLabelActive,
                ]}>
                  {frc.label}
                </Text>
                <Text style={[
                  styles.frcLabelHi,
                  formData.frc === frc.value && styles.frcLabelActive,
                ]}>
                  {frc.labelHi}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Turbidity */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>Turbidity • टर्बिडिटी *</Text>
          <View style={styles.turbidityButtons}>
            {[
              { value: 'low', icon: '💧', label: 'Low (Clear)', labelHi: 'कम', color: COLORS.success },
              { value: 'medium', icon: '🌫️', label: 'Medium', labelHi: 'मध्यम', color: COLORS.warning },
              { value: 'high', icon: '🟤', label: 'High (Cloudy)', labelHi: 'उच्च', color: COLORS.danger },
            ].map(turb => (
              <TouchableOpacity
                key={turb.value}
                style={[
                  styles.turbidityButton,
                  formData.turbidity === turb.value && { 
                    backgroundColor: turb.color + '20',
                    borderColor: turb.color,
                    borderWidth: 3,
                  },
                ]}
                onPress={() => updateField('turbidity', turb.value)}
              >
                <Text style={styles.turbidityIcon}>{turb.icon}</Text>
                <Text style={styles.turbidityLabel}>{turb.label}</Text>
                <Text style={styles.turbidityLabelHi}>{turb.labelHi}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* TDS Slider */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>TDS Level • कुल घुलित ठोस</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderValue}>{formData.tds}</Text>
              <Text style={styles.sliderUnit}>mg/L</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${formData.tds}%` }]} />
              <View style={[styles.sliderThumb, { left: `${formData.tds}%` }]} />
            </View>
            <View style={styles.sliderButtons}>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => updateField('tds', Math.max(0, formData.tds - 10))}
              >
                <Text style={styles.sliderButtonText}>− 10</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => updateField('tds', Math.max(0, formData.tds - 5))}
              >
                <Text style={styles.sliderButtonText}>− 5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => updateField('tds', Math.min(100, formData.tds + 5))}
              >
                <Text style={styles.sliderButtonText}>+ 5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderButton}
                onPress={() => updateField('tds', Math.min(100, formData.tds + 10))}
              >
                <Text style={styles.sliderButtonText}>+ 10</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Low</Text>
              <Text style={styles.sliderLabelText}>Medium</Text>
              <Text style={styles.sliderLabelText}>High</Text>
            </View>
          </View>
        </View>

        {/* Hardness */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>Water Hardness • जल कठोरता</Text>
          <View style={styles.hardnessButtons}>
            {[
              { value: 'low', label: 'Soft', labelHi: 'नरम' },
              { value: 'medium', label: 'Medium', labelHi: 'मध्यम' },
              { value: 'high', label: 'Hard', labelHi: 'कठोर' },
            ].map(hard => (
              <TouchableOpacity
                key={hard.value}
                style={[
                  styles.hardnessButton,
                  formData.hardness === hard.value && styles.hardnessButtonActive,
                ]}
                onPress={() => updateField('hardness', hard.value)}
              >
                <Text style={[
                  styles.hardnessLabel,
                  formData.hardness === hard.value && styles.hardnessLabelActive,
                ]}>
                  {hard.label}
                </Text>
                <Text style={[
                  styles.hardnessLabelHi,
                  formData.hardness === hard.value && styles.hardnessLabelActive,
                ]}>
                  {hard.labelHi}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </GovCard>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <GovCard style={styles.card}>
        <View style={styles.stepHeader}>
          <Icon name="eye" size={40} color={COLORS.accent} />
          <Text style={styles.stepTitle}>Visual Indicators</Text>
          <Text style={styles.stepSubtitle}>दृश्य संकेतक</Text>
        </View>

        {/* Appearance */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>Water Appearance • पानी का रंग/रूप *</Text>
          <View style={styles.appearanceGrid}>
            {[
              { value: 'clear', icon: '💧', label: 'Clear', labelHi: 'स्वच्छ', color: '#22c55e' },
              { value: 'slight_yellow', icon: '🟡', label: 'Slight Yellow', labelHi: 'हल्का पीला', color: '#fbbf24' },
              { value: 'brownish', icon: '🟤', label: 'Brownish', labelHi: 'भूरा', color: '#92400e' },
              { value: 'muddy', icon: '🟫', label: 'Muddy', labelHi: 'मैला', color: '#78350f' },
              { value: 'greenish', icon: '🟢', label: 'Greenish', labelHi: 'हरा', color: '#16a34a' },
            ].map(app => (
              <TouchableOpacity
                key={app.value}
                style={[
                  styles.appearanceCard,
                  formData.appearance === app.value && { 
                    backgroundColor: app.color + '20',
                    borderColor: app.color,
                    borderWidth: 3,
                  },
                ]}
                onPress={() => updateField('appearance', app.value)}
              >
                <Text style={styles.appearanceIcon}>{app.icon}</Text>
                <Text style={styles.appearanceLabel}>{app.label}</Text>
                <Text style={styles.appearanceLabelHi}>{app.labelHi}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Odour */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>Odour • गंध</Text>
          <View style={styles.odourGrid}>
            {[
              { value: 'no_smell', icon: '✓', label: 'No Smell', labelHi: 'गंध नहीं' },
              { value: 'mild', icon: '~', label: 'Mild', labelHi: 'हल्की' },
              { value: 'strong', icon: '!', label: 'Strong', labelHi: 'तेज' },
              { value: 'sewage', icon: '⚠️', label: 'Sewage', labelHi: 'सीवेज' },
              { value: 'chemical', icon: '⚠️', label: 'Chemical', labelHi: 'रासायनिक' },
            ].map(odour => (
              <TouchableOpacity
                key={odour.value}
                style={[
                  styles.odourCard,
                  formData.odour === odour.value && styles.odourCardActive,
                ]}
                onPress={() => updateField('odour', odour.value)}
              >
                <Text style={styles.odourIcon}>{odour.icon}</Text>
                <Text style={styles.odourLabel}>{odour.label}</Text>
                <Text style={styles.odourLabelHi}>{odour.labelHi}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Suspended Matter */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>Suspended Matter • निलंबित पदार्थ</Text>
          <View style={styles.suspendedButtons}>
            {[
              { value: 'none', label: 'None', labelHi: 'कोई नहीं' },
              { value: 'fine', label: 'Fine Particles', labelHi: 'सूक्ष्म कण' },
              { value: 'dirt', label: 'Dirt/Sand', labelHi: 'मिट्टी/रेत' },
              { value: 'algae', label: 'Algae', labelHi: 'शैवाल' },
            ].map(susp => (
              <TouchableOpacity
                key={susp.value}
                style={[
                  styles.suspendedButton,
                  formData.suspendedMatter === susp.value && styles.suspendedButtonActive,
                ]}
                onPress={() => updateField('suspendedMatter', susp.value)}
              >
                <Text style={[
                  styles.suspendedLabel,
                  formData.suspendedMatter === susp.value && styles.suspendedLabelActive,
                ]}>
                  {susp.label}
                </Text>
                <Text style={[
                  styles.suspendedLabelHi,
                  formData.suspendedMatter === susp.value && styles.suspendedLabelActive,
                ]}>
                  {susp.labelHi}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </GovCard>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <GovCard style={styles.card}>
        <View style={styles.stepHeader}>
          <Icon name="warning" size={40} color={COLORS.warning} />
          <Text style={styles.stepTitle}>Environmental Factors</Text>
          <Text style={styles.stepSubtitle}>पर्यावरणीय कारक</Text>
        </View>

        {/* Nearby Risk Activities */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>Nearby Risk Activities • पास की जोखिम गतिविधियाँ</Text>
          <Text style={styles.helperText}>Tap all that apply</Text>
          <View style={styles.riskGrid}>
            {[
              { value: 'washing', icon: '🧺', label: 'Washing/Bathing', labelHi: 'धुलाई/स्नान' },
              { value: 'cattle', icon: '🐄', label: 'Cattle Nearby', labelHi: 'पशु पास में' },
              { value: 'garbage', icon: '🗑️', label: 'Garbage Dumping', labelHi: 'कचरा डंपिंग' },
              { value: 'defecation', icon: '🚽', label: 'Open Defecation', labelHi: 'खुला शौच' },
              { value: 'broken_pipe', icon: '🔧', label: 'Broken Pipeline', labelHi: 'टूटी पाइपलाइन' },
              { value: 'stagnant', icon: '💦', label: 'Stagnant Water', labelHi: 'ठहरा पानी' },
            ].map(risk => (
              <TouchableOpacity
                key={risk.value}
                style={[
                  styles.riskCard,
                  formData.nearbyRisks.includes(risk.value) && styles.riskCardActive,
                ]}
                onPress={() => toggleRisk(risk.value)}
              >
                <Text style={styles.riskIcon}>{risk.icon}</Text>
                <Text style={styles.riskLabel}>{risk.label}</Text>
                <Text style={styles.riskLabelHi}>{risk.labelHi}</Text>
                {formData.nearbyRisks.includes(risk.value) && (
                  <View style={styles.riskCheckmark}>
                    <Icon name="checkCircle" size={24} color={COLORS.success} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Rainfall */}
        <View style={styles.paramSection}>
          <Text style={styles.paramLabel}>Rainfall in Last 24 Hours • पिछले 24 घंटों में बारिश</Text>
          <View style={styles.rainfallButtons}>
            <TouchableOpacity
              style={[
                styles.rainfallButton,
                formData.recentRainfall === 'yes' && styles.rainfallButtonActive,
              ]}
              onPress={() => updateField('recentRainfall', 'yes')}
            >
              <Text style={styles.rainfallIcon}>🌧️</Text>
              <Text style={[
                styles.rainfallLabel,
                formData.recentRainfall === 'yes' && styles.rainfallLabelActive,
              ]}>
                Yes • हाँ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rainfallButton,
                formData.recentRainfall === 'no' && styles.rainfallButtonActive,
              ]}
              onPress={() => updateField('recentRainfall', 'no')}
            >
              <Text style={styles.rainfallIcon}>☀️</Text>
              <Text style={[
                styles.rainfallLabel,
                formData.recentRainfall === 'no' && styles.rainfallLabelActive,
              ]}>
                No • नहीं
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Risk Assessment Result */}
        <View style={[
          styles.riskResult,
          { 
            backgroundColor: formData.riskLevel === 'High' ? '#fee2e2' : 
                            formData.riskLevel === 'Medium' ? '#fef3c7' : '#dcfce7',
            borderColor: formData.riskLevel === 'High' ? COLORS.danger : 
                        formData.riskLevel === 'Medium' ? COLORS.warning : COLORS.success,
          }
        ]}>
          <Text style={styles.riskResultIcon}>
            {formData.riskLevel === 'High' ? '🔴' : 
             formData.riskLevel === 'Medium' ? '🟡' : '🟢'}
          </Text>
          <View style={styles.riskResultInfo}>
            <Text style={styles.riskResultLevel}>{formData.riskLevel} Risk</Text>
            <Text style={styles.riskResultScore}>Risk Score: {formData.riskScore}/100</Text>
          </View>
        </View>
      </GovCard>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Manual Water Test"
        subtitle="मैनुअल जल परीक्षण"
        onBack={() => {
          if (currentStep > 1) {
            goToPreviousStep();
          } else {
            Alert.alert(
              'Exit Test?',
              'Your progress will be saved as draft.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', onPress: () => navigation.goBack() },
              ]
            );
          }
        }}
      />

      {/* Tricolor */}
      <View style={styles.tricolor}>
        <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={goToPreviousStep}
          >
            <Icon name="chevronLeft" size={20} color={COLORS.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < TOTAL_STEPS ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={goToNextStep}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Icon name="chevronRight" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitTest}
          >
            <Icon name="checkCircle" size={20} color={COLORS.white} />
            <Text style={styles.submitButtonText}>Submit Test</Text>
          </TouchableOpacity>
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
  tricolor: {
    flexDirection: 'row',
    height: 3,
  },
  colorBar: {
    flex: 1,
  },
  
  // Progress Bar
  progressContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  progressBar: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  savingText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
  },
  savedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  
  // Step Content
  stepContent: {
    flex: 1,
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginTop: SPACING.sm,
  },
  stepSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: SPACING.xs,
  },
  
  // Linked Banner
  linkedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#dcfce7',
    padding: SPACING.md,
    borderRadius: RADIUS.base,
    marginBottom: SPACING.md,
  },
  linkedInfo: {
    flex: 1,
  },
  linkedText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  linkedId: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    marginTop: SPACING.xs,
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  
  // Icon Grid (Water Source)
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sourceCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xs,
  },
  sourceCardActive: {
    backgroundColor: `${COLORS.secondary}20`,
    borderColor: COLORS.secondary,
    borderWidth: 3,
  },
  sourceIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  sourceLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  sourceLabelHi: {
    fontSize: 9,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  
  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.base,
    marginTop: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  
  // Parameter Section
  paramSection: {
    marginBottom: SPACING.lg,
  },
  paramLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  
  // pH Grid
  phGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  phCard: {
    width: '31%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  phValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  phDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  
  // FRC Buttons
  frcButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  frcButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  frcIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  frcIconActive: {
    color: COLORS.white,
  },
  frcLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  frcLabelActive: {
    color: COLORS.white,
  },
  frcLabelHi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  
  // Turbidity Buttons
  turbidityButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  turbidityButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  turbidityIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  turbidityLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  turbidityLabelHi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  
  // TDS Slider
  sliderContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  sliderValue: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  sliderUnit: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    marginLeft: SPACING.xs,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
    marginLeft: -10,
    ...SHADOWS.md,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sliderButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.base,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  
  // Hardness Buttons
  hardnessButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  hardnessButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  hardnessButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  hardnessLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  hardnessLabelActive: {
    color: COLORS.white,
  },
  hardnessLabelHi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  
  // Appearance Grid
  appearanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  appearanceCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  appearanceIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  appearanceLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  appearanceLabelHi: {
    fontSize: 9,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  
  // Odour Grid
  odourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  odourCard: {
    width: '31%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  odourCardActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  odourIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  odourLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  odourLabelHi: {
    fontSize: 9,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  
  // Suspended Matter Buttons
  suspendedButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  suspendedButton: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  suspendedButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  suspendedLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  suspendedLabelActive: {
    color: COLORS.white,
  },
  suspendedLabelHi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  
  // Risk Grid
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  riskCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    position: 'relative',
  },
  riskCardActive: {
    backgroundColor: `${COLORS.warning}20`,
    borderColor: COLORS.warning,
    borderWidth: 3,
  },
  riskIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  riskLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  riskLabelHi: {
    fontSize: 9,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  riskCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  
  // Rainfall Buttons
  rainfallButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rainfallButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  rainfallButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rainfallIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  rainfallLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  rainfallLabelActive: {
    color: COLORS.white,
  },
  
  // Risk Result
  riskResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 3,
    marginTop: SPACING.lg,
  },
  riskResultIcon: {
    fontSize: 48,
  },
  riskResultInfo: {
    flex: 1,
  },
  riskResultLevel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  riskResultScore: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: SPACING.xs,
  },
  
  // Navigation Buttons
  navigationButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.primary,
    gap: SPACING.xs,
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.success,
    gap: SPACING.xs,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
