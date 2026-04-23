import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';

const MOCK_ALERTS = [
  { id: '1', type: 'Health', title: 'High CO2 Levels Detected', severity: 'Critical', icon: '❤️', place: 'Building A, Basement', time: '5 minutes ago', body: 'Urgent: Carbon Dioxide levels in the server room have exceeded safe thresholds. Immediate ventilation required to prevent equipment damage and ensure personnel safety.' },
  { id: '2', type: 'Water', title: 'Water Pressure Drop', severity: 'Warning', icon: '💧', place: 'District 7 Main Line', time: '2 hours ago', body: 'Significant drop in water pressure detected in the main distribution line impacting District 7. Potential pipe burst or major leak identified. Investigation ongoing.' },
  { id: '3', type: 'Health', title: 'Abnormal HVAC Temperature', severity: 'Acknowledged', icon: '⚠️', place: 'Warehouse C, Zone 3', time: 'Yesterday 10:30 AM', body: 'HVAC unit in Warehouse C reporting temperatures 5°C above set point for over 4 hours. Goods sensitive to heat may be at risk. Requires maintenance check.' },
  { id: '4', type: 'Water', title: 'Chlorine Levels Fluctuating', severity: 'Warning', icon: '💧', place: 'Treatment Plant 2, Output', time: 'Yesterday 4:00 PM', body: 'Automated sensors indicate inconsistent chlorine levels at Treatment Plant 2 output. Quality control measures initiated. Water remains safe but requires monitoring.' },
];

export default function AlertsScreen({ navigation }) {
  const [tab, setTab] = useState('All');
  const filter = (a) => tab === 'All' || (tab === 'Health Alerts' && a.type === 'Health') || (tab === 'Water Quality Alerts' && a.type === 'Water');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('Home')}>
          <Text style={styles.topBack}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Alerts & Notification</Text>
        <Text style={{ width: 24 }}>?</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {['All', 'Health Alerts', 'Water Quality Alerts'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {MOCK_ALERTS.filter(filter).map((a) => (
          <View key={a.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{a.icon}</Text>
              <Text style={styles.cardTitle}>{a.title}</Text>
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, a.severity === 'Critical' ? styles.badgeCritical : a.severity === 'Warning' ? styles.badgeWarning : styles.badgeOk]}>
                <Text style={styles.badgeText}>{a.severity}</Text>
              </View>
            </View>

            <View style={styles.metaRow}><Text style={styles.meta}>📍 {a.place}</Text></View>
            <View style={styles.metaRow}><Text style={styles.meta}>🕒 {a.time}</Text></View>

            <Text style={styles.body}>{a.body}</Text>

            <TouchableOpacity style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Acknowledge</Text></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>Add Follow-up</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.tabItem}><Text style={styles.tabIcon}>🏠</Text><Text style={styles.tabTextBottom}>Home</Text></View>
        <View style={styles.tabItem}><Text style={styles.tabIcon}>👤</Text><Text style={styles.tabTextBottom}>Profile</Text></View>
        <View style={styles.tabItem}><Text style={styles.tabIcon}>⚙️</Text><Text style={styles.tabTextBottom}>Settings</Text></View>
        <View style={styles.tabItem}><Text style={styles.tabIcon}>❓</Text><Text style={styles.tabTextBottom}>Help</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbff' },
  topBar: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBack: { color: 'white', fontSize: 18 },
  topTitle: { color: 'white', fontWeight: '800', fontSize: 16 },

  tabsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, backgroundColor: '#eef2ff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  tabActive: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB' },
  tabText: { color: '#475569', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#111827' },

  list: { padding: 12, paddingBottom: 110 },
  card: { backgroundColor: '#ecfeff', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 12, padding: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardIcon: { marginRight: 8 },
  cardTitle: { fontWeight: '800', color: '#0f172a', flex: 1 },
  badgeRow: { alignItems: 'flex-start', marginBottom: 6 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeCritical: { backgroundColor: '#fecaca' },
  badgeWarning: { backgroundColor: '#fde68a' },
  badgeOk: { backgroundColor: '#bbf7d0' },
  badgeText: { fontWeight: '800', color: '#0f172a', fontSize: 12 },
  metaRow: { marginBottom: 2 },
  meta: { color: '#334155' },
  body: { color: '#111827', marginTop: 6, marginBottom: 10 },
  primaryBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  primaryBtnText: { color: 'white', fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#86efac', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#065f46', fontWeight: '800' },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' },
  tabItem: { alignItems: 'center' },
  tabIcon: { color: 'white' },
  tabTextBottom: { color: 'white', fontSize: 10, marginTop: 2 },
});
