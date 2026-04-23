/**
 * Household Survey Screen - Multi-Step Guided Flow
 * Redesigned for maximum field usability with minimal typing
 * ArogyaJal - Water Health Initiative
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import Icon from '../components/Icon';
import Dropdown from '../components/Dropdown';
import { getStates, getDistricts, getVillages } from '../data/northEastData';

const TOTAL_STEPS = 5;

export default function HouseholdSurveyScreen({ navigation, route }) {
  const { consentData } = route?.params || {};
  
  const [currentStep, setCurrentStep] = useState(1);
  const [hasConsent, setHasConsent] = useState(!!consentData);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    // Step 1: Identification (Auto-filled)
    state: '',
    district: '',
    village: '',
    householdId: generateHouseholdId(),
    dateOfVisit: new Date().toLocaleDateString('en-GB'),
    ashaId: 'ASHA-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    contactNumber: '',
    gpsLocation: { lat: null, long: null },
    gpsStatus: 'pending', // pending, capturing, captured, failed

    // Step 2: Household Profile
    headOfHousehold: '',
    totalMembers: '',
    age0to5: '0',
    age6to18: '0',
    age19to50: '0',
    age50plus: '0',

    // Step 3: Water Source
    waterSource: '',
    waterTreatment: [],
    storageType: '',
    sharedSource: '',

    // Step 4: Members (generated dynamically)
    members: [],

    // Step 5: Risk Summary (auto-calculated)
    riskLevel: 'Low',
    waterContaminationLikelihood: 'Low',
    recommendedAction: 'Continue Monitoring',
  });

  function generateHouseholdId() {
    const year = new Date().getFullYear();
    const sequential = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `HH-${year}-${sequential}`;
  }

  // Check consent
  useEffect(() => {
    if (!consentData) {
      const timer = setTimeout(() => {
        navigation.replace('Consent', { returnScreen: 'HouseholdSurvey' });
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setHasConsent(true);
      autoFillLocation();
    }
  }, [consentData, navigation]);

  // Auto-save after each step
  useEffect(() => {
    if (hasConsent && currentStep > 1) {
      autoSaveProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, hasConsent]);

  const autoFillLocation = async () => {
    // Auto-fill ASHA region from profile (mock for now)
    updateField('state', 'Assam');
    updateField('district', 'Kamrup');
  };

  const autoSaveProgress = async () => {
    setAutoSaving(true);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('household_survey_draft', JSON.stringify(formData));
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

  const captureGPS = async () => {
    updateField('gpsStatus', 'capturing');
    try {
      const LocationService = require('../services/LocationService').default;
      const hasPermission = await LocationService.requestPermission();
      
      if (!hasPermission) {
        updateField('gpsStatus', 'failed');
        Alert.alert('Permission Denied', 'Location permission required');
        return;
      }

      const location = await LocationService.getLocation({ accuracy: 'high', timeout: 30000 });
      const lat = location.latitude.toFixed(6);
      const long = location.longitude.toFixed(6);
      
      updateField('gpsLocation', { lat: parseFloat(lat), long: parseFloat(long) });
      updateField('gpsStatus', 'captured');
    } catch (error) {
      console.error('GPS error:', error);
      updateField('gpsStatus', 'failed');
      Alert.alert('GPS Error', 'Could not get location. You can continue without GPS.');
    }
  };

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep === 2) {
        generateMemberCards();
      }
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.state || !formData.district || !formData.village) {
          Alert.alert('Required', 'Please select State, District, and Village');
          return false;
        }
        if (!formData.contactNumber || formData.contactNumber.length !== 10) {
          Alert.alert('Required', 'Please enter a valid 10-digit contact number');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.headOfHousehold) {
          Alert.alert('Required', 'Please enter head of household name');
          return false;
        }
        if (!formData.totalMembers || parseInt(formData.totalMembers) < 1) {
          Alert.alert('Required', 'Please enter total number of household members');
          return false;
        }
        return true;
      
      case 3:
        if (!formData.waterSource) {
          Alert.alert('Required', 'Please select primary water source');
          return false;
        }
        return true;
      
      case 4:
        const incompleteMember = formData.members.find(m => !m.name || !m.age || !m.gender);
        if (incompleteMember) {
          Alert.alert('Required', 'Please complete all member details');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const generateMemberCards = () => {
    const total = parseInt(formData.totalMembers) || 0;
    const members = [];
    
    for (let i = 0; i < total; i++) {
      members.push({
        id: Date.now() + i,
        name: '',
        age: '',
        gender: '',
        highRiskGroups: [],
        isSick: null,
        symptoms: [],
        duration: '',
        severity: '',
      });
    }
    
    updateField('members', members);
  };

  const updateMember = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, [field]: value } : m),
    }));
  };

  const calculateRiskLevel = () => {
    let riskScore = 0;
    
    // High-risk members
    const highRiskCount = formData.members.filter(m => 
      m.highRiskGroups && m.highRiskGroups.length > 0
    ).length;
    riskScore += highRiskCount * 2;
    
    // Sick members
    const sickCount = formData.members.filter(m => m.isSick === true).length;
    riskScore += sickCount * 3;
    
    // Severe cases
    const severeCount = formData.members.filter(m => m.severity === 'Severe').length;
    riskScore += severeCount * 5;
    
    // Water source risk
    if (formData.waterSource === 'Pond' || formData.waterSource === 'River') {
      riskScore += 2;
    }
    
    // No water treatment
    if (formData.waterTreatment.includes('None') || formData.waterTreatment.length === 0) {
      riskScore += 3;
    }
    
    let newRiskLevel = 'Low';
    let newLikelihood = 'Low';
    let newAction = 'Continue Monitoring';
    
    if (riskScore >= 10) {
      newRiskLevel = 'High';
      newLikelihood = 'High';
      newAction = 'Immediate Water Testing & Medical Referral Required';
    } else if (riskScore >= 5) {
      newRiskLevel = 'Medium';
      newLikelihood = 'Medium';
      newAction = 'Schedule Water Testing & Monitor Health';
    }
    
    // Only update if values changed to prevent infinite loop
    if (formData.riskLevel !== newRiskLevel || 
        formData.waterContaminationLikelihood !== newLikelihood ||
        formData.recommendedAction !== newAction) {
      setFormData(prev => ({
        ...prev,
        riskLevel: newRiskLevel,
        waterContaminationLikelihood: newLikelihood,
        recommendedAction: newAction,
      }));
    }
  };

  const submitSurvey = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      const surveyRecord = {
        id: `survey_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        ...formData,
        consentData,
        synced: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending_sync',
      };

      const existingSurveys = await AsyncStorage.getItem('pending_household_surveys');
      const surveys = JSON.parse(existingSurveys || '[]');
      surveys.push(surveyRecord);
      await AsyncStorage.setItem('pending_household_surveys', JSON.stringify(surveys));
      
      // Clear draft
      await AsyncStorage.removeItem('household_survey_draft');
      
      Alert.alert(
        'Survey Submitted ✓',
        `Household survey saved successfully!\n\nID: ${surveyRecord.householdId}\nRisk Level: ${surveyRecord.riskLevel}\n\nWill sync when online.`,
        [{ text: 'OK', onPress: () => navigation.navigate('AshaDashboard') }]
      );
    } catch (error) {
      console.error('Error saving survey:', error);
      Alert.alert('Error', 'Failed to save survey. Please try again.');
    }
  };

  if (!hasConsent) {
    return (
      <SafeAreaView style={styles.container}>
        <GovHeader
          title="Household Survey"
          subtitle="घरेलू स्वास्थ्य सर्वेक्षण"
          showBack
          onBackPress={() => navigation.navigate('AshaDashboard')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking consent...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map(step => (
          <View
            key={step}
            style={[
              styles.progressStep,
              step <= currentStep && styles.progressStepActive,
              step === currentStep && styles.progressStepCurrent,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>
        Step {currentStep} of {TOTAL_STEPS}
      </Text>
      {autoSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={COLORS.success} />
          <Text style={styles.savingText}>Saving...</Text>
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
          <Icon name="mapMarker" size={32} color={COLORS.primary} />
          <Text style={styles.stepTitle}>Identification Details</Text>
          <Text style={styles.stepSubtitle}>पहचान विवरण</Text>
        </View>

        {/* Auto-filled Info */}
        <View style={styles.autoFilledSection}>
          <Text style={styles.sectionLabel}>Auto-filled Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Household ID:</Text>
            <Text style={styles.infoValue}>{formData.householdId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{formData.dateOfVisit}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ASHA ID:</Text>
            <Text style={styles.infoValue}>{formData.ashaId}</Text>
          </View>
        </View>

        {/* Location Selection */}
        <View style={styles.inputGroup}>
          <Dropdown
            label="State • राज्य *"
            value={formData.state}
            options={getStates()}
            onSelect={(value) => {
              updateField('state', value);
              updateField('district', '');
              updateField('village', '');
            }}
            placeholder="Select State"
            required={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Dropdown
            label="District • जिला *"
            value={formData.district}
            options={getDistricts(formData.state)}
            onSelect={(value) => {
              updateField('district', value);
              updateField('village', '');
            }}
            placeholder={formData.state ? "Select District" : "Select State First"}
            required={true}
          />
        </View>

        <View style={styles.inputGroup}>
          <Dropdown
            label="Village • गाँव *"
            value={formData.village}
            options={getVillages(formData.state, formData.district)}
            onSelect={(value) => updateField('village', value)}
            placeholder={formData.district ? "Select Village" : "Select District First"}
            required={true}
          />
        </View>

        {/* Contact Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number • संपर्क नंबर *</Text>
          <TextInput
            style={styles.input}
            value={formData.contactNumber}
            onChangeText={(v) => updateField('contactNumber', v)}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* GPS Capture */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>GPS Location • GPS स्थान</Text>
          {formData.gpsStatus === 'captured' && (
            <View style={styles.gpsSuccess}>
              <Icon name="checkCircle" size={20} color={COLORS.success} />
              <Text style={styles.gpsSuccessText}>
                GPS Captured: {formData.gpsLocation.lat}, {formData.gpsLocation.long}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.gpsButton,
              formData.gpsStatus === 'capturing' && styles.gpsButtonDisabled,
              formData.gpsStatus === 'captured' && styles.gpsButtonSuccess,
            ]}
            onPress={captureGPS}
            disabled={formData.gpsStatus === 'capturing'}
          >
            {formData.gpsStatus === 'capturing' ? (
              <>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.gpsButtonText}>Capturing GPS...</Text>
              </>
            ) : formData.gpsStatus === 'captured' ? (
              <>
                <Icon name="checkCircle" size={20} color={COLORS.white} />
                <Text style={styles.gpsButtonText}>GPS Captured ✓</Text>
              </>
            ) : (
              <>
                <Icon name="gps" size={20} color={COLORS.white} />
                <Text style={styles.gpsButtonText}>Capture GPS Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </GovCard>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <GovCard style={styles.card}>
        <View style={styles.stepHeader}>
          <Icon name="household" size={32} color={COLORS.primary} />
          <Text style={styles.stepTitle}>Household Profile</Text>
          <Text style={styles.stepSubtitle}>घरेलू प्रोफ़ाइल</Text>
        </View>

        {/* Head of Household */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Head of Household • घर के मुखिया *</Text>
          <TextInput
            style={styles.input}
            value={formData.headOfHousehold}
            onChangeText={(v) => updateField('headOfHousehold', v)}
            placeholder="Enter full name"
            autoCapitalize="words"
          />
        </View>

        {/* Total Members */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Household Members • कुल सदस्य *</Text>
          <View style={styles.numberPicker}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numberButton,
                  formData.totalMembers === num.toString() && styles.numberButtonActive,
                ]}
                onPress={() => updateField('totalMembers', num.toString())}
              >
                <Text
                  style={[
                    styles.numberButtonText,
                    formData.totalMembers === num.toString() && styles.numberButtonTextActive,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {parseInt(formData.totalMembers) > 10 && (
            <TextInput
              style={[styles.input, { marginTop: SPACING.sm }]}
              value={formData.totalMembers}
              onChangeText={(v) => updateField('totalMembers', v)}
              placeholder="Enter number"
              keyboardType="number-pad"
            />
          )}
          <TouchableOpacity
            style={styles.moreMembersButton}
            onPress={() => updateField('totalMembers', '11')}
          >
            <Text style={styles.moreMembersText}>More than 10? Tap here</Text>
          </TouchableOpacity>
        </View>

        {/* Age Distribution */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age Distribution • आयु वितरण</Text>
          <Text style={styles.helperText}>Quick count by age groups</Text>
          
          <View style={styles.ageDistribution}>
            <View style={styles.ageCard}>
              <Text style={styles.ageIcon}>👶</Text>
              <Text style={styles.ageLabel}>0-5 years</Text>
              <View style={styles.ageCounter}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateField('age0to5', Math.max(0, parseInt(formData.age0to5 || 0) - 1).toString())}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{formData.age0to5 || 0}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateField('age0to5', (parseInt(formData.age0to5 || 0) + 1).toString())}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.ageCard}>
              <Text style={styles.ageIcon}>🧒</Text>
              <Text style={styles.ageLabel}>6-18 years</Text>
              <View style={styles.ageCounter}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateField('age6to18', Math.max(0, parseInt(formData.age6to18 || 0) - 1).toString())}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{formData.age6to18 || 0}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateField('age6to18', (parseInt(formData.age6to18 || 0) + 1).toString())}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.ageCard}>
              <Text style={styles.ageIcon}>👨</Text>
              <Text style={styles.ageLabel}>19-50 years</Text>
              <View style={styles.ageCounter}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateField('age19to50', Math.max(0, parseInt(formData.age19to50 || 0) - 1).toString())}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{formData.age19to50 || 0}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateField('age19to50', (parseInt(formData.age19to50 || 0) + 1).toString())}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.ageCard}>
              <Text style={styles.ageIcon}>👴</Text>
              <Text style={styles.ageLabel}>50+ years</Text>
              <View style={styles.ageCounter}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateField('age50plus', Math.max(0, parseInt(formData.age50plus || 0) - 1).toString())}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{formData.age50plus || 0}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateField('age50plus', (parseInt(formData.age50plus || 0) + 1).toString())}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </GovCard>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <GovCard style={styles.card}>
        <View style={styles.stepHeader}>
          <Icon name="waterDrop" size={32} color={COLORS.secondary} />
          <Text style={styles.stepTitle}>Water Source & Safety</Text>
          <Text style={styles.stepSubtitle}>जल स्रोत और सुरक्षा</Text>
        </View>

        {/* Primary Water Source */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Primary Water Source • मुख्य जल स्रोत *</Text>
          <View style={styles.iconGrid}>
            {[
              { value: 'Tap', icon: '🚰', label: 'Tap\nनल' },
              { value: 'Well', icon: '🪣', label: 'Well\nकुआं' },
              { value: 'Borewell', icon: '⛲', label: 'Borewell\nबोरवेल' },
              { value: 'River', icon: '🏞️', label: 'River\nनदी' },
              { value: 'Pond', icon: '💧', label: 'Pond\nतालाब' },
              { value: 'Spring', icon: '💦', label: 'Spring\nझरना' },
            ].map(source => (
              <TouchableOpacity
                key={source.value}
                style={[
                  styles.iconTile,
                  formData.waterSource === source.value && styles.iconTileActive,
                ]}
                onPress={() => updateField('waterSource', source.value)}
              >
                <Text style={styles.iconTileIcon}>{source.icon}</Text>
                <Text style={styles.iconTileLabel}>{source.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Water Treatment */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Water Treatment Methods • जल उपचार विधि</Text>
          <Text style={styles.helperText}>Select all that apply</Text>
          <View style={styles.checkboxGroup}>
            {[
              { value: 'Boiling', icon: '🔥', label: 'Boiling • उबालना' },
              { value: 'Chlorination', icon: '💊', label: 'Chlorination • क्लोरीनीकरण' },
              { value: 'Filter', icon: '🔬', label: 'Filter • फ़िल्टर' },
              { value: 'None', icon: '❌', label: 'None • कोई नहीं' },
            ].map(method => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.checkboxTile,
                  formData.waterTreatment.includes(method.value) && styles.checkboxTileActive,
                ]}
                onPress={() => {
                  const current = formData.waterTreatment;
                  if (current.includes(method.value)) {
                    updateField('waterTreatment', current.filter(m => m !== method.value));
                  } else {
                    updateField('waterTreatment', [...current, method.value]);
                  }
                }}
              >
                <Text style={styles.checkboxIcon}>{method.icon}</Text>
                <Text style={styles.checkboxLabel}>{method.label}</Text>
                {formData.waterTreatment.includes(method.value) && (
                  <View style={styles.checkmark}>
                    <Icon name="checkCircle" size={20} color={COLORS.success} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Storage Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Water Storage • जल भंडारण</Text>
          <View style={styles.buttonRow}>
            {['Covered Container', 'Open Container', 'Direct Use'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  formData.storageType === type && styles.optionButtonActive,
                ]}
                onPress={() => updateField('storageType', type)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    formData.storageType === type && styles.optionButtonTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Shared Source */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Is this a shared water source? • साझा जल स्रोत?</Text>
          <View style={styles.yesNoButtons}>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                formData.sharedSource === 'Yes' && styles.yesNoButtonActive,
              ]}
              onPress={() => updateField('sharedSource', 'Yes')}
            >
              <Text
                style={[
                  styles.yesNoText,
                  formData.sharedSource === 'Yes' && styles.yesNoTextActive,
                ]}
              >
                Yes • हाँ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                formData.sharedSource === 'No' && styles.yesNoButtonActive,
              ]}
              onPress={() => updateField('sharedSource', 'No')}
            >
              <Text
                style={[
                  styles.yesNoText,
                  formData.sharedSource === 'No' && styles.yesNoTextActive,
                ]}
              >
                No • नहीं
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GovCard>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <GovCard style={styles.card}>
        <View style={styles.stepHeader}>
          <Icon name="people" size={32} color={COLORS.accent} />
          <Text style={styles.stepTitle}>Household Members</Text>
          <Text style={styles.stepSubtitle}>घरेलू सदस्य • {formData.members.length} members</Text>
        </View>

        {formData.members.map((member, index) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <Text style={styles.memberNumber}>Member {index + 1}</Text>
              {member.highRiskGroups && member.highRiskGroups.length > 0 && (
                <View style={styles.riskBadge}>
                  <Text style={styles.riskBadgeText}>⚠️ High Risk</Text>
                </View>
              )}
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name • नाम *</Text>
              <TextInput
                style={styles.input}
                value={member.name}
                onChangeText={(v) => updateMember(member.id, 'name', v)}
                placeholder="Enter full name"
                autoCapitalize="words"
              />
            </View>

            {/* Age & Gender */}
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Age • आयु *</Text>
                <TextInput
                  style={styles.input}
                  value={member.age}
                  onChangeText={(v) => updateMember(member.id, 'age', v)}
                  placeholder="Age"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Gender • लिंग *</Text>
                <View style={styles.genderButtons}>
                  {[
                    { value: 'Male', icon: '👨', label: 'M' },
                    { value: 'Female', icon: '👩', label: 'F' },
                    { value: 'Other', icon: '👤', label: 'O' },
                  ].map(g => (
                    <TouchableOpacity
                      key={g.value}
                      style={[
                        styles.genderButton,
                        member.gender === g.value && styles.genderButtonActive,
                      ]}
                      onPress={() => updateMember(member.id, 'gender', g.value)}
                    >
                      <Text style={styles.genderIcon}>{g.icon}</Text>
                      <Text
                        style={[
                          styles.genderText,
                          member.gender === g.value && styles.genderTextActive,
                        ]}
                      >
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Auto-assign high risk based on age */}
            {member.age && (
              <>
                {parseInt(member.age) < 5 && (
                  <View style={styles.autoRiskBanner}>
                    <Icon name="warning" size={16} color={COLORS.warning} />
                    <Text style={styles.autoRiskText}>Auto-marked: Child under 5 (High Risk)</Text>
                  </View>
                )}
                {parseInt(member.age) >= 60 && (
                  <View style={styles.autoRiskBanner}>
                    <Icon name="warning" size={16} color={COLORS.warning} />
                    <Text style={styles.autoRiskText}>Auto-marked: Elderly (High Risk)</Text>
                  </View>
                )}
              </>
            )}

            {/* Additional Risk Factors */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Risk Factors • अतिरिक्त जोखिम</Text>
              <View style={styles.riskChips}>
                {[
                  { id: 'pregnant', label: '🤰 Pregnant', labelHi: 'गर्भवती' },
                  { id: 'chronic', label: '💊 Chronic Disease', labelHi: 'पुरानी बीमारी' },
                ].map(risk => (
                  <TouchableOpacity
                    key={risk.id}
                    style={[
                      styles.riskChip,
                      (member.highRiskGroups || []).includes(risk.id) && styles.riskChipActive,
                    ]}
                    onPress={() => {
                      const current = member.highRiskGroups || [];
                      const updated = current.includes(risk.id)
                        ? current.filter(r => r !== risk.id)
                        : [...current, risk.id];
                      updateMember(member.id, 'highRiskGroups', updated);
                    }}
                  >
                    <Text style={styles.riskChipText}>{risk.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Currently Sick */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Currently Sick? • वर्तमान में बीमार?</Text>
              <View style={styles.yesNoButtons}>
                <TouchableOpacity
                  style={[
                    styles.yesNoButton,
                    member.isSick === true && styles.yesNoButtonActive,
                  ]}
                  onPress={() => updateMember(member.id, 'isSick', true)}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      member.isSick === true && styles.yesNoTextActive,
                    ]}
                  >
                    Yes • हाँ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.yesNoButton,
                    member.isSick === false && styles.yesNoButtonActive,
                  ]}
                  onPress={() => updateMember(member.id, 'isSick', false)}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      member.isSick === false && styles.yesNoTextActive,
                    ]}
                  >
                    No • नहीं
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Conditional: Show symptoms only if sick */}
            {member.isSick === true && (
              <View style={styles.sicknessSection}>
                <View style={styles.sicknessBanner}>
                  <Icon name="warning" size={20} color={COLORS.white} />
                  <Text style={styles.sicknessBannerText}>Sickness Details Required</Text>
                </View>

                {/* Symptoms */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Symptoms • लक्षण *</Text>
                  <View style={styles.symptomsGrid}>
                    {[
                      { id: 'diarrhea', icon: '🚽', label: 'Diarrhea' },
                      { id: 'vomiting', icon: '🤮', label: 'Vomiting' },
                      { id: 'fever', icon: '🔥', label: 'Fever' },
                      { id: 'stomachPain', icon: '🤕', label: 'Stomach Pain' },
                      { id: 'dehydration', icon: '💧', label: 'Dehydration' },
                      { id: 'bloodInStool', icon: '🩸', label: 'Blood in Stool' },
                    ].map(symptom => (
                      <TouchableOpacity
                        key={symptom.id}
                        style={[
                          styles.symptomChip,
                          (member.symptoms || []).includes(symptom.id) && styles.symptomChipActive,
                        ]}
                        onPress={() => {
                          const current = member.symptoms || [];
                          const updated = current.includes(symptom.id)
                            ? current.filter(s => s !== symptom.id)
                            : [...current, symptom.id];
                          updateMember(member.id, 'symptoms', updated);
                        }}
                      >
                        <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                        <Text style={styles.symptomLabel}>{symptom.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Duration */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Duration • अवधि *</Text>
                  <View style={styles.buttonRow}>
                    {['1 day', '2-3 days', '4-7 days', '>1 week'].map(duration => (
                      <TouchableOpacity
                        key={duration}
                        style={[
                          styles.durationButton,
                          member.duration === duration && styles.durationButtonActive,
                        ]}
                        onPress={() => updateMember(member.id, 'duration', duration)}
                      >
                        <Text
                          style={[
                            styles.durationText,
                            member.duration === duration && styles.durationTextActive,
                          ]}
                        >
                          {duration}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Severity */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Severity • गंभीरता *</Text>
                  <View style={styles.severityButtons}>
                    {[
                      { value: 'Mild', color: COLORS.success, icon: '🟢' },
                      { value: 'Moderate', color: COLORS.warning, icon: '🟡' },
                      { value: 'Severe', color: COLORS.danger, icon: '🔴' },
                    ].map(severity => (
                      <TouchableOpacity
                        key={severity.value}
                        style={[
                          styles.severityButton,
                          member.severity === severity.value && { 
                            backgroundColor: severity.color,
                            borderColor: severity.color,
                          },
                        ]}
                        onPress={() => updateMember(member.id, 'severity', severity.value)}
                      >
                        <Text style={styles.severityIcon}>{severity.icon}</Text>
                        <Text
                          style={[
                            styles.severityText,
                            member.severity === severity.value && styles.severityTextActive,
                          ]}
                        >
                          {severity.value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </GovCard>
    </ScrollView>
  );

  // Calculate risk when moving to step 5
  useEffect(() => {
    if (currentStep === 5) {
      calculateRiskLevel();
    }
  }, [currentStep]);

  const renderStep5 = () => {
    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <GovCard style={styles.card}>
          <View style={styles.stepHeader}>
            <Icon name="checkCircle" size={32} color={COLORS.success} />
            <Text style={styles.stepTitle}>Risk Summary & Review</Text>
            <Text style={styles.stepSubtitle}>जोखिम सारांश और समीक्षा</Text>
          </View>

          {/* Risk Assessment */}
          <View style={[
            styles.riskAssessment,
            { 
              backgroundColor: formData.riskLevel === 'High' ? '#fee2e2' : 
                              formData.riskLevel === 'Medium' ? '#fef3c7' : '#dcfce7',
              borderColor: formData.riskLevel === 'High' ? COLORS.danger : 
                          formData.riskLevel === 'Medium' ? COLORS.warning : COLORS.success,
            }
          ]}>
            <Text style={styles.riskIcon}>
              {formData.riskLevel === 'High' ? '🔴' : 
               formData.riskLevel === 'Medium' ? '🟡' : '🟢'}
            </Text>
            <View style={styles.riskInfo}>
              <Text style={styles.riskLevel}>{formData.riskLevel} Risk Level</Text>
              <Text style={styles.riskAction}>{formData.recommendedAction}</Text>
            </View>
          </View>

          {/* Summary Sections */}
          <View style={styles.summarySection}>
            <TouchableOpacity 
              style={styles.summaryHeader}
              onPress={() => setCurrentStep(1)}
            >
              <View style={styles.summaryHeaderLeft}>
                <Icon name="mapMarker" size={20} color={COLORS.primary} />
                <Text style={styles.summaryTitle}>Identification</Text>
              </View>
              <Icon name="edit" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryText}>📍 {formData.village}, {formData.district}, {formData.state}</Text>
              <Text style={styles.summaryText}>📞 {formData.contactNumber}</Text>
              <Text style={styles.summaryText}>🆔 {formData.householdId}</Text>
              {formData.gpsLocation.lat && (
                <Text style={styles.summaryText}>
                  📍 GPS: {formData.gpsLocation.lat}, {formData.gpsLocation.long}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.summarySection}>
            <TouchableOpacity 
              style={styles.summaryHeader}
              onPress={() => setCurrentStep(2)}
            >
              <View style={styles.summaryHeaderLeft}>
                <Icon name="household" size={20} color={COLORS.primary} />
                <Text style={styles.summaryTitle}>Household Profile</Text>
              </View>
              <Icon name="edit" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryText}>👤 Head: {formData.headOfHousehold}</Text>
              <Text style={styles.summaryText}>👥 Total Members: {formData.totalMembers}</Text>
              <Text style={styles.summaryText}>
                Age Distribution: {formData.age0to5} (0-5), {formData.age6to18} (6-18), 
                {formData.age19to50} (19-50), {formData.age50plus} (50+)
              </Text>
            </View>
          </View>

          <View style={styles.summarySection}>
            <TouchableOpacity 
              style={styles.summaryHeader}
              onPress={() => setCurrentStep(3)}
            >
              <View style={styles.summaryHeaderLeft}>
                <Icon name="waterDrop" size={20} color={COLORS.secondary} />
                <Text style={styles.summaryTitle}>Water Source</Text>
              </View>
              <Icon name="edit" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryText}>💧 Source: {formData.waterSource}</Text>
              <Text style={styles.summaryText}>
                🔬 Treatment: {formData.waterTreatment.length > 0 ? formData.waterTreatment.join(', ') : 'None'}
              </Text>
              {formData.storageType && (
                <Text style={styles.summaryText}>🪣 Storage: {formData.storageType}</Text>
              )}
              {formData.sharedSource && (
                <Text style={styles.summaryText}>👥 Shared: {formData.sharedSource}</Text>
              )}
            </View>
          </View>

          <View style={styles.summarySection}>
            <TouchableOpacity 
              style={styles.summaryHeader}
              onPress={() => setCurrentStep(4)}
            >
              <View style={styles.summaryHeaderLeft}>
                <Icon name="people" size={20} color={COLORS.accent} />
                <Text style={styles.summaryTitle}>Members Health Status</Text>
              </View>
              <Icon name="edit" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={styles.summaryContent}>
              {formData.members.map((member, index) => (
                <View key={member.id} style={styles.memberSummary}>
                  <Text style={styles.memberSummaryName}>
                    {index + 1}. {member.name || 'Unnamed'} ({member.age || '?'}, {member.gender || '?'})
                  </Text>
                  {member.isSick === true && (
                    <View style={styles.sickIndicator}>
                      <Icon name="warning" size={14} color={COLORS.danger} />
                      <Text style={styles.sickText}>
                        Sick - {member.severity || 'Unknown'} severity
                      </Text>
                    </View>
                  )}
                  {member.highRiskGroups && member.highRiskGroups.length > 0 && (
                    <Text style={styles.riskIndicator}>⚠️ High Risk Group</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Important Notes */}
          <View style={styles.notesCard}>
            <Icon name="info" size={20} color={COLORS.info} />
            <Text style={styles.notesText}>
              This survey will be saved offline and synced automatically when internet is available.
            </Text>
          </View>
        </GovCard>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GovHeader
        title="Household Survey"
        subtitle="घरेलू स्वास्थ्य सर्वेक्षण"
        showBack
        onBackPress={() => {
          if (currentStep > 1) {
            goToPreviousStep();
          } else {
            Alert.alert(
              'Exit Survey?',
              'Your progress will be saved as draft.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', onPress: () => navigation.navigate('AshaDashboard') },
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
      {currentStep === 5 && renderStep5()}

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
            onPress={submitSurvey}
          >
            <Icon name="checkCircle" size={20} color={COLORS.white} />
            <Text style={styles.submitButtonText}>Submit Survey</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
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
  progressStepCurrent: {
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
  
  // Auto-filled Section
  autoFilledSection: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textMedium,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
  },
  
  // GPS Button
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    gap: SPACING.sm,
  },
  gpsButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  gpsButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  gpsButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.white,
  },
  gpsSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: '#dcfce7',
    borderRadius: RADIUS.base,
  },
  gpsSuccessText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success,
  },
  
  // Number Picker
  numberPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  numberButton: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  numberButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  numberButtonTextActive: {
    color: COLORS.white,
  },
  moreMembersButton: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  moreMembersText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  
  // Age Distribution
  ageDistribution: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  ageCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    alignItems: 'center',
  },
  ageIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  ageLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    marginBottom: SPACING.sm,
  },
  ageCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  counterValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    minWidth: 30,
    textAlign: 'center',
  },
  
  // Icon Grid
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconTile: {
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
  iconTileActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  iconTileIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  iconTileLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  
  // Checkbox Group
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  checkboxTile: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    position: 'relative',
  },
  checkboxTileActive: {
    backgroundColor: `${COLORS.success}15`,
    borderColor: COLORS.success,
  },
  checkboxIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  checkboxLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  
  // Button Row
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
  },
  optionButtonTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  
  // Yes/No Buttons
  yesNoButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  yesNoButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  yesNoText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  yesNoTextActive: {
    color: COLORS.white,
  },

  // Member Card
  memberCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  memberNumber: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  riskBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  riskBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  
  // Input Row
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputHalf: {
    flex: 1,
  },
  
  // Gender Buttons
  genderButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  genderButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  genderText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  genderTextActive: {
    color: COLORS.white,
  },
  
  // Auto Risk Banner
  autoRiskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#fef3c7',
    padding: SPACING.sm,
    borderRadius: RADIUS.base,
    marginTop: SPACING.sm,
  },
  autoRiskText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  
  // Risk Chips
  riskChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  riskChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  riskChipActive: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  riskChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
  },
  
  // Sickness Section
  sicknessSection: {
    backgroundColor: '#fef2f2',
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  sicknessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.base,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sicknessBannerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  
  // Symptoms Grid
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  symptomChip: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xs,
  },
  symptomChipActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  symptomIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  symptomLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  
  // Duration Buttons
  durationButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  durationTextActive: {
    color: COLORS.white,
  },
  
  // Severity Buttons
  severityButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  severityButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  severityIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  severityTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  
  // Risk Assessment (Step 5)
  riskAssessment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  riskIcon: {
    fontSize: 40,
  },
  riskInfo: {
    flex: 1,
  },
  riskLevel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  riskAction: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  
  // Summary Sections
  summarySection: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  summaryContent: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  summaryText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
  
  // Member Summary
  memberSummary: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  memberSummaryName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  sickIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  sickText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  riskIndicator: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.warning,
    marginTop: SPACING.xs,
  },
  
  // Notes Card
  notesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#dbeafe',
    padding: SPACING.md,
    borderRadius: RADIUS.base,
    marginTop: SPACING.md,
  },
  notesText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.info,
    lineHeight: 18,
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
