import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';

export default function GeneratedDataScreen({ navigation, route }) {
  const data = route?.params?.data || { turbidity: 0, ph: 0, tds: 0, tempC: 0 };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('SensorUpload')}>
          <Text style={styles.topBack}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Generated Data</Text>
        <Text style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.row}><Text style={styles.key}>Turbidity (NTU):</Text><Text style={styles.val}>{data.turbidity}</Text></View>
        <View style={styles.row}><Text style={styles.key}>pH:</Text><Text style={styles.val}>{data.ph}</Text></View>
        <View style={styles.row}><Text style={styles.key}>TDS (ppm):</Text><Text style={styles.val}>{data.tds}</Text></View>
        <View style={styles.row}><Text style={styles.key}>Temperature (°C):</Text><Text style={styles.val}>{data.tempC}</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbff' },
  topBar: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBack: { color: 'white', fontSize: 18 },
  topTitle: { color: 'white', fontWeight: '800', fontSize: 16 },
  body: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 10 },
  key: { color: '#111827', fontWeight: '700' },
  val: { color: '#0f172a' },
});


