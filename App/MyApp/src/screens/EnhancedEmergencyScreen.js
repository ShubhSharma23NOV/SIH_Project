/**
 * Enhanced Emergency Response Screen - Government of India
 * ArogyaJal - Water Health Initiative
 * Emergency features with SOS, live risk detection, and health reporting
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard } from '../components/gov';
import Icon from '../components/Icon';
import EnhancedEmergencyService from '../services/EnhancedEmergencyService';
import LocationService from '../services/LocationService';
import NetworkService from '../services/NetworkService';

export default function EnhancedEmergencyScreen({ navigation }) {
  // Location & Network
  const [gpsLocation, setGpsLocation] = useState({ lat: null, long: null });
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  // Risk Detection
  const [waterRiskLevel, setWaterRiskLevel] = useState('safe');
  const [suggestedActions, setSuggestedActions] = useState([]);

  // PHC & Ambulance
  const [nearestPHC, setNearestPHC] = useState(null);
  const [ambulanceETA, setAmbulanceETA] = useState('Calculating...');

  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  // Escalation
  const [escalationTimer, setEscalationTimer] = useState(null);
  const [escalationCountdown, setEscalationCountdown] = useState(0);
  const [isEscalating, setIsEscalating] = useState(false);

  // Modals
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  // Animations
  const sosPulse = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeScreen();
    
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // SOS button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sosPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Network monitoring
    const handleNetworkChange = (state) => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        syncOfflineData();
      }
    };
    const unsubscribeNetwork = NetworkService.addListener(handleNetworkChange);

    return () => {
      unsubscribeNetwork();
      if (escalationTimer) {
        clearInterval(escalationTimer);
      }
    };
  }, []);

  // Escalation countdown effect
  useEffect(() => {
    if (escalationCountdown > 0 && isEscalating) {
      const timer = setTimeout(() => {
        setEscalationCountdown(escalationCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (escalationCountdown === 0 && isEscalating) {
      handleAutoEscalation();
    }
  }, [escalationCountdown, isEscalating]);

  const initializeScreen = async () => {
    setLoading(true);
    try {
      // Check network status
      const online = await NetworkService.isOnline();
      setIsOnline(online);

      // Get GPS location
      const location = await LocationService.getCurrentLocation();
      setGpsLocation(location);

      // Load emergency contacts
      const contactsData = await EnhancedEmergencyService.getEmergencyContacts('user123');
      setEmergencyContacts(contactsData.contacts || []);

      if (online && location.lat) {
        // Detect risk level
        const riskData = await EnhancedEmergencyService.detectRiskLevel(location);
        setWaterRiskLevel(riskData.riskLevel);
        setSuggestedActions(riskData.suggestedActions || []);

        // Get nearest PHC
        const phcData = await EnhancedEmergencyService.getNearestPHC(location);
        setNearestPHC(phcData);
        
        if (phcData) {
          calculateAmbulanceETA(phcData.distance);
        }
      }
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAmbulanceETA = (distance) => {
    const distanceKm = parseFloat(distance);
    const avgSpeed = 40; // km/h
    const eta = (distanceKm / avgSpeed) * 60; // minutes
    setAmbulanceETA(`${Math.round(eta)} mins`);
  };

  const syncOfflineData = async () => {
    // TODO: Implement offline data sync
    console.log('Syncing offline data...');
  };

  const handleSOSPress = () => {
    const primaryContact = emergencyContacts[0];
    if (!primaryContact) {
      Alert.alert('Error', 'No emergency contacts available');
      return;
    }

    Alert.alert(
      'Call ASHA Worker',
      `Do you want to call ${primaryContact.name} immediately?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            Linking.openURL(`tel:${primaryContact.phone}`);
            startEscalationTimer();
          },
        },
      ]
    );
  };

  const handleSOSLongPress = async () => {
    const alertData = {
      userId: 'user123',
      userPhone: '+919876543210',
      type: 'sos',
      latitude: gpsLocation.lat,
      longitude: gpsLocation.long,
      riskLevel: waterRiskLevel,
      contacts: emergencyContacts.map(c => c.phone),
      timestamp: Date.now(),
    };

    const result = await EnhancedEmergencyService.sendEmergencyAlert(alertData);
    
    if (result.success) {
      Alert.alert(
        '🚨 Emergency Alert Sent!',
        `Alert with GPS location sent to:\n${emergencyContacts.map(c => `• ${c.name}`).join('\n')}\n\nLocation: ${gpsLocation.lat}, ${gpsLocation.long}`,
        [{ text: 'OK' }]
      );
      startEscalationTimer();
    } else {
      Alert.alert('Error', 'Failed to send emergency alert');
    }
  };

  const startEscalationTimer = () => {
    setIsEscalating(true);
    setEscalationCountdown(300); // 5 minutes
  };

  const handleAutoEscalation = () => {
    const supervisor = emergencyContacts.find(c => c.role === 'Secondary');
    if (supervisor) {
      Alert.alert(
        '⏰ Auto-Escalation',
        `ASHA worker did not respond. Calling ${supervisor.name} now.`,
        [
          {
            text: 'Call Supervisor',
            onPress: () => Linking.openURL(`tel:${supervisor.phone}`),
          },
        ]
      );
    }
    setIsEscalating(false);
  };

  const cancelEscalation = () => {
    setIsEscalating(false);
    setEscalationCountdown(0);
    Alert.alert('Escalation Cancelled', 'Emergency escalation has been cancelled');
  };

  const handleQuickSymptomReport = () => {
    setShowSymptomModal(true);
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const submitSymptomReport = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Error', 'Please select at least one symptom');
      return;
    }

    const result = await EnhancedEmergencyService.submitSymptomReport(
      selectedSymptoms,
      gpsLocation,
      2
    );

    if (result.reportId) {
      Alert.alert(
        'Symptom Report Submitted',
        `Reported: ${selectedSymptoms.join(', ')}\n\n${result.message}`,
        [{ text: 'OK', onPress: () => {
          setShowSymptomModal(false);
          setSelectedSymptoms([]);
        }}]
      );
    }
  };

  const handlePhotoUpload = () => {
    // TODO: Implement image picker
    Alert.alert(
      'Photo Upload',
      'Camera feature will be available when react-native-image-picker is installed',
      [{ text: 'OK' }]
    );
  };

  const handleWhatsAppAlert = () => {
    const message = `🚨 EMERGENCY ALERT\nLocation: ${gpsLocation.lat}, ${gpsLocation.long}\nWater Risk: ${waterRiskLevel.toUpperCase()}\nImmediate assistance required!`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}&phone=+919876543210`);
  };

  const getRiskColor = () => {
    switch (waterRiskLevel) {
      case 'safe': return COLORS.success;
      case 'caution': return COLORS.warning;
      case 'contaminated': return COLORS.danger;
      default: return COLORS.textMedium;
    }
  };

  const getRiskIcon = () => {
    switch (waterRiskLevel) {
      case 'safe': return 'waterSafe';
      case 'caution': return 'warning';
      case 'contaminated': return 'waterUnsafe';
      default: return 'water';
    }
  };

  const getRiskLabel = () => {
    switch (waterRiskLevel) {
      case 'safe': return 'Safe • सुरक्षित';
      case 'caution': return 'Caution • सावधानी';
      case 'contaminated': return 'Contaminated • दूषित';
      default: return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GovHeader
        title="Emergency Response"
        subtitle="आपातकालीन प्रतिक्रिया"
        showBack
        onBackPress={() => navigation.navigate('AshaDashboard')}
      />

      {/* Tricolor */}
      <View style={styles.tricolor}>
        <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Big Red SOS Button */}
          <GovCard style={styles.sosCard}>
            <Text style={styles.sosTitle}>Emergency SOS</Text>
            <Text style={styles.sosTitleHindi}>आपातकालीन एसओएस</Text>
            
            <Animated.View style={{ transform: [{ scale: sosPulse }] }}>
              <TouchableOpacity
                style={styles.sosButton}
                onPress={handleSOSPress}
                onLongPress={handleSOSLongPress}
                activeOpacity={0.8}
              >
                <Icon name="sos" size={64} color={COLORS.white} />
                <Text style={styles.sosButtonText}>SOS</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.sosInstructions}>
              <View style={styles.instructionRow}>
                <Icon name="phone" size={16} color={COLORS.textMedium} />
                <Text style={styles.instructionText}>Tap: Call ASHA Worker</Text>
              </View>
              <View style={styles.instructionRow}>
                <Icon name="emergency" size={16} color={COLORS.textMedium} />
                <Text style={styles.instructionText}>Hold: Send Emergency Alert</Text>
              </View>
            </View>

            <View style={styles.gpsInfo}>
              <Icon name="gps" size={16} color={COLORS.textLight} />
              <Text style={styles.gpsText}>
                GPS: {gpsLocation.lat || 'Loading...'}, {gpsLocation.long || 'Loading...'}
              </Text>
            </View>
          </GovCard>

          {/* Escalation Timer */}
          {isEscalating && (
            <GovCard style={styles.escalationCard}>
              <View style={styles.escalationHeader}>
                <Icon name="clock" size={24} color={COLORS.warning} />
                <View style={styles.escalationInfo}>
                  <Text style={styles.escalationTitle}>Auto-Escalation Active</Text>
                  <Text style={styles.escalationSubtitle}>
                    Escalates to Supervisor in {Math.floor(escalationCountdown / 60)}:{(escalationCountdown % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEscalation}>
                <Text style={styles.cancelButtonText}>Cancel Escalation</Text>
              </TouchableOpacity>
            </GovCard>
          )}

          {/* Live Risk Detection */}
          <GovCard style={styles.riskCard}>
            <View style={styles.riskHeader}>
              <Icon name="shield" size={24} color={getRiskColor()} />
              <View style={styles.riskTitleContainer}>
                <Text style={styles.riskTitle}>Live Water Risk Status</Text>
                <Text style={styles.riskTitleHindi}>लाइव जल जोखिम स्थिति</Text>
              </View>
            </View>

            <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor()}20` }]}>
              <Icon name={getRiskIcon()} size={32} color={getRiskColor()} />
              <Text style={[styles.riskLevel, { color: getRiskColor() }]}>
                {getRiskLabel()}
              </Text>
            </View>

            {waterRiskLevel === 'contaminated' && (
              <View style={styles.riskAlert}>
                <Icon name="warning" size={20} color={COLORS.danger} />
                <Text style={styles.riskAlertText}>
                  Boil water before drinking. Avoid direct consumption.
                </Text>
              </View>
            )}
          </GovCard>

          {/* Mini Heatmap */}
          <GovCard style={styles.mapCard}>
            <TouchableOpacity
              style={styles.mapHeader}
              onPress={() => setShowHeatmap(!showHeatmap)}
            >
              <Icon name="map" size={24} color={COLORS.primary} />
              <Text style={styles.mapTitle}>Area Map • क्षेत्र मानचित्र</Text>
              <Icon
                name={showHeatmap ? 'chevronUp' : 'chevronDown'}
                size={20}
                color={COLORS.textMedium}
              />
            </TouchableOpacity>

            {showHeatmap && (
              <View style={styles.mapContent}>
                <View style={styles.mapPlaceholder}>
                  <Icon name="mapMarker" size={48} color={COLORS.primary} />
                  <Text style={styles.mapPlaceholderText}>Your Location</Text>
                  <Text style={styles.mapPlaceholderSubtext}>
                    Nearest PHC: {nearestPHC.distance}
                  </Text>
                </View>
                <View style={styles.mapLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                    <Text style={styles.legendText}>Your Location</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                    <Text style={styles.legendText}>PHC</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
                    <Text style={styles.legendText}>Danger Zone</Text>
                  </View>
                </View>
              </View>
            )}
          </GovCard>

          {/* PHC & Ambulance Info */}
          <GovCard style={styles.phcCard}>
            <View style={styles.phcHeader}>
              <Icon name="hospital" size={24} color={COLORS.primary} />
              <View style={styles.phcTitleContainer}>
                <Text style={styles.phcTitle}>Nearest PHC</Text>
                <Text style={styles.phcTitleHindi}>निकटतम पीएचसी</Text>
              </View>
            </View>

            {loading ? (
              <Text style={styles.loadingText}>Loading PHC information...</Text>
            ) : nearestPHC ? (
              <>
                <Text style={styles.phcName}>{nearestPHC.name}</Text>
                <Text style={styles.phcDistance}>📍 {nearestPHC.distance} away</Text>

                <View style={styles.phcStats}>
                  <View style={styles.phcStat}>
                    <Icon name="hospital" size={20} color={COLORS.success} />
                    <Text style={styles.phcStatValue}>{nearestPHC.bedsAvailable || nearestPHC.beds}</Text>
                    <Text style={styles.phcStatLabel}>Beds</Text>
                  </View>
                  <View style={styles.phcStat}>
                    <Icon name="doctor" size={20} color={COLORS.info} />
                    <Text style={styles.phcStatValue}>{nearestPHC.doctorsOnDuty || nearestPHC.doctors}</Text>
                    <Text style={styles.phcStatLabel}>Doctors</Text>
                  </View>
                  <View style={styles.phcStat}>
                    <Icon name="ambulance" size={20} color={COLORS.danger} />
                    <Text style={styles.phcStatValue}>{ambulanceETA}</Text>
                    <Text style={styles.phcStatLabel}>ETA</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => Linking.openURL(`tel:${nearestPHC.phone}`)}
                >
                  <Icon name="phone" size={20} color={COLORS.white} />
                  <Text style={styles.callButtonText}>Call PHC Now</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.errorText}>Unable to load PHC information. Please check your connection.</Text>
            )}
          </GovCard>

          {/* Communication Features */}
          <GovCard style={styles.commCard}>
            <Text style={styles.commTitle}>Quick Communication</Text>
            <Text style={styles.commTitleHindi}>त्वरित संचार</Text>

            <View style={styles.commButtons}>
              <TouchableOpacity style={styles.commButton} onPress={handleWhatsAppAlert}>
                <Icon name="message" size={24} color={COLORS.success} />
                <Text style={styles.commButtonText}>WhatsApp Alert</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.commButton} onPress={() => Alert.alert('SMS', 'Sending SMS...')}>
                <Icon name="message" size={24} color={COLORS.info} />
                <Text style={styles.commButtonText}>Send SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.commButton} onPress={() => Alert.alert('Call', 'Calling supervisor...')}>
                <Icon name="phone" size={24} color={COLORS.primary} />
                <Text style={styles.commButtonText}>Call Supervisor</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.escalationInfo}>
              <Icon name="clock" size={16} color={COLORS.warning} />
              <Text style={styles.escalationText}>
                Auto-escalates to Supervisor if no response in 5 minutes
              </Text>
            </View>
          </GovCard>

          {/* Health Reporting */}
          <GovCard style={styles.reportCard}>
            <Text style={styles.reportTitle}>Quick Health Reporting</Text>
            <Text style={styles.reportTitleHindi}>त्वरित स्वास्थ्य रिपोर्टिंग</Text>

            <View style={styles.reportButtons}>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={handleQuickSymptomReport}
              >
                <Icon name="health" size={32} color={COLORS.danger} />
                <Text style={styles.reportButtonText}>Report Symptoms</Text>
                <Text style={styles.reportButtonSubtext}>लक्षण रिपोर्ट करें</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportButton}
                onPress={handlePhotoUpload}
              >
                <Icon name="camera" size={32} color={COLORS.primary} />
                <Text style={styles.reportButtonText}>Upload Photo</Text>
                <Text style={styles.reportButtonSubtext}>फोटो अपलोड करें</Text>
              </TouchableOpacity>
            </View>
          </GovCard>

          {/* Education Section */}
          <GovCard style={styles.eduCard}>
            <View style={styles.eduHeader}>
              <Icon name="info" size={24} color={COLORS.info} />
              <Text style={styles.eduTitle}>Health & Safety Tips</Text>
            </View>

            <View style={styles.eduTips}>
              <View style={styles.eduTip}>
                <Icon name="waterBoil" size={20} color={COLORS.primary} />
                <View style={styles.eduTipContent}>
                  <Text style={styles.eduTipTitle}>Boil Water</Text>
                  <Text style={styles.eduTipText}>Boil for 10-15 minutes before drinking</Text>
                </View>
              </View>

              <View style={styles.eduTip}>
                <Icon name="waterFilter" size={20} color={COLORS.primary} />
                <View style={styles.eduTipContent}>
                  <Text style={styles.eduTipTitle}>Use Clean Storage</Text>
                  <Text style={styles.eduTipText}>Store water in covered containers</Text>
                </View>
              </View>

              <View style={styles.eduTip}>
                <Icon name="warning" size={20} color={COLORS.warning} />
                <View style={styles.eduTipContent}>
                  <Text style={styles.eduTipTitle}>Watch for Symptoms</Text>
                  <Text style={styles.eduTipText}>Diarrhea, vomiting, fever - seek help immediately</Text>
                </View>
              </View>
            </View>
          </GovCard>

          {/* Water Distribution Updates */}
          <GovCard style={styles.updatesCard}>
            <View style={styles.updatesHeader}>
              <Icon name="notification" size={24} color={COLORS.accent} />
              <Text style={styles.updatesTitle}>Water Distribution Updates</Text>
            </View>

            <View style={styles.updatesList}>
              <View style={styles.updateItem}>
                <View style={styles.updateDot} />
                <View style={styles.updateContent}>
                  <Text style={styles.updateText}>Water tanker arriving at 3:00 PM</Text>
                  <Text style={styles.updateTime}>2 hours ago</Text>
                </View>
              </View>

              <View style={styles.updateItem}>
                <View style={styles.updateDot} />
                <View style={styles.updateContent}>
                  <Text style={styles.updateText}>Pipeline repair completed in Sector 5</Text>
                  <Text style={styles.updateTime}>5 hours ago</Text>
                </View>
              </View>

              <View style={styles.updateItem}>
                <View style={styles.updateDot} />
                <View style={styles.updateContent}>
                  <Text style={styles.updateText}>Chlorination scheduled for tomorrow</Text>
                  <Text style={styles.updateTime}>1 day ago</Text>
                </View>
              </View>
            </View>
          </GovCard>

          {/* Offline Mode Indicator */}
          {!isOnline && (
            <GovCard style={styles.offlineCard}>
              <Icon name="offline" size={24} color={COLORS.textMedium} />
              <Text style={styles.offlineText}>Offline Mode</Text>
              <Text style={styles.offlineSubtext}>
                Emergency calls and SMS still available. Data will sync when online.
              </Text>
            </GovCard>
          )}
        </Animated.View>
      </ScrollView>

      {/* Symptom Report Modal */}
      <Modal
        visible={showSymptomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSymptomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Symptoms</Text>
              <TouchableOpacity onPress={() => setShowSymptomModal(false)}>
                <Icon name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select all symptoms you're experiencing:</Text>

            <ScrollView style={styles.symptomsList}>
              {[
                { id: 'vomiting', label: 'Vomiting • उल्टी', icon: 'vomit' },
                { id: 'diarrhea', label: 'Diarrhea • दस्त', icon: 'stomach' },
                { id: 'fever', label: 'Fever • बुखार', icon: 'fever' },
                { id: 'stomachPain', label: 'Stomach Pain • पेट दर्द', icon: 'stomach' },
                { id: 'nausea', label: 'Nausea • मतली', icon: 'vomit' },
                { id: 'headache', label: 'Headache • सिरदर्द', icon: 'headache' },
                { id: 'dehydration', label: 'Dehydration • निर्जलीकरण', icon: 'waterDrop' },
                { id: 'bloodInStool', label: 'Blood in Stool • मल में खून', icon: 'danger' },
              ].map(symptom => (
                <TouchableOpacity
                  key={symptom.id}
                  style={[
                    styles.symptomOption,
                    selectedSymptoms.includes(symptom.id) && styles.symptomOptionSelected,
                  ]}
                  onPress={() => toggleSymptom(symptom.id)}
                >
                  <Icon
                    name={symptom.icon}
                    size={24}
                    color={selectedSymptoms.includes(symptom.id) ? COLORS.white : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.symptomOptionText,
                      selectedSymptoms.includes(symptom.id) && styles.symptomOptionTextSelected,
                    ]}
                  >
                    {symptom.label}
                  </Text>
                  {selectedSymptoms.includes(symptom.id) && (
                    <Icon name="checkCircle" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSymptomModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  selectedSymptoms.length === 0 && styles.modalSubmitButtonDisabled,
                ]}
                onPress={submitSymptomReport}
                disabled={selectedSymptoms.length === 0}
              >
                <Text style={styles.modalSubmitText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  
  // SOS Card
  sosCard: {
    alignItems: 'center',
    backgroundColor: `${COLORS.danger}05`,
    borderWidth: 2,
    borderColor: COLORS.danger,
    marginBottom: SPACING.md,
  },
  sosTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.danger,
    marginBottom: SPACING.xs,
  },
  sosTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xl,
    marginBottom: SPACING.lg,
  },
  sosButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  sosInstructions: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  instructionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  gpsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  gpsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },

  // Risk Card
  riskCard: {
    marginBottom: SPACING.md,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  riskTitleContainer: {
    flex: 1,
  },
  riskTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  riskTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  riskLevel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  riskAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.danger}10`,
    padding: SPACING.md,
    borderRadius: RADIUS.base,
    gap: SPACING.sm,
  },
  riskAlertText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // Map Card
  mapCard: {
    marginBottom: SPACING.md,
    padding: 0,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  mapTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  mapContent: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  mapPlaceholderText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginTop: SPACING.sm,
  },
  mapPlaceholderSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
  },

  // PHC Card
  phcCard: {
    marginBottom: SPACING.md,
  },
  phcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  phcTitleContainer: {
    flex: 1,
  },
  phcTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  phcTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
  phcName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  phcDistance: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginBottom: SPACING.md,
  },
  phcStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
  },
  phcStat: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  phcStatValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  phcStatLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.danger,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    gap: SPACING.sm,
  },
  callButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },

  // Communication Card
  commCard: {
    marginBottom: SPACING.md,
  },
  commTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  commTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  commButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  commButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textDark,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  escalationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}10`,
    padding: SPACING.sm,
    borderRadius: RADIUS.base,
    gap: SPACING.xs,
  },
  escalationText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
  },

  // Report Card
  reportCard: {
    marginBottom: SPACING.md,
  },
  reportTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  reportTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  reportButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  reportButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  reportButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginTop: SPACING.sm,
  },
  reportButtonSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },

  // Education Card
  eduCard: {
    marginBottom: SPACING.md,
  },
  eduHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  eduTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  eduTips: {
    gap: SPACING.md,
  },
  eduTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  eduTipContent: {
    flex: 1,
  },
  eduTipTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  eduTipText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    lineHeight: 18,
  },

  // Updates Card
  updatesCard: {
    marginBottom: SPACING.md,
  },
  updatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  updatesTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  updatesList: {
    gap: SPACING.md,
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 6,
  },
  updateContent: {
    flex: 1,
  },
  updateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  updateTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },

  // Offline Card
  offlineCard: {
    alignItems: 'center',
    backgroundColor: `${COLORS.textMedium}10`,
    marginBottom: SPACING.xxl,
  },
  offlineText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textMedium,
    marginTop: SPACING.sm,
  },
  offlineSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Escalation Card
  escalationCard: {
    backgroundColor: `${COLORS.warning}10`,
    borderWidth: 2,
    borderColor: COLORS.warning,
    marginBottom: SPACING.md,
  },
  escalationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  escalationInfo: {
    flex: 1,
  },
  escalationTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.warning,
    marginBottom: SPACING.xs,
  },
  escalationSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.base,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.warning,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginBottom: SPACING.md,
  },
  symptomsList: {
    maxHeight: 400,
    marginBottom: SPACING.md,
  },
  symptomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  symptomOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  symptomOptionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
  },
  symptomOptionTextSelected: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
  },
  modalSubmitButton: {
    flex: 2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
