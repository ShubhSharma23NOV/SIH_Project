/**
 * Informed Consent Screen - Government of India
 * Digital Personal Data Protection Act, 2023 Compliant
 * ArogyaJal - Water Health Initiative
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import Icon from '../components/Icon';

export default function ConsentScreen({ navigation, route }) {
  const { returnScreen = 'HouseholdCheck' } = route?.params || {};
  
  const [consents, setConsents] = useState({
    dataCollection: false,
    dataSharing: false,
    dataStorage: false,
    healthData: false,
  });

  const consentItems = [
    {
      id: 'dataCollection',
      title: 'Data Collection Consent',
      titleHindi: 'डेटा संग्रह सहमति',
      description: 'I consent to the collection of household and health information for government health monitoring purposes.',
      descriptionHindi: 'मैं सरकारी स्वास्थ्य निगरानी उद्देश्यों के लिए घरेलू और स्वास्थ्य जानकारी के संग्रह के लिए सहमति देता हूं।',
      required: true,
    },
    {
      id: 'dataSharing',
      title: 'Data Sharing with Health Authorities',
      titleHindi: 'स्वास्थ्य अधिकारियों के साथ डेटा साझा करना',
      description: 'I consent to sharing this data with relevant health authorities (PHC, CHC, District Health Office) for healthcare delivery.',
      descriptionHindi: 'मैं स्वास्थ्य सेवा वितरण के लिए संबंधित स्वास्थ्य अधिकारियों के साथ इस डेटा को साझा करने के लिए सहमति देता हूं।',
      required: true,
    },
    {
      id: 'dataStorage',
      title: 'Data Storage and Retention',
      titleHindi: 'डेटा भंडारण और प्रतिधारण',
      description: 'I understand that this data will be stored securely for 7 years as per government retention policy and then deleted.',
      descriptionHindi: 'मैं समझता हूं कि यह डेटा सरकारी प्रतिधारण नीति के अनुसार 7 वर्षों तक सुरक्षित रूप से संग्रहीत किया जाएगा।',
      required: true,
    },
    {
      id: 'healthData',
      title: 'Sensitive Health Data',
      titleHindi: 'संवेदनशील स्वास्थ्य डेटा',
      description: 'I consent to the collection of sensitive health information including symptoms, diseases, and medical history.',
      descriptionHindi: 'मैं लक्षणों, बीमारियों और चिकित्सा इतिहास सहित संवेदनशील स्वास्थ्य जानकारी के संग्रह के लिए सहमति देता हूं।',
      required: true,
    },
  ];

  const toggleConsent = (id) => {
    setConsents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allConsentsGiven = Object.values(consents).every(v => v === true);

  const handleAccept = () => {
    if (!allConsentsGiven) {
      Alert.alert(
        'All Consents Required',
        'Please accept all consent statements to proceed.\n\nकृपया आगे बढ़ने के लिए सभी सहमति कथनों को स्वीकार करें।'
      );
      return;
    }

    const consentData = {
      consents,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    // TODO: Log audit event
    console.log('USER_CONSENT:', consentData);

    navigation.navigate(returnScreen, { consentData });
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Consent',
      'Without consent, we cannot proceed with the survey. Are you sure you want to decline?\n\nसहमति के बिना, हम सर्वेक्षण के साथ आगे नहीं बढ़ सकते। क्या आप वाकई अस्वीकार करना चाहते हैं?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            // TODO: Log audit event
            console.log('USER_CONSENT_WITHDRAW');
            navigation.navigate('AshaDashboard');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GovHeader
        title="Informed Consent"
        subtitle="सूचित सहमति"
        showBack
        onBackPress={() => navigation.navigate('AshaDashboard')}
      />

      {/* Tricolor */}
      <View style={styles.tricolor}>
        <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <GovCard style={styles.introCard}>
          <Icon name="shield" size={32} color={COLORS.primary} style={styles.introIcon} />
          <Text style={styles.introTitle}>Informed Consent</Text>
          <Text style={styles.introText}>
            Please read and accept the following consent statements before proceeding
          </Text>
          <Text style={styles.introTextHindi}>
            कृपया आगे बढ़ने से पहले निम्नलिखित सहमति कथनों को पढ़ें और स्वीकार करें
          </Text>
        </GovCard>

        {/* Consent Items */}
        {consentItems.map((item) => (
          <GovCard key={item.id} style={styles.consentCard}>
            <TouchableOpacity
              style={styles.consentHeader}
              onPress={() => toggleConsent(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.checkbox}>
                {consents[item.id] ? (
                  <Icon name="checkCircle" size={24} color={COLORS.success} />
                ) : (
                  <View style={styles.checkboxEmpty} />
                )}
              </View>
              <View style={styles.consentTitleContainer}>
                <Text style={styles.consentTitle}>
                  {item.title} {item.required && <Text style={styles.required}>*</Text>}
                </Text>
                <Text style={styles.consentTitleHindi}>{item.titleHindi}</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.consentDescription}>{item.description}</Text>
            <Text style={styles.consentDescriptionHindi}>{item.descriptionHindi}</Text>
          </GovCard>
        ))}

        {/* Your Rights */}
        <GovCard style={styles.rightsCard}>
          <View style={styles.rightsHeader}>
            <Icon name="info" size={24} color={COLORS.info} />
            <Text style={styles.rightsTitle}>Your Rights • आपके अधिकार</Text>
          </View>
          <View style={styles.rightsList}>
            {[
              'You can withdraw consent at any time',
              'You can request access to your data',
              'You can request correction of your data',
              'You can request deletion of your data',
              'Your data is encrypted and stored securely',
            ].map((right, index) => (
              <View key={index} style={styles.rightItem}>
                <Icon name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.rightText}>{right}</Text>
              </View>
            ))}
          </View>
        </GovCard>

        {/* Legal Framework */}
        <GovCard style={styles.legalCard}>
          <Text style={styles.legalTitle}>Government Compliance</Text>
          <Text style={styles.legalText}>
            • Digital Personal Data Protection Act, 2023{'\n'}
            • IT Act, 2000{'\n'}
            • Government Data Collection Guidelines{'\n'}
            • Ministry of Health & Family Welfare Standards
          </Text>
        </GovCard>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <GovButton
            title="Decline"
            subtitle="अस्वीकार करें"
            onPress={handleDecline}
            variant="secondary"
            style={styles.declineButton}
          />
          <GovButton
            title="Accept & Proceed"
            subtitle="स्वीकार करें और आगे बढ़ें"
            onPress={handleAccept}
            variant="primary"
            disabled={!allConsentsGiven}
            style={styles.acceptButton}
          />
        </View>

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          By accepting, you acknowledge that you have read and understood the consent statements above.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tricolor: {
    flexDirection: 'row',
    height: 3,
  },
  colorBar: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  introCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  introIcon: {
    marginBottom: SPACING.md,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  introTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  consentCard: {
    marginBottom: SPACING.md,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  checkbox: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  consentTitleContainer: {
    flex: 1,
  },
  consentTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  required: {
    color: COLORS.danger,
  },
  consentTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
  },
  consentDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
    marginBottom: SPACING.xs,
    paddingLeft: 32,
  },
  consentDescriptionHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    lineHeight: 18,
    paddingLeft: 32,
  },
  rightsCard: {
    marginBottom: SPACING.md,
    backgroundColor: `${COLORS.info}10`,
  },
  rightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  rightsTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  rightsList: {
    gap: SPACING.sm,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  rightText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
  legalCard: {
    marginBottom: SPACING.lg,
  },
  legalTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  legalText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  declineButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 2,
  },
  footerNote: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 18,
  },
});
