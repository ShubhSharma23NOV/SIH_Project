import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function WaterLifespanScreen({ navigation }) {
  const [waterSource] = useState({
    name: 'Village Well',
    nameHi: 'गांव का कुआं',
    type: 'Well',
    typeHi: 'कुआं',
    location: 'Ganga Vihar',
    locationHi: 'गंगा विहार',
    status: 'caution',
    icon: '🪣',
  });

  const [lastTestDate] = useState('Nov 10, 2025');
  const [daysSinceTest] = useState(6);
  const [nextTestDue] = useState(1);

  const [trends] = useState({
    tds: 'rising',
    ph: 'stable',
    turbidity: 'falling',
  });

  const [recentTests] = useState([
    { id: 1, date: 'Today', dateHi: 'आज', status: 'caution', method: 'Sensor', methodHi: 'सेंसर' },
    { id: 2, date: '7 days ago', dateHi: '7 दिन पहले', status: 'safe', method: 'Manual', methodHi: 'मैनुअल' },
    { id: 3, date: '14 days ago', dateHi: '14 दिन पहले', status: 'risky', method: 'Sensor', methodHi: 'सेंसर' },
  ]);

  const [alert] = useState({
    type: 'warning',
    message: 'Source needs frequent monitoring during monsoon',
    messageHi: 'मानसून के दौरान स्रोत की बार-बार निगरानी की आवश्यकता है',
  });

  const getStatusColor = (status) => {
    if (status === 'safe') return '#22c55e';
    if (status === 'caution') return '#f59e0b';
    return '#ef4444';
  };

  const getStatusIcon = (status) => {
    if (status === 'safe') return '🟢';
    if (status === 'caution') return '🟡';
    return '🔴';
  };

  const getStatusLabel = (status) => {
    if (status === 'safe') return 'Safe • सुरक्षित';
    if (status === 'caution') return 'Caution • सावधानी';
    return 'Risky • जोखिम';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'rising') return '↑';
    if (trend === 'falling') return '↓';
    return '→';
  };

  const getTrendLabel = (trend) => {
    if (trend === 'rising') return 'Rising • बढ़ रहा';
    if (trend === 'falling') return 'Falling • गिर रहा';
    return 'Stable • स्थिर';
  };

  const getTrendColor = (trend) => {
    if (trend === 'rising') return '#ef4444';
    if (trend === 'falling') return '#22c55e';
    return '#6B7280';
  };

  const getAlertColor = (type) => {
    if (type === 'success') return '#dcfce7';
    if (type === 'warning') return '#fef3c7';
    return '#fef2f2';
  };

  const getAlertBorderColor = (type) => {
    if (type === 'success') return '#22c55e';
    if (type === 'warning') return '#fbbf24';
    return '#ef4444';
  };

  const handleAddTest = () => {
    Alert.alert(
      'Add New Test',
      'Choose testing method:\n\n1. Manual Test\n2. Sensor Test',
      [
        { text: 'Manual', onPress: () => navigation.navigate('WaterTesting') },
        { text: 'Sensor', onPress: () => navigation.navigate('WaterTesting') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDownloadReport = () => {
    Alert.alert(
      'Report Generated',
      'Water source report saved offline.\nपानी स्रोत रिपोर्ट ऑफ़लाइन सहेजी गई।',
      [{ text: 'OK' }]
    );
  };

  const progressPercentage = Math.min(((7 - nextTestDue) / 7) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Water Source Lifespan</Text>
          <Text style={styles.headerSubtitle}>जल स्रोत जीवनकाल • Last test & trend</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Water Source Overview Card */}
        <View style={[styles.overviewCard, { borderLeftColor: getStatusColor(waterSource.status) }]}>
          <View style={styles.overviewHeader}>
            <Text style={styles.sourceIcon}>{waterSource.icon}</Text>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>{waterSource.name}</Text>
              <Text style={styles.sourceNameHi}>{waterSource.nameHi}</Text>
              <Text style={styles.sourceLocation}>📍 {waterSource.location} • {waterSource.locationHi}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusIcon}>{getStatusIcon(waterSource.status)}</Text>
            <Text style={[styles.statusText, { color: getStatusColor(waterSource.status) }]}>
              {getStatusLabel(waterSource.status)}
            </Text>
          </View>
        </View>

        {/* Last Test → Next Test Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Timeline • परीक्षण समयरेखा</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Last Tested • अंतिम परीक्षण</Text>
                <Text style={styles.timelineValue}>{lastTestDate}</Text>
              </View>
              <View style={styles.timelineDivider} />
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Days Since • दिन बीते</Text>
                <Text style={styles.timelineValueLarge}>{daysSinceTest}</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              </View>
            </View>

            <View style={styles.nextTestCard}>
              <Text style={styles.nextTestLabel}>Next Test Due In • अगला परीक्षण</Text>
              <Text style={styles.nextTestValue}>{nextTestDue} {nextTestDue === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        </View>

        {/* Trend Indicator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality Trends • गुणवत्ता रुझान</Text>
          <View style={styles.trendGrid}>
            <View style={styles.trendCard}>
              <Text style={styles.trendLabel}>TDS</Text>
              <Text style={[styles.trendIcon, { color: getTrendColor(trends.tds) }]}>
                {getTrendIcon(trends.tds)}
              </Text>
              <Text style={[styles.trendText, { color: getTrendColor(trends.tds) }]}>
                {getTrendLabel(trends.tds)}
              </Text>
            </View>

            <View style={styles.trendCard}>
              <Text style={styles.trendLabel}>pH</Text>
              <Text style={[styles.trendIcon, { color: getTrendColor(trends.ph) }]}>
                {getTrendIcon(trends.ph)}
              </Text>
              <Text style={[styles.trendText, { color: getTrendColor(trends.ph) }]}>
                {getTrendLabel(trends.ph)}
              </Text>
            </View>

            <View style={styles.trendCard}>
              <Text style={styles.trendLabel}>Turbidity</Text>
              <Text style={styles.trendLabelHi}>टर्बिडिटी</Text>
              <Text style={[styles.trendIcon, { color: getTrendColor(trends.turbidity) }]}>
                {getTrendIcon(trends.turbidity)}
              </Text>
              <Text style={[styles.trendText, { color: getTrendColor(trends.turbidity) }]}>
                {getTrendLabel(trends.turbidity)}
              </Text>
            </View>
          </View>
        </View>

        {/* Water Quality Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent History • हाल का इतिहास</Text>
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyHeaderText}>Test • परीक्षण</Text>
              <Text style={styles.historyHeaderText}>Safe? • सुरक्षित?</Text>
              <Text style={styles.historyHeaderText}>Method • विधि</Text>
            </View>
            {recentTests.map((test) => (
              <View key={test.id} style={styles.historyRow}>
                <View style={styles.historyCell}>
                  <Text style={styles.historyDate}>{test.date}</Text>
                  <Text style={styles.historyDateHi}>{test.dateHi}</Text>
                </View>
                <View style={styles.historyCell}>
                  <Text style={styles.historyStatus}>{getStatusIcon(test.status)}</Text>
                </View>
                <View style={styles.historyCell}>
                  <Text style={styles.historyMethod}>{test.method}</Text>
                  <Text style={styles.historyMethodHi}>{test.methodHi}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Alerts & Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert • अलर्ट</Text>
          <View style={[
            styles.alertCard,
            { 
              backgroundColor: getAlertColor(alert.type),
              borderColor: getAlertBorderColor(alert.type)
            }
          ]}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={styles.alertText}>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertMessageHi}>{alert.messageHi}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addTestButton} onPress={handleAddTest}>
          <Text style={styles.addTestButtonText}>➕ Add New Test • नया परीक्षण जोड़ें</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportButton} onPress={handleDownloadReport}>
          <Text style={styles.reportButtonText}>📄 Download Report (Offline) • रिपोर्ट डाउनलोड करें</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 20,
    color: '#111827',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sourceIcon: {
    fontSize: 56,
    marginRight: 16,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  sourceNameHi: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 2,
  },
  sourceLocation: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    paddingLeft: 2,
  },
  timelineCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
  },
  timelineDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  timelineLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    textAlign: 'center',
  },
  timelineValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  timelineValueLarge: {
    fontSize: 32,
    fontWeight: '800',
    color: '#14b8a6',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#14b8a6',
    borderRadius: 4,
  },
  nextTestCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  nextTestLabel: {
    fontSize: 12,
    color: '#0369a1',
    marginBottom: 4,
  },
  nextTestValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#14b8a6',
  },
  trendGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  trendCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 120,
    justifyContent: 'center',
  },
  trendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  trendLabelHi: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 8,
  },
  trendIcon: {
    fontSize: 32,
    fontWeight: '700',
    marginVertical: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  historyHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  historyDateHi: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 24,
  },
  historyMethod: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  historyMethodHi: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  alertText: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  alertMessageHi: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
    gap: 10,
  },
  addTestButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addTestButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  reportButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14b8a6',
  },
});
