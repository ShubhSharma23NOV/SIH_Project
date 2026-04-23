/**
 * Sensor Test Screen
 * Bluetooth sensor integration for automated water testing
 * Currently using dummy data - ready for real sensor integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';
import Icon from '../components/Icon';
import { saveWaterTestOffline } from '../database/operations';
import LocationService from '../services/LocationService';

// Configuration flag - set to true when real sensor is available
const USE_REAL_SENSOR = false;

// Dummy sensor data generator
const generateDummySensorData = () => ({
  ph: (6.5 + Math.random() * 2).toFixed(2),
  tds: Math.floor(100 + Math.random() * 400),
  turbidity: (1 + Math.random() * 4).toFixed(2),
  temperature: (20 + Math.random() * 10).toFixed(1),
  dissolvedOxygen: (5 + Math.random() * 4).toFixed(2),
  conductivity: Math.floor(200 + Math.random() * 600),
});

export default function SensorTestScreen({ navigation }) {
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reading, setReading] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Simulate sensor connection
  const connectToSensor = async () => {
    setScanning(true);
    
    // TODO: Replace with real Bluetooth scanning
    // Example: const devices = await BluetoothManager.scan();
    
    setTimeout(() => {
      setScanning(false);
      setConnected(true);
      Alert.alert('Connected', 'Sensor connected successfully (Demo Mode)');
    }, 2000);
  };

  // Read data from sensor
  const readSensorData = async () => {
    setReading(true);
    
    if (USE_REAL_SENSOR) {
      // TODO: Replace with real sensor reading
      // Example:
      // try {
      //   const data = await BluetoothManager.readCharacteristic(deviceId, serviceUUID, characteristicUUID);
      //   const parsed = parseSensorData(data);
      //   setSensorData(parsed);
      // } catch (error) {
      //   Alert.alert('Error', 'Failed to read sensor data');
      // }
    } else {
      // Use dummy data for demo
      setTimeout(() => {
        const dummyData = generateDummySensorData();
        setSensorData(dummyData);
        setReading(false);
      }, 1500);
    }
  };

  // Save test results
  const saveResults = async () => {
    if (!sensorData) return;

    setSaving(true);
    try {
      const location = await LocationService.getCurrentLocation();
      
      const testData = {
        sourceType: 'Sensor Test',
        sourceName: 'Automated Sensor',
        appearance: 'Clear',
        odour: 'None',
        suspendedMatter: 'None',
        pH: parseFloat(sensorData.ph),
        frc: null,
        turbidity: parseFloat(sensorData.turbidity),
        tds: parseInt(sensorData.tds),
        hardness: null,
        geogenicParameter: null,
        rainfall24h: 'No',
        nearbyRiskActivity: [],
        chlorination: 'Unknown',
        storageMethod: 'N/A',
        photoPath: null,
        riskLevel: calculateRiskLevel(sensorData),
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        reporterId: 'sensor_auto',
        reporterType: 'ASHA',
      };

      await saveWaterTestOffline(testData);
      
      Alert.alert(
        'Success',
        'Water test saved successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving test:', error);
      Alert.alert('Error', 'Failed to save test results');
    } finally {
      setSaving(false);
    }
  };

  // Calculate risk level based on parameters
  const calculateRiskLevel = (data) => {
    const ph = parseFloat(data.ph);
    const tds = parseInt(data.tds);
    const turbidity = parseFloat(data.turbidity);

    if (ph < 6.5 || ph > 8.5 || tds > 500 || turbidity > 5) {
      return 'high';
    } else if (ph < 7 || ph > 8 || tds > 300 || turbidity > 3) {
      return 'medium';
    }
    return 'low';
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return COLORS.danger;
      case 'medium': return COLORS.warning;
      default: return COLORS.success;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Sensor Water Test"
        subtitle="Bluetooth sensor testing • ब्लूटूथ सेंसर परीक्षण"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!connected ? (
          <>
            <View style={styles.iconContainer}>
              <Icon name="bluetooth" size={80} color={COLORS.accent} />
            </View>

            <Text style={styles.title}>Connect Sensor</Text>
            <Text style={styles.subtitle}>सेंसर कनेक्ट करें</Text>

            <GovCard style={styles.infoCard}>
              <Text style={styles.infoTitle}>📱 Demo Mode Active</Text>
              <Text style={styles.infoText}>
                Using simulated sensor data for demonstration. Connect a real Bluetooth water quality sensor for actual readings.
              </Text>
              <Text style={styles.infoTextHindi}>
                प्रदर्शन के लिए सिम्युलेटेड सेंसर डेटा का उपयोग कर रहे हैं। वास्तविक रीडिंग के लिए ब्लूटूथ सेंसर कनेक्ट करें।
              </Text>
            </GovCard>

            <GovButton
              title={scanning ? "Scanning..." : "Connect Sensor"}
              subtitle="सेंसर कनेक्ट करें"
              onPress={connectToSensor}
              disabled={scanning}
              loading={scanning}
              fullWidth
            />

            <GovButton
              title="Use Manual Test"
              subtitle="मैनुअल परीक्षण का उपयोग करें"
              onPress={() => navigation.navigate('ManualWaterTest')}
              variant="secondary"
              fullWidth
              style={{ marginTop: SPACING.md }}
            />
          </>
        ) : (
          <>
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Sensor Connected</Text>
            </View>

            {!sensorData ? (
              <>
                <View style={styles.iconContainer}>
                  <Icon name="waterTest" size={80} color={COLORS.secondary} />
                </View>

                <Text style={styles.title}>Ready to Test</Text>
                <Text style={styles.subtitle}>परीक्षण के लिए तैयार</Text>

                <GovCard style={styles.instructionCard}>
                  <Text style={styles.instructionTitle}>Instructions:</Text>
                  <Text style={styles.instructionItem}>1. Place sensor in water sample</Text>
                  <Text style={styles.instructionItem}>2. Wait for readings to stabilize</Text>
                  <Text style={styles.instructionItem}>3. Tap "Start Reading" button</Text>
                </GovCard>

                <GovButton
                  title={reading ? "Reading..." : "Start Reading"}
                  subtitle="रीडिंग शुरू करें"
                  onPress={readSensorData}
                  disabled={reading}
                  loading={reading}
                  fullWidth
                />
              </>
            ) : (
              <>
                <Text style={styles.resultsTitle}>Test Results</Text>
                <Text style={styles.resultsSubtitle}>परीक्षण परिणाम</Text>

                <GovCard style={styles.resultsCard}>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>pH Level</Text>
                    <Text style={styles.parameterValue}>{sensorData.ph}</Text>
                  </View>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>TDS (ppm)</Text>
                    <Text style={styles.parameterValue}>{sensorData.tds}</Text>
                  </View>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>Turbidity (NTU)</Text>
                    <Text style={styles.parameterValue}>{sensorData.turbidity}</Text>
                  </View>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>Temperature (°C)</Text>
                    <Text style={styles.parameterValue}>{sensorData.temperature}</Text>
                  </View>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>Dissolved O₂ (mg/L)</Text>
                    <Text style={styles.parameterValue}>{sensorData.dissolvedOxygen}</Text>
                  </View>
                  <View style={styles.parameterRow}>
                    <Text style={styles.parameterLabel}>Conductivity (μS/cm)</Text>
                    <Text style={styles.parameterValue}>{sensorData.conductivity}</Text>
                  </View>
                </GovCard>

                <GovCard style={[styles.riskCard, { borderLeftColor: getRiskColor(calculateRiskLevel(sensorData)) }]}>
                  <Text style={styles.riskLabel}>Risk Assessment:</Text>
                  <Text style={[styles.riskValue, { color: getRiskColor(calculateRiskLevel(sensorData)) }]}>
                    {calculateRiskLevel(sensorData).toUpperCase()}
                  </Text>
                </GovCard>

                <GovButton
                  title={saving ? "Saving..." : "Save Results"}
                  subtitle="परिणाम सहेजें"
                  onPress={saveResults}
                  disabled={saving}
                  loading={saving}
                  fullWidth
                />

                <GovButton
                  title="Test Again"
                  subtitle="फिर से परीक्षण करें"
                  onPress={() => setSensorData(null)}
                  variant="secondary"
                  fullWidth
                  style={{ marginTop: SPACING.md }}
                />
              </>
            )}
          </>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  infoCard: {
    width: '100%',
    backgroundColor: `${COLORS.info}10`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  infoTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    marginBottom: SPACING.xl,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.xs,
  },
  connectedText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  instructionCard: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  instructionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  instructionItem: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
  resultsTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  resultsSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  resultsCard: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  parameterLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
  },
  parameterValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  riskCard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    marginBottom: SPACING.xl,
  },
  riskLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  riskValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
