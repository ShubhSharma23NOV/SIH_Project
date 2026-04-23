/**
 * Resident Contact Screen
 * Contact ASHA worker and view government schemes
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
  Linking,
  Alert,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import Icon from '../components/Icon';

export default function ResidentContactScreen({ navigation }) {
  const [language, setLanguage] = useState('en');

  const [ashaWorker] = useState({
    name: 'Priya Sharma',
    nameHindi: 'प्रिया शर्मा',
    phone: '+91 98765 43210',
    email: 'priya.sharma@asha.gov.in',
    village: 'Beltola',
    district: 'Kamrup Metropolitan',
  });

  const schemes = [
    {
      id: '1',
      name: 'Jal Jeevan Mission',
      nameHindi: 'जल जीवन मिशन',
      description: 'Providing safe drinking water to all households',
      descriptionHindi: 'सभी घरों को सुरक्षित पेयजल उपलब्ध कराना',
      url: 'https://jaljeevanmission.gov.in',
    },
    {
      id: '2',
      name: 'Ayushman Bharat',
      nameHindi: 'आयुष्मान भारत',
      description: 'Health insurance for economically vulnerable families',
      descriptionHindi: 'आर्थिक रूप से कमजोर परिवारों के लिए स्वास्थ्य बीमा',
      url: 'https://pmjay.gov.in',
    },
    {
      id: '3',
      name: 'Swachh Bharat Mission',
      nameHindi: 'स्वच्छ भारत मिशन',
      description: 'Clean India campaign for sanitation',
      descriptionHindi: 'स्वच्छता के लिए स्वच्छ भारत अभियान',
      url: 'https://swachhbharatmission.gov.in',
    },
  ];

  const handleCall = () => {
    Linking.openURL(`tel:${ashaWorker.phone}`);
  };

  const handleSMS = () => {
    Linking.openURL(`sms:${ashaWorker.phone}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${ashaWorker.email}`);
  };

  const handleSchemeLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title={language === 'en' ? 'Contact & Support' : 'संपर्क और सहायता'}
        subtitle={language === 'en' ? 'Get help' : 'सहायता प्राप्त करें'}
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

      <ScrollView style={styles.content}>
        {/* ASHA Worker Card */}
        <GovCard style={styles.ashaCard}>
          <View style={styles.ashaHeader}>
            <View style={styles.ashaAvatar}>
              <Icon name="person" size={32} color={COLORS.white} />
            </View>
            <View style={styles.ashaInfo}>
              <Text style={styles.ashaLabel}>
                {language === 'en' ? 'Your ASHA Worker' : 'आपकी आशा कार्यकर्ता'}
              </Text>
              <Text style={styles.ashaName}>
                {language === 'en' ? ashaWorker.name : ashaWorker.nameHindi}
              </Text>
              <Text style={styles.ashaLocation}>
                📍 {ashaWorker.village}, {ashaWorker.district}
              </Text>
            </View>
          </View>

          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <Icon name="call" size={20} color={COLORS.success} />
              <Text style={styles.contactButtonText}>
                {language === 'en' ? 'Call' : 'कॉल'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={handleSMS}>
              <Icon name="message" size={20} color={COLORS.info} />
              <Text style={styles.contactButtonText}>
                {language === 'en' ? 'SMS' : 'एसएमएस'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
              <Icon name="email" size={20} color={COLORS.accent} />
              <Text style={styles.contactButtonText}>
                {language === 'en' ? 'Email' : 'ईमेल'}
              </Text>
            </TouchableOpacity>
          </View>
        </GovCard>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Emergency Contacts' : 'आपातकालीन संपर्क'}
          </Text>

          <GovCard style={styles.emergencyCard}>
            <TouchableOpacity
              style={styles.emergencyItem}
              onPress={() => Linking.openURL('tel:108')}
            >
              <Icon name="health" size={24} color={COLORS.error} />
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyTitle}>
                  {language === 'en' ? 'Ambulance' : 'एम्बुलेंस'}
                </Text>
                <Text style={styles.emergencyNumber}>108</Text>
              </View>
              <Icon name="call" size={20} color={COLORS.success} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.emergencyItem}
              onPress={() => Linking.openURL('tel:102')}
            >
              <Icon name="health" size={24} color={COLORS.warning} />
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyTitle}>
                  {language === 'en' ? 'Health Helpline' : 'स्वास्थ्य हेल्पलाइन'}
                </Text>
                <Text style={styles.emergencyNumber}>102</Text>
              </View>
              <Icon name="call" size={20} color={COLORS.success} />
            </TouchableOpacity>
          </GovCard>
        </View>

        {/* Government Schemes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Government Schemes' : 'सरकारी योजनाएं'}
          </Text>

          {schemes.map((scheme) => (
            <TouchableOpacity
              key={scheme.id}
              style={styles.schemeCard}
              onPress={() => handleSchemeLink(scheme.url)}
            >
              <Icon name="info" size={20} color={COLORS.info} />
              <View style={styles.schemeInfo}>
                <Text style={styles.schemeName}>
                  {language === 'en' ? scheme.name : scheme.nameHindi}
                </Text>
                <Text style={styles.schemeDesc}>
                  {language === 'en' ? scheme.description : scheme.descriptionHindi}
                </Text>
              </View>
              <Icon name="next" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {language === 'en'
              ? 'Ministry of Health & Family Welfare'
              : 'स्वास्थ्य और परिवार कल्याण मंत्रालय'}
          </Text>
          <Text style={styles.footerSubtext}>
            {language === 'en' ? 'Government of India' : 'भारत सरकार'}
          </Text>
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
  ashaCard: {
    marginBottom: SPACING.md,
  },
  ashaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ashaAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  ashaInfo: {
    flex: 1,
  },
  ashaLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  ashaName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  ashaLocation: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  contactButton: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  contactButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  emergencyCard: {
    padding: 0,
  },
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  emergencyNumber: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  schemeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  schemeInfo: {
    flex: 1,
  },
  schemeName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: 2,
  },
  schemeDesc: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});
