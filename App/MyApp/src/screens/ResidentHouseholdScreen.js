/**
 * Resident Household Screen
 * Display household members, visit history, water tests, referrals
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovStatusBadge } from '../components/gov';
import Icon from '../components/Icon';

export default function ResidentHouseholdScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'visits' | 'tests' | 'referrals'

  const [householdData] = useState({
    householdId: 'HH-2024-001',
    headOfHousehold: 'Rajesh Kumar',
    address: 'House No. 45, Beltola Road',
    village: 'Beltola',
    block: 'Guwahati',
    district: 'Kamrup Metropolitan',
    riskLevel: 'low',
    ashaWorker: {
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
    },
  });

  const [members] = useState([
    {
      id: '1',
      name: 'Rajesh Kumar',
      nameHindi: 'राजेश कुमार',
      age: 45,
      gender: 'Male',
      relation: 'Head',
      healthStatus: 'Good',
    },
    {
      id: '2',
      name: 'Sunita Kumar',
      nameHindi: 'सुनीता कुमार',
      age: 42,
      gender: 'Female',
      relation: 'Spouse',
      healthStatus: 'Good',
    },
    {
      id: '3',
      name: 'Amit Kumar',
      nameHindi: 'अमित कुमार',
      age: 18,
      gender: 'Male',
      relation: 'Son',
      healthStatus: 'Good',
    },
    {
      id: '4',
      name: 'Priya Kumar',
      nameHindi: 'प्रिया कुमार',
      age: 15,
      gender: 'Female',
      relation: 'Daughter',
      healthStatus: 'Good',
    },
  ]);

  const [visits] = useState([
    {
      id: '1',
      date: '15 Nov 2024',
      purpose: 'Routine Health Checkup',
      purposeHindi: 'नियमित स्वास्थ्य जांच',
      ashaWorker: 'Priya Sharma',
      notes: 'All family members healthy',
    },
    {
      id: '2',
      date: '1 Nov 2024',
      purpose: 'Water Quality Survey',
      purposeHindi: 'जल गुणवत्ता सर्वेक्षण',
      ashaWorker: 'Priya Sharma',
      notes: 'Water test conducted',
    },
    {
      id: '3',
      date: '15 Oct 2024',
      purpose: 'Vaccination Follow-up',
      purposeHindi: 'टीकाकरण फॉलो-अप',
      ashaWorker: 'Priya Sharma',
      notes: 'Children vaccinated',
    },
  ]);

  const [waterTests] = useState([
    {
      id: '1',
      date: '1 Nov 2024',
      source: 'Hand Pump',
      result: 'Safe',
      ph: '7.2',
      turbidity: 'Low',
      frc: 'Present',
    },
    {
      id: '2',
      date: '1 Sep 2024',
      source: 'Hand Pump',
      result: 'Safe',
      ph: '7.0',
      turbidity: 'Low',
      frc: 'Present',
    },
  ]);

  const [referrals] = useState([
    {
      id: '1',
      date: '10 Nov 2024',
      member: 'Sunita Kumar',
      facility: 'Community Health Center',
      reason: 'Routine Checkup',
      status: 'Completed',
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.success;
      default: return COLORS.textMedium;
    }
  };

  const tabs = [
    { id: 'members', label: 'Members', labelHindi: 'सदस्य', icon: 'person' },
    { id: 'visits', label: 'Visits', labelHindi: 'विज़िट', icon: 'calendar' },
    { id: 'tests', label: 'Water Tests', labelHindi: 'जल परीक्षण', icon: 'waterTest' },
    { id: 'referrals', label: 'Referrals', labelHindi: 'रेफरल', icon: 'health' },
  ];

  const renderMembers = () => (
    <View>
      {members.map((member) => (
        <GovCard key={member.id} style={styles.memberCard}>
          <View style={styles.memberHeader}>
            <View style={styles.memberAvatar}>
              <Icon name="person" size={24} color={COLORS.white} />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {language === 'en' ? member.name : member.nameHindi}
              </Text>
              <Text style={styles.memberDetails}>
                {member.age} {language === 'en' ? 'years' : 'वर्ष'} • {member.gender} • {member.relation}
              </Text>
            </View>
            <GovStatusBadge
              status={member.healthStatus === 'Good' ? 'success' : 'warning'}
              label={member.healthStatus}
            />
          </View>
        </GovCard>
      ))}
    </View>
  );

  const renderVisits = () => (
    <View>
      {visits.map((visit, index) => (
        <View key={visit.id}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            {index < visits.length - 1 && <View style={styles.timelineLine} />}
            
            <GovCard style={styles.visitCard}>
              <View style={styles.visitHeader}>
                <Text style={styles.visitDate}>{visit.date}</Text>
                <Icon name="calendar" size={16} color={COLORS.textLight} />
              </View>
              <Text style={styles.visitPurpose}>
                {language === 'en' ? visit.purpose : visit.purposeHindi}
              </Text>
              <Text style={styles.visitWorker}>
                {language === 'en' ? 'ASHA Worker' : 'आशा कार्यकर्ता'}: {visit.ashaWorker}
              </Text>
              {visit.notes && (
                <Text style={styles.visitNotes}>{visit.notes}</Text>
              )}
            </GovCard>
          </View>
        </View>
      ))}
    </View>
  );

  const renderWaterTests = () => (
    <View>
      {waterTests.map((test) => (
        <GovCard key={test.id} style={styles.testCard}>
          <View style={styles.testHeader}>
            <View style={styles.testIcon}>
              <Icon name="waterTest" size={24} color={COLORS.secondary} />
            </View>
            <View style={styles.testInfo}>
              <Text style={styles.testDate}>{test.date}</Text>
              <Text style={styles.testSource}>{test.source}</Text>
            </View>
            <View style={[styles.testResult, { backgroundColor: `${COLORS.success}15` }]}>
              <Text style={[styles.testResultText, { color: COLORS.success }]}>
                {test.result}
              </Text>
            </View>
          </View>
          
          <View style={styles.testParams}>
            <View style={styles.testParam}>
              <Text style={styles.paramLabel}>pH</Text>
              <Text style={styles.paramValue}>{test.ph}</Text>
            </View>
            <View style={styles.testParam}>
              <Text style={styles.paramLabel}>Turbidity</Text>
              <Text style={styles.paramValue}>{test.turbidity}</Text>
            </View>
            <View style={styles.testParam}>
              <Text style={styles.paramLabel}>FRC</Text>
              <Text style={styles.paramValue}>{test.frc}</Text>
            </View>
          </View>
        </GovCard>
      ))}
    </View>
  );

  const renderReferrals = () => (
    <View>
      {referrals.length > 0 ? (
        referrals.map((referral) => (
          <GovCard key={referral.id} style={styles.referralCard}>
            <View style={styles.referralHeader}>
              <Icon name="health" size={20} color={COLORS.accent} />
              <Text style={styles.referralDate}>{referral.date}</Text>
            </View>
            <Text style={styles.referralMember}>{referral.member}</Text>
            <Text style={styles.referralFacility}>{referral.facility}</Text>
            <Text style={styles.referralReason}>{referral.reason}</Text>
            <GovStatusBadge
              status={referral.status === 'Completed' ? 'success' : 'warning'}
              label={referral.status}
            />
          </GovCard>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="health" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>
            {language === 'en' ? 'No referrals' : 'कोई रेफरल नहीं'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title={language === 'en' ? 'Household Details' : 'घर का विवरण'}
        subtitle={householdData.householdId}
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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Household Info Card */}
        <GovCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="household" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {language === 'en' ? 'Head of Household' : 'घर के मुखिया'}
              </Text>
              <Text style={styles.infoValue}>{householdData.headOfHousehold}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Icon name="mapMarker" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {language === 'en' ? 'Address' : 'पता'}
              </Text>
              <Text style={styles.infoValue}>{householdData.address}</Text>
              <Text style={styles.infoSubvalue}>
                {householdData.village}, {householdData.block}, {householdData.district}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Icon name="warning" size={20} color={getRiskColor(householdData.riskLevel)} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {language === 'en' ? 'Risk Level' : 'जोखिम स्तर'}
              </Text>
              <Text style={[styles.infoValue, { color: getRiskColor(householdData.riskLevel) }]}>
                {householdData.riskLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Icon name="person" size={20} color={COLORS.accent} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {language === 'en' ? 'ASHA Worker' : 'आशा कार्यकर्ता'}
              </Text>
              <Text style={styles.infoValue}>{householdData.ashaWorker.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => {/* TODO: Call ASHA */}}
            >
              <Icon name="call" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </GovCard>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? COLORS.primary : COLORS.textMedium}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {language === 'en' ? tab.label : tab.labelHindi}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'members' && renderMembers()}
          {activeTab === 'visits' && renderVisits()}
          {activeTab === 'tests' && renderWaterTests()}
          {activeTab === 'referrals' && renderReferrals()}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  infoSubvalue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.xs,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.base,
    gap: SPACING.xs,
  },
  tabActive: {
    backgroundColor: `${COLORS.primary}10`,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabContent: {
    marginBottom: SPACING.xl,
  },
  memberCard: {
    marginBottom: SPACING.sm,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  memberDetails: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 4,
    marginRight: SPACING.md,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: -SPACING.md,
    width: 2,
    backgroundColor: COLORS.borderLight,
  },
  visitCard: {
    flex: 1,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  visitDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
  },
  visitPurpose: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  visitWorker: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginBottom: SPACING.xs,
  },
  visitNotes: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  testCard: {
    marginBottom: SPACING.sm,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  testIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  testInfo: {
    flex: 1,
  },
  testDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  testSource: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
  },
  testResult: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xs,
  },
  testResultText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  testParams: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  testParam: {
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  paramValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  referralCard: {
    marginBottom: SPACING.sm,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  referralDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  referralMember: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  referralFacility: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    marginBottom: SPACING.xs,
  },
  referralReason: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
});
