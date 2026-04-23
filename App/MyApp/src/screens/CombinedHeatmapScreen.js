/**
 * Combined Heatmap Screen - GPS-Based Clustering
 * Real-time symptom and water quality visualization with 1km radius
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  StatusBar,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme';
import { getAllWaterTests } from '../database/operations';
import LocationService from '../services/LocationService';

const { width, height } = Dimensions.get('window');
const MAP_SIZE = width - 32;
const CLUSTER_RADIUS_M = 250; // 250 meter clusters

export default function CombinedHeatmapScreen({ navigation }) {
  // View mode state
  const [viewMode, setViewMode] = useState('heatmap');
  const [isOnline, setIsOnline] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // User location (will be updated with actual GPS)
  const [userLocation, setUserLocation] = useState(null);

  // Data state
  const [reports, setReports] = useState([]);
  const [waterTests, setWaterTests] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [timeFilter, setTimeFilter] = useState('7days');
  const [symptomFilter, setSymptomFilter] = useState('all');
  const [dataSource, setDataSource] = useState('combined');

  // Summary stats
  const [stats, setStats] = useState({
    totalCases: 0,
    highRiskClusters: 0,
    mostCommonSymptom: 'N/A',
    worstWaterSource: 'N/A',
    lastUpdated: 'N/A',
  });

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for the heatmap.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          setLocationLoading(false);
        }
      } else {
        getCurrentLocation();
      }
    } catch (err) {
      console.warn('Location permission error:', err);
      setLocationLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getLocation({ accuracy: 'high', timeout: 45000 });
      console.log(`📍 Got location:`, location.latitude, location.longitude);
      setUserLocation({ latitude: location.latitude, longitude: location.longitude });
      setLocationLoading(false);
    } catch (error) {
      console.error('GPS Error:', error);
      setLocationLoading(false);
    }
  };

  // Load data from SQLite
  const loadData = async () => {
    try {
      // Load actual health reports from database
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const surveysData = await AsyncStorage.getItem('pending_household_surveys');
      const surveys = JSON.parse(surveysData || '[]');
      
      // Extract health reports from household surveys
      const healthReports = [];
      surveys.forEach(survey => {
        console.log('📍 Survey GPS:', survey.gpsLocation);
        
        if (survey.members && Array.isArray(survey.members)) {
          survey.members.forEach(member => {
            if (member.isSick && member.symptoms && member.symptoms.length > 0) {
              const report = {
                id: `${survey.id}_${member.id}`,
                symptoms: member.symptoms,
                timestamp: survey.createdAt,
                latitude: survey.gpsLocation?.lat || null,
                longitude: survey.gpsLocation?.long || null,
                severity: member.severity,
                householdId: survey.householdId,
                village: survey.village
              };
              console.log('📍 Health report GPS:', report.latitude, report.longitude);
              healthReports.push(report);
            }
          });
        }
      });

      // Load water tests from SQLite
      const tests = await getAllWaterTests();
      
      console.log('📊 Loaded', healthReports.length, 'health reports and', tests.length, 'water tests');

      setReports(healthReports);
      setWaterTests(tests);
    } catch (error) {
      console.error('Error loading data:', error);
      setReports([]);
      setWaterTests([]);
    }
  };

  // Haversine distance formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // GPS to canvas conversion
  const gpsToCanvas = (lat, lon) => {
    if (!userLocation) return { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
    
    const RADIUS_KM = 1;
    const RADIUS_M = RADIUS_KM * 1000;
    const distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lon);
    const clampedDistance = Math.min(distance, RADIUS_M);

    const dLon = (lon - userLocation.longitude) * Math.PI / 180;
    const lat1 = userLocation.latitude * Math.PI / 180;
    const lat2 = lat * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = Math.atan2(y, x);

    const canvasRadius = (MAP_SIZE / 2) - 40;
    const normalizedDistance = (clampedDistance / RADIUS_M) * canvasRadius;
    const canvasX = MAP_SIZE / 2 + normalizedDistance * Math.sin(bearing);
    const canvasY = MAP_SIZE / 2 - normalizedDistance * Math.cos(bearing);

    return { x: canvasX, y: canvasY };
  };

  // Create clusters
  const createClusters = (data) => {
    console.log('🗺️ Creating clusters from', data.length, 'items');
    if (data.length === 0) return [];

    const newClusters = [];
    const processed = new Set();

    // Only use data that has actual GPS coordinates
    const dataWithGPS = data.filter(item => item.latitude && item.longitude);

    dataWithGPS.forEach((item, index) => {
      if (processed.has(index)) return;

      const cluster = {
        id: `cluster-${newClusters.length}`,
        count: 1,
        symptoms: Array.isArray(item.symptoms) ? item.symptoms : (item.symptoms ? [item.symptoms] : []),
        lastReport: item.timestamp || item.testDate || item.createdAt,
        items: [item],
        hasWaterRisk: item.riskLevel && item.riskLevel.toLowerCase() === 'high',
        latitude: item.latitude,
        longitude: item.longitude,
      };

      dataWithGPS.forEach((otherItem, otherIndex) => {
        if (otherIndex !== index && !processed.has(otherIndex)) {
          const distance = calculateDistance(item.latitude, item.longitude, otherItem.latitude, otherItem.longitude);
          if (distance <= CLUSTER_RADIUS_M) {
            cluster.count++;
            if (otherItem.symptoms) {
              if (Array.isArray(otherItem.symptoms)) {
                cluster.symptoms.push(...otherItem.symptoms);
              } else {
                cluster.symptoms.push(otherItem.symptoms);
              }
            }
            if (otherItem.riskLevel && otherItem.riskLevel.toLowerCase() === 'high') {
              cluster.hasWaterRisk = true;
            }
            cluster.items.push(otherItem);
            processed.add(otherIndex);
          }
        }
      });

      processed.add(index);

      if (cluster.count >= 5 || cluster.hasWaterRisk) {
        cluster.severity = 'high';
      } else if (cluster.count >= 3) {
        cluster.severity = 'medium';
      } else {
        cluster.severity = 'low';
      }

      const position = gpsToCanvas(cluster.latitude, cluster.longitude);
      cluster.x = position.x;
      cluster.y = position.y;

      newClusters.push(cluster);
    });

    console.log('✅ Created', newClusters.length, 'clusters');
    return newClusters;
  };

  // Process data with filters
  const processData = () => {
    const now = new Date();
    let filteredReports = reports;
    let filteredTests = waterTests;

    if (timeFilter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filteredReports = reports.filter(r => new Date(r.timestamp || r.createdAt) >= todayStart);
      filteredTests = waterTests.filter(t => new Date(t.createdAt) >= todayStart);
    } else if (timeFilter === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredReports = reports.filter(r => new Date(r.timestamp || r.createdAt) >= weekAgo);
      filteredTests = waterTests.filter(t => new Date(t.createdAt) >= weekAgo);
    } else if (timeFilter === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredReports = reports.filter(r => new Date(r.timestamp || r.createdAt) >= monthAgo);
      filteredTests = waterTests.filter(t => new Date(t.createdAt) >= monthAgo);
    }

    if (symptomFilter !== 'all') {
      filteredReports = filteredReports.filter(r => {
        if (!r.symptoms) return false;
        if (Array.isArray(r.symptoms)) {
          return r.symptoms.some(s => s.toLowerCase().includes(symptomFilter));
        }
        return r.symptoms.toLowerCase().includes(symptomFilter);
      });
    }

    let dataToProcess = [];
    if (dataSource === 'symptoms' || dataSource === 'combined') {
      dataToProcess = [...filteredReports];
    }
    if (dataSource === 'water' || dataSource === 'combined') {
      dataToProcess = [...dataToProcess, ...filteredTests];
    }

    const newClusters = createClusters(dataToProcess);
    setClusters(newClusters);
    calculateStats(filteredReports, filteredTests, newClusters);
  };

  // Calculate statistics
  const calculateStats = (filteredReports, filteredTests, newClusters) => {
    const totalCases = filteredReports.length + filteredTests.length;
    const highRiskClusters = newClusters.filter(c => c.severity === 'high').length;

    const allSymptoms = filteredReports.filter(r => r.symptoms)
      .flatMap(r => Array.isArray(r.symptoms) ? r.symptoms : [r.symptoms])
      .map(s => s.toLowerCase());
    
    const symptomCounts = {};
    allSymptoms.forEach(s => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });

    const mostCommon = Object.keys(symptomCounts).length > 0
      ? Object.keys(symptomCounts).reduce((a, b) => symptomCounts[a] > symptomCounts[b] ? a : b)
      : 'N/A';

    const worstWater = filteredTests.find(t => t.riskLevel && t.riskLevel.toLowerCase() === 'high');

    const lastUpdate = filteredReports.length > 0
      ? new Date(filteredReports[0].timestamp || filteredReports[0].createdAt).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';

    setStats({
      totalCases,
      highRiskClusters,
      mostCommonSymptom: mostCommon !== 'N/A' ? mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1) : 'N/A',
      worstWaterSource: worstWater ? worstWater.sourceName || 'Unknown' : 'None detected',
      lastUpdated: lastUpdate,
    });
  };

  // Helper functions
  const getClusterColor = (severity) => {
    if (severity === 'high') return '#ef4444';
    if (severity === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  const getClusterSize = (count) => {
    if (count >= 10) return 50;
    if (count >= 5) return 35;
    return 25;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now - date) / 3600000);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return 'N/A';
    }
  };

  // Effects
  useEffect(() => {
    requestLocationPermission();
    loadData();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing heatmap data...');
      loadData();
    }, 5000);

    return () => {
      clearInterval(refreshInterval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (reports.length > 0 || waterTests.length > 0) {
      processData();
    }
  }, [reports, waterTests, timeFilter, symptomFilter, dataSource]);

  // Render heatmap visualization
  const renderSimpleHeatmap = () => (
    <View style={styles.heatmapContainer}>
      <View style={styles.heatmapHeader}>
        <Text style={styles.heatmapTitle}>📍 1 km Radius View</Text>
        <Text style={styles.heatmapSubtitle}>
          {clusters.length} cluster{clusters.length !== 1 ? 's' : ''} • GPS-based
        </Text>
      </View>

      <View style={styles.mapArea}>
        <View style={styles.mapBackground}>
          <View style={[styles.radiusCircle, {
            width: MAP_SIZE - 4,
            height: MAP_SIZE - 4,
            borderRadius: (MAP_SIZE - 4) / 2,
            borderWidth: 2,
            borderColor: '#cbd5e1',
          }]} />
          <View style={[styles.radiusCircle, {
            width: MAP_SIZE * 0.66,
            height: MAP_SIZE * 0.66,
            borderRadius: (MAP_SIZE * 0.66) / 2,
            borderWidth: 1.5,
            borderColor: '#e2e8f0',
          }]} />
          <View style={[styles.radiusCircle, {
            width: MAP_SIZE * 0.33,
            height: MAP_SIZE * 0.33,
            borderRadius: (MAP_SIZE * 0.33) / 2,
            borderWidth: 1.5,
            borderColor: '#e2e8f0',
          }]} />
          <Text style={[styles.distanceLabel, { top: 8, left: MAP_SIZE/2 - 18 }]}>1 km</Text>
          <Text style={[styles.distanceLabel, { top: MAP_SIZE * 0.17, left: MAP_SIZE/2 - 22 }]}>660 m</Text>
          <Text style={[styles.distanceLabel, { top: MAP_SIZE * 0.33, left: MAP_SIZE/2 - 22 }]}>330 m</Text>
        </View>

        <View style={styles.userMarker}>
          <View style={styles.userDotOuter}>
            <View style={styles.userDot} />
          </View>
          <Text style={styles.userLabel}>You</Text>
        </View>

        {clusters.map((cluster) => {
          const size = getClusterSize(cluster.count);
          const color = getClusterColor(cluster.severity);
          return (
            <View key={cluster.id} style={{
              position: 'absolute',
              left: cluster.x - size / 2,
              top: cluster.y - size / 2,
            }}>
              {cluster.severity === 'high' && (
                <View style={[styles.clusterPulse, {
                  width: size + 16,
                  height: size + 16,
                  borderRadius: (size + 16) / 2,
                  borderColor: color,
                  left: -8,
                  top: -8,
                }]} />
              )}
              <TouchableOpacity
                style={[styles.clusterDot, {
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderColor: '#ffffff',
                  borderWidth: 3,
                }]}
                onPress={() => setSelectedCluster(cluster)}
                activeOpacity={0.7}
              >
                <Text style={styles.clusterCount}>{cluster.count}</Text>
                {cluster.hasWaterRisk && (
                  <View style={styles.waterRiskBadge}>
                    <Text style={styles.waterRiskIcon}>💧</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.compass}>
          <Text style={styles.compassText}>N</Text>
          <Text style={styles.compassArrow}>↑</Text>
        </View>

        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>Low</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Med</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Symptom Heatmap"
        subtitle="GPS-based clustering • GPS-आधारित क्लस्टरिंग"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, viewMode === 'heatmap' && styles.modeButtonActive]}
            onPress={() => setViewMode('heatmap')}
          >
            <Text style={[styles.modeButtonText, viewMode === 'heatmap' && styles.modeButtonTextActive]}>
              📍 Heatmap
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, viewMode === 'satellite' && styles.modeButtonActive]}
            onPress={() => {
              if (!isOnline) {
                Alert.alert(
                  '📵 No Internet Connection',
                  'Satellite view requires internet connection.',
                  [{ text: 'OK' }]
                );
              } else {
                navigation.navigate('SatelliteMap', {
                  clusters: clusters,
                  userLocation: userLocation,
                });
              }
            }}
          >
            <Text style={[styles.modeButtonText, viewMode === 'satellite' && styles.modeButtonTextActive]}>
              🛰️ Satellite
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters Button */}
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filtersButtonText}>🔍 Filters</Text>
          <Text style={styles.filtersButtonBadge}>
            {timeFilter === 'today' ? 'Today' : timeFilter === '7days' ? '7d' : '30d'}
          </Text>
        </TouchableOpacity>

        {/* Heatmap */}
        {renderSimpleHeatmap()}

        {/* Summary Panel */}
        <View style={styles.summaryPanel}>
          <Text style={styles.summaryTitle}>📊 Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.totalCases}</Text>
              <Text style={styles.summaryLabel}>Total Cases</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                {stats.highRiskClusters}
              </Text>
              <Text style={styles.summaryLabel}>High Risk</Text>
            </View>
          </View>
          <View style={styles.summaryDetails}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Most common symptom:</Text>
              <Text style={styles.summaryRowValue}>{stats.mostCommonSymptom}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Worst water source:</Text>
              <Text style={styles.summaryRowValue}>{stats.worstWaterSource}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Last updated:</Text>
              <Text style={styles.summaryRowValue}>{stats.lastUpdated}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Cluster Details Modal */}
      {selectedCluster && (
        <View style={styles.clusterInfo}>
          <View style={styles.clusterInfoHeader}>
            <View style={styles.clusterInfoTitleContainer}>
              <Text style={styles.clusterInfoTitle}>Cluster Details</Text>
              <Text style={styles.clusterInfoSubtitle}>
                ~{Math.round(calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  selectedCluster.latitude,
                  selectedCluster.longitude
                ))}m from you
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedCluster(null)}
              style={styles.closeButtonContainer}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.clusterInfoBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cases in cluster:</Text>
              <Text style={styles.infoValue}>{selectedCluster.count}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Severity:</Text>
              <View style={[styles.severityBadge, {
                backgroundColor: getClusterColor(selectedCluster.severity) + '20',
                borderColor: getClusterColor(selectedCluster.severity),
              }]}>
                <Text style={[styles.severityText, {
                  color: getClusterColor(selectedCluster.severity),
                }]}>
                  {selectedCluster.severity.toUpperCase()}
                </Text>
              </View>
            </View>
            {selectedCluster.symptoms.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Common symptoms:</Text>
                <Text style={styles.infoValue}>
                  {[...new Set(selectedCluster.symptoms)].slice(0, 2).join(', ')}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last updated:</Text>
              <Text style={styles.infoValue}>{formatDate(selectedCluster.lastReport)}</Text>
            </View>
            {selectedCluster.hasWaterRisk && (
              <View style={[styles.infoRow, styles.warningRow]}>
                <Text style={styles.infoLabel}>⚠️ Water risk:</Text>
                <Text style={[styles.infoValue, { color: '#ef4444', fontWeight: '800' }]}>
                  Detected
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filters • फ़िल्टर</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.filterModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterModalContent}>
              <Text style={styles.filterSectionTitle}>Time Range</Text>
              <View style={styles.filterOptions}>
                {['today', '7days', '30days'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterOption, timeFilter === filter && styles.filterOptionActive]}
                    onPress={() => setTimeFilter(filter)}
                  >
                    <Text style={[styles.filterOptionText, timeFilter === filter && styles.filterOptionTextActive]}>
                      {filter === 'today' ? 'Today' : filter === '7days' ? '7 Days' : '30 Days'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Symptom Type</Text>
              <View style={styles.filterOptions}>
                {['all', 'diarrhoea', 'vomiting', 'fever'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterOption, symptomFilter === filter && styles.filterOptionActive]}
                    onPress={() => setSymptomFilter(filter)}
                  >
                    <Text style={[styles.filterOptionText, symptomFilter === filter && styles.filterOptionTextActive]}>
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Data Source</Text>
              <View style={styles.filterOptions}>
                {['symptoms', 'water', 'combined'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterOption, dataSource === filter && styles.filterOptionActive]}
                    onPress={() => setDataSource(filter)}
                  >
                    <Text style={[styles.filterOptionText, dataSource === filter && styles.filterOptionTextActive]}>
                      {filter === 'symptoms' ? 'Symptoms Only' : filter === 'water' ? 'Water Tests Only' : 'Combined'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.base,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
  },
  modeButtonTextActive: {
    color: COLORS.white,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  filtersButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  filtersButtonBadge: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  heatmapContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  heatmapHeader: {
    marginBottom: SPACING.md,
  },
  heatmapTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  heatmapSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  mapArea: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#0ea5e9',
    alignSelf: 'center',
  },
  mapBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusCircle: {
    position: 'absolute',
    borderStyle: 'dashed',
  },
  distanceLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userMarker: {
    position: 'absolute',
    left: MAP_SIZE / 2 - 12,
    top: MAP_SIZE / 2 - 12,
    alignItems: 'center',
  },
  userDotOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    borderWidth: 5,
    borderColor: '#ffffff',
  },
  userLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  clusterDot: {
    position: 'absolute',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 8,
  },
  clusterCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  clusterPulse: {
    position: 'absolute',
    borderWidth: 3,
    opacity: 0.3,
  },
  waterRiskBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterRiskIcon: {
    fontSize: 10,
  },
  compass: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  compassText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  compassArrow: {
    fontSize: 16,
    color: '#ef4444',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  summaryPanel: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.base,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    padding: SPACING.base,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: 4,
  },
  summaryDetails: {
    gap: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  summaryRowValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  clusterInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  clusterInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  clusterInfoTitleContainer: {
    flex: 1,
  },
  clusterInfoTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  clusterInfoSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  closeButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    fontSize: 20,
    color: COLORS.textDark,
  },
  clusterInfoBody: {
    gap: SPACING.base,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  warningRow: {
    backgroundColor: `${COLORS.danger}10`,
    padding: SPACING.sm,
    borderRadius: RADIUS.base,
    marginTop: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: height * 0.8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterModalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  filterModalClose: {
    fontSize: 24,
    color: COLORS.textMedium,
  },
  filterModalContent: {
    padding: SPACING.lg,
  },
  filterSectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  filterOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
  },
  filterOptionTextActive: {
    color: COLORS.white,
  },
  applyFiltersButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    margin: SPACING.lg,
    borderRadius: RADIUS.base,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
