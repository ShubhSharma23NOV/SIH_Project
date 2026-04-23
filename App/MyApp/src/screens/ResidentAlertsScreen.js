/**
 * Resident Alerts Screen
 * Display water contamination, vaccination, outbreak alerts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard } from '../components/gov';
import Icon from '../components/Icon';

export default function ResidentAlertsScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [filter, setFilter] = useState('all'); // 'all' | 'water' | 'vaccination' | 'outbreak' | 'followup'

  const [alerts] = useState([
    {
      id: '1',
      type: 'water',
      severity: 'high',
      title: 'Water Quality Alert',
      titleHindi: 'जल गुणवत्ता अलर्ट',
      message: 'High turbidity detected in local water source. Boil water before use.',
      messageHindi: 'स्थानीय जल स्रोत में उच्च टर्बिडिटी का पता चला। उपयोग से पहले पानी उबालें।',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
    },
    {
      id: '2',
      type: 'vaccination',
      severity: 'medium',
      title: 'Vaccination Camp Notice',
      titleHindi: 'टीकाकरण शिविर सूचना',
      message: 'Free vaccination camp on 20th December at Community Health Center.',
      messageHindi: '20 दिसंबर को सामुदायिक स्वास्थ्य केंद्र में मुफ्त टीकाकरण शिविर।',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      isRead: true,
    },
    {
      id: '3',
      type: 'outbreak',
      severity: 'high',
      title: 'Disease Outbreak Alert',
      titleHindi: 'रोग प्रकोप अलर्ट',
      message: 'Increased cases of waterborne diseases reported in nearby areas. Take precautions.',
      messageHindi: 'आस-पास के क्षेत्रों में जलजनित रोगों के मामले बढ़े हैं। सावधानी बरतें।',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isRead: true,
    },
    {
      id: '4',
      type: 'followup',
      severity: 'low',
      title: 'ASHA Follow-up Reminder',
      titleHindi: 'आशा फॉलो-अप रिमाइंडर',
      message: 'Your ASHA worker will visit tomorrow for routine health checkup.',
      messageHindi: 'आपकी आशा कार्यकर्ता कल नियमित स्वास्थ्य जांच के लिए आएंगी।',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isRead: true,
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch new alerts
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'water': return { name: 'waterTest', color: COLORS.secondary };
      case 'vaccination': return { name: 'health', color: COLORS.success };
      case 'outbreak': return { name: 'danger', color: COLORS.error };
      case 'followup': return { name: 'person', color: COLORS.accent };
      default: return { name: 'info', color: COLORS.info };
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.info;
      default: return COLORS.textMedium;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return language === 'en' ? 'Just now' : 'अभी';
    if (hours < 24) return `${hours} ${language === 'en' ? 'hours ago' : 'घंटे पहले'}`;
    if (days === 1) return language === 'en' ? 'Yesterday' : 'कल';
    return `${days} ${language === 'en' ? 'days ago' : 'दिन पहले'}`;
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filter);

  const filters = [
    { id: 'all', label: 'All', labelHindi: 'सभी' },
    { id: 'water', label: 'Water', labelHindi: 'जल' },
    { id: 'vaccination', label: 'Vaccination', labelHindi: 'टीकाकरण' },
    { id: 'outbreak', label: 'Outbreak', labelHindi: 'प्रकोप' },
    { id: 'followup', label: 'Follow-up', labelHindi: 'फॉलो-अप' },
  ];

  const renderAlert = ({ item }) => {
    const icon = getAlertIcon(item.type);
    const severityColor = getSeverityColor(item.severity);

    return (
      <TouchableOpacity
        style={[
          styles.alertCard,
          !item.isRead && styles.alertCardUnread,
        ]}
        onPress={() => {
          // TODO: Mark as read and show details
        }}
      >
        <View style={[styles.alertBorder, { backgroundColor: severityColor }]} />
        
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <View style={[styles.alertIconContainer, { backgroundColor: `${icon.color}15` }]}>
              <Icon name={icon.name} size={20} color={icon.color} />
            </View>
            
            <View style={styles.alertTitleContainer}>
              <Text style={styles.alertTitle}>
                {language === 'en' ? item.title : item.titleHindi}
              </Text>
              <Text style={styles.alertTime}>{formatTime(item.timestamp)}</Text>
            </View>

            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.alertMessage} numberOfLines={2}>
            {language === 'en' ? item.message : item.messageHindi}
          </Text>

          <View style={styles.alertFooter}>
            <View style={[styles.severityBadge, { backgroundColor: `${severityColor}15` }]}>
              <Text style={[styles.severityText, { color: severityColor }]}>
                {item.severity.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title={language === 'en' ? 'Alerts & Notifications' : 'अलर्ट और सूचनाएं'}
        subtitle={language === 'en' ? 'Stay informed' : 'सूचित रहें'}
        showBack
        onBackPress={() => navigation.goBack()}
      >
        <TouchableOpacity
          style={styles.langButton}
          onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        >
          <Text style={styles.langText}>{language === 'en' ? 'हिं' : 'EN'}</Text>
        </TouchableOpacity>
      </GovHeader>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterTab, filter === f.id && styles.filterTabActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {language === 'en' ? f.label : f.labelHindi}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="info" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>
              {language === 'en' ? 'No alerts to display' : 'कोई अलर्ट नहीं'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  langButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
  },
  langText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: RADIUS.base,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
  },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  alertCardUnread: {
    ...SHADOWS.md,
  },
  alertBorder: {
    width: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  alertContent: {
    padding: SPACING.md,
    paddingLeft: SPACING.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  alertTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  alertMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
});
