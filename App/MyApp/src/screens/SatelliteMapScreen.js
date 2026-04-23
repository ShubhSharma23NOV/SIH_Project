/**
 * Satellite Map Screen
 * Leaflet-based interactive map with cluster markers
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { GovHeader } from '../components/gov';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme';

const { width, height } = Dimensions.get('window');

export default function SatelliteMapScreen({ navigation, route }) {
  const { clusters = [], userLocation } = route?.params || {};
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(true);

  // Use actual user location or show message if not available
  const lat = userLocation?.latitude;
  const lon = userLocation?.longitude;

  if (!lat || !lon) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <GovHeader
          title="Satellite Map"
          subtitle="GPS-based clustering"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>📍 Location not available</Text>
          <Text style={styles.errorSubtext}>Please enable GPS and try again</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Generate HTML with Leaflet map
  const generateMapHTML = () => {
    const clustersJSON = JSON.stringify(clusters.map(c => ({
      lat: c.latitude,
      lon: c.longitude,
      count: c.count,
      severity: c.severity,
      symptoms: c.symptoms.slice(0, 2).join(', '),
    })));

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100vw; height: 100vh; }
    .cluster-marker {
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 14px;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
    }
    .cluster-low { background-color: #22c55e; }
    .cluster-medium { background-color: #f59e0b; }
    .cluster-high { background-color: #ef4444; }
    .user-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #2563eb;
      border: 5px solid white;
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Initialize map
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([${lat}, ${lon}], 14);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add user location marker
    const userIcon = L.divIcon({
      className: 'user-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([${lat}, ${lon}], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Your Location</b><br>आपका स्थान');

    // Add 1km radius circle
    L.circle([${lat}, ${lon}], {
      color: '#0ea5e9',
      fillColor: '#0ea5e9',
      fillOpacity: 0.1,
      radius: 1000,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(map);

    // Add cluster markers
    const clusters = ${clustersJSON};
    
    clusters.forEach(cluster => {
      const size = cluster.count >= 10 ? 50 : cluster.count >= 5 ? 35 : 25;
      const severityClass = 'cluster-' + cluster.severity;
      
      const clusterIcon = L.divIcon({
        className: 'cluster-marker ' + severityClass,
        html: '<div>' + cluster.count + '</div>',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });

      L.marker([cluster.lat, cluster.lon], { icon: clusterIcon })
        .addTo(map)
        .bindPopup(
          '<b>Cluster</b><br>' +
          'Cases: ' + cluster.count + '<br>' +
          'Severity: ' + cluster.severity + '<br>' +
          'Symptoms: ' + cluster.symptoms
        );
    });

    // Add legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = 
        '<div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">' +
        '<div style="margin-bottom: 5px;"><span style="display: inline-block; width: 12px; height: 12px; background: #22c55e; border-radius: 50%; margin-right: 5px;"></span> Low</div>' +
        '<div style="margin-bottom: 5px;"><span style="display: inline-block; width: 12px; height: 12px; background: #f59e0b; border-radius: 50%; margin-right: 5px;"></span> Medium</div>' +
        '<div><span style="display: inline-block; width: 12px; height: 12px; background: #ef4444; border-radius: 50%; margin-right: 5px;"></span> High</div>' +
        '</div>';
      return div;
    };
    legend.addTo(map);
  </script>
</body>
</html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Satellite Map View"
        subtitle="Interactive map • इंटरैक्टिव मानचित्र"
        onBack={() => navigation.goBack()}
      />

      {/* Summary Panel */}
      {showSummary && (
        <View style={styles.summaryPanel}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>🗺️ Map Info</Text>
            <TouchableOpacity onPress={() => setShowSummary(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Location:</Text>
              <Text style={styles.summaryValue}>
                {lat.toFixed(4)}, {lon.toFixed(4)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Clusters:</Text>
              <Text style={styles.summaryValue}>{clusters.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Radius:</Text>
              <Text style={styles.summaryValue}>1 km</Text>
            </View>
          </View>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        <WebView
          source={{ html: generateMapHTML() }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>

      {/* Show Summary Button */}
      {!showSummary && (
        <TouchableOpacity
          style={styles.showSummaryButton}
          onPress={() => setShowSummary(true)}
        >
          <Text style={styles.showSummaryButtonText}>ℹ️</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  errorSubtext: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  summaryPanel: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  closeButton: {
    fontSize: 20,
    color: COLORS.textMedium,
    padding: 4,
  },
  summaryContent: {
    gap: SPACING.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  mapContainer: {
    flex: 1,
    margin: SPACING.md,
    marginTop: 0,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
  },
  showSummaryButton: {
    position: 'absolute',
    top: 80,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  showSummaryButtonText: {
    fontSize: 24,
  },
});
