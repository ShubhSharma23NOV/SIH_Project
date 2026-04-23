import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Slider } from 'react-native';
import { Colors } from '../constants/Colors';

export default function SensorUploadScreen({ navigation }) {
  const [progress, setProgress] = useState(0.2);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const simulateFetch = () => {
    setIsLoading(true);
    setProgress(0);
    let p = 0;
    const id = setInterval(() => {
      p += 0.1;
      if (p >= 1) {
        clearInterval(id);
        setProgress(1);
        setIsLoading(false);
        setData({ turbidity: 2.1, ph: 7.2, tds: 140, tempC: 24.3 });
      } else {
        setProgress(p);
      }
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('AshaDashboard')}>
          <Text style={styles.topBack}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Upload Data</Text>
        <Text style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.deviceCard}>
          <Text style={styles.deviceIcon}>🔌</Text>
          <Text style={styles.deviceTitle}>Insert Device</Text>
          <Text style={styles.deviceSub}>Insert SD card / USB to sync sensor data.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={simulateFetch} disabled={isLoading}>
            <Text style={styles.primaryBtnText}>{isLoading ? 'Fetching...' : 'Start Sync'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sliderRow}>
          <View style={[styles.sliderTrack, { opacity: isLoading ? 1 : 0.5 }]}>
            <View style={[styles.sliderFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.loadingText}>{isLoading ? 'Loading…' : data ? 'Completed' : 'Idle'}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionTile, !data && styles.disabledTile]}
            disabled={!data}
            onPress={() => navigation && navigation.navigate && navigation.navigate('GeneratedData', { data })}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionText}>View Generated{"\n"}Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionTile} onPress={() => navigation && navigation.navigate && navigation.navigate('AshaDashboard')}>
            <Text style={styles.actionIcon}>🏠</Text>
            <Text style={styles.actionText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbff' },
  topBar: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBack: { color: 'white', fontSize: 18 },
  topTitle: { color: 'white', fontWeight: '800', fontSize: 16 },
  content: { padding: 16, paddingBottom: 40 },

  deviceCard: { backgroundColor: '#e7f7ec', borderColor: '#bbf7d0', borderWidth: 1, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24 },
  deviceIcon: { fontSize: 36, marginBottom: 10 },
  deviceTitle: { fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  deviceSub: { color: '#475569', textAlign: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  primaryBtnText: { color: 'white', fontWeight: '800' },

  sliderRow: { marginTop: 20, alignItems: 'center' },
  sliderTrack: { width: '100%', height: 6, backgroundColor: '#e5e7eb', borderRadius: 999 },
  sliderFill: { height: 6, backgroundColor: Colors.secondary, borderRadius: 999 },
  loadingText: { textAlign: 'center', marginTop: 8, fontWeight: '700', color: '#111827' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  actionTile: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginRight: 10 },
  disabledTile: { opacity: 0.5 },
  actionIcon: { fontSize: 20, marginBottom: 6 },
  actionText: { textAlign: 'center', color: '#0f172a' },
});
