import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function SymptomHeatmapScreen({ navigation }) {
  const [outbreakRisk, setOutbreakRisk] = useState(62);
  const [riskLevel, setRiskLevel] = useState('Medium');
  const [trend, setTrend] = useState('Rising');

  const symptoms = [
    { id: 'diarrhoea', label: 'Diarrhoea', labelHi: 'दस्त', count: 18, severity: 'high' },
    { id: 'vomiting', label: 'Vomiting', labelHi: 'उल्टी', count: 12, severity: 'medium' },
    { id: 'fever', label: 'Fever', labelHi: 'बुखार', count: 15, severity: 'high' },
    { id: 'dehydration', label: 'Dehydration', labelHi: 'निर्जलीकरण', count: 8, severity: 'medium' },
    { id: 'stomachPain', label: 'Stomach Pain', labelHi: 'पेट दर्द', count: 10, severity: 'medium' },
  ];

  const getRiskColor = () => {
    if (riskLevel === 'High') return '#ef4444';
    if (riskLevel === 'Medium') return '#f59e0b';
    return '#22c55e';
  };

  const getRiskIcon = () => {
    if (riskLevel === 'High') return '🔴';
    if (riskLevel === 'Medium') return '🟡';
    return '🟢';
  };

  const getTrendIcon = () => {
    if (trend === 'Rising') return '📈';
    if (trend === 'Falling') return '📉';
    return '➡️';
  };

  const getSeverityColor = (severity) => {
    if (severity === 'high') return '#ef4444';
    if (severity === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  const maxCount = Math.max(...symptoms.map(s => s.count));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('AshaDashboard')}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Symptom Heatmap</Text>
          <Text style={styles.headerSubtitle}>लक्षण हीटमैप • Offline outbreak prediction</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Risk Indicator */}
        <View style={[styles.riskCard, { borderColor: getRiskColor() }]}>
          <Text style={styles.riskIcon}>{getRiskIcon()}</Text>
          <Text style={styles.riskTitle}>Outbreak Probability</Text>
          <Text style={styles.riskTitleHi}>प्रकोप संभावना</Text>
          <Text style={[styles.riskPercentage, { color: getRiskColor() }]}>{outbreakRisk}%</Text>
          <Text style={[styles.riskLevel, { color: getRiskColor() }]}>
            {riskLevel} Risk • {riskLevel === 'High' ? 'उच्च' : riskLevel === 'Medium' ? 'मध्यम' : 'कम'} जोखिम
          </Text>
        </View>

        {/* Trend Summary Section */}
        <View style={styles.trendSection}>
          <View style={styles.trendCard}>
            <Text style={styles.trendIcon}>🔥</Text>
            <Text style={styles.trendLabel}>Most Reported</Text>
            <Text style={styles.trendLabelHi}>सबसे अधिक</Text>
            <Text style={styles.trendValue}>Diarrhoea</Text>
          </View>

          <View style={styles.trendCard}>
            <Text style={styles.trendIcon}>📊</Text>
            <Text style={styles.trendLabel}>Cases Today</Text>
            <Text style={styles.trendLabelHi}>आज के मामले</Text>
            <Text style={styles.trendValue}>45</Text>
          </View>

          <View style={styles.trendCard}>
            <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
            <Text style={styles.trendLabel}>7-Day Trend</Text>
            <Text style={styles.trendLabelHi}>7-दिन रुझान</Text>
            <Text style={styles.trendValue}>{trend}</Text>
          </View>
        </View>

        {/* Offline Heatmap Visualization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Area Heatmap • क्षेत्र हीटमैप</Text>
          <View style={styles.heatmapContainer}>
            <View style={styles.heatmapGrid}>
              {/* Row 1 */}
              <View style={[styles.heatmapDot, { backgroundColor: '#22c55e' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#f59e0b' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#22c55e' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#ef4444' }]} />
              
              {/* Row 2 */}
              <View style={[styles.heatmapDot, { backgroundColor: '#f59e0b' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#ef4444' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#f59e0b' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#22c55e' }]} />
              
              {/* Row 3 */}
              <View style={[styles.heatmapDot, { backgroundColor: '#22c55e' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#f59e0b' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#ef4444' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#f59e0b' }]} />
              
              {/* Row 4 */}
              <View style={[styles.heatmapDot, { backgroundColor: '#22c55e' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#22c55e' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#f59e0b' }]} />
              <View style={[styles.heatmapDot, { backgroundColor: '#22c55e' }]} />
            </View>
            
            <View style={styles.heatmapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>High • उच्च</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Medium • मध्यम</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.legendText}>Normal • सामान्य</Text>
              </View>
            </View>
          </View>
          <Text style={styles.heatmapCaption}>
            Based on offline household reports in your assigned area
          </Text>
          <Text style={styles.heatmapCaptionHi}>
            आपके निर्धारित क्षेत्र में ऑफ़लाइन घरेलू रिपोर्ट के आधार पर
          </Text>
        </View>

        {/* Symptom Breakdown Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptom Breakdown • लक्षण विवरण</Text>
          {symptoms.map((symptom) => (
            <View key={symptom.id} style={styles.symptomRow}>
              <View style={styles.symptomInfo}>
                <Text style={styles.symptomLabel}>{symptom.label}</Text>
                <Text style={styles.symptomLabelHi}>{symptom.labelHi}</Text>
              </View>
              <View style={styles.symptomBarContainer}>
                <View 
                  style={[
                    styles.symptomBar,
                    { 
                      width: `${(symptom.count / maxCount) * 100}%`,
                      backgroundColor: getSeverityColor(symptom.severity)
                    }
                  ]}
                />
              </View>
              <Text style={styles.symptomCount}>{symptom.count}</Text>
            </View>
          ))}
        </View>

        {/* Offline Engine Note */}
        <View style={styles.offlineNote}>
          <Text style={styles.offlineIcon}>📱</Text>
          <Text style={styles.offlineText}>
            Calculated offline using last 7 days of reports
          </Text>
          <Text style={styles.offlineTextHi}>
            पिछले 7 दिनों की रिपोर्ट का उपयोग करके ऑफ़लाइन गणना की गई
          </Text>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>📈 View Detailed Stats</Text>
            <Text style={styles.detailsButtonTextHi}>विस्तृत आंकड़े देखें</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backToDashboardButton}
            onPress={() => navigation.navigate('AshaDashboard')}
          >
            <Text style={styles.backToDashboardText}>← Back to Dashboard</Text>
            <Text style={styles.backToDashboardTextHi}>डैशबोर्ड पर वापस जाएं</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 24,
  },
  riskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  riskIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  riskTitleHi: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  riskPercentage: {
    fontSize: 56,
    fontWeight: '800',
    marginVertical: 8,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: '700',
  },
  trendSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  trendCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  trendIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  trendLabelHi: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
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
  heatmapContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  heatmapDot: {
    width: (width - 112) / 4,
    height: (width - 112) / 4,
    borderRadius: (width - 112) / 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heatmapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  heatmapCaption: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  heatmapCaptionHi: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  symptomInfo: {
    width: 100,
  },
  symptomLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  symptomLabelHi: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  symptomBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  symptomBar: {
    height: '100%',
    borderRadius: 12,
  },
  symptomCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    width: 30,
    textAlign: 'right',
  },
  offlineNote: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  offlineIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
    textAlign: 'center',
  },
  offlineTextHi: {
    fontSize: 10,
    color: '#0284c7',
    textAlign: 'center',
    marginTop: 4,
  },
  footerActions: {
    gap: 12,
  },
  detailsButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailsButtonTextHi: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 2,
  },
  backToDashboardButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  backToDashboardText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14b8a6',
  },
  backToDashboardTextHi: {
    fontSize: 12,
    color: '#14b8a6',
    marginTop: 2,
  },
});
