/**
 * Launch Screen - Government of India
 * ArogyaJal - Water Health Initiative
 * Using Official Design System v2.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovButton } from '../components/gov';
import Icon from '../components/Icon';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
  { code: 'as', label: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'mni', label: 'Manipuri', nativeName: 'ꯃꯩꯇꯩ' },
  { code: 'brx', label: 'Bodo', nativeName: 'बड़ो' },
  { code: 'lus', label: 'Mizo', nativeName: 'Mizo' },
  { code: 'ne', label: 'Nepali', nativeName: 'नेपाली' },
];

export default function LaunchScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_OPTIONS[0]);
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);

  useEffect(() => {
    const currentLang = i18n.language;
    const match = LANGUAGE_OPTIONS.find(l => l.code === currentLang);
    if (match) {
      setSelectedLanguage(match);
    }
  }, [i18n.language]);

  const handleLanguageSelect = () => {
    setIsLangModalVisible(true);
  };

  const selectLanguage = async (lang) => {
    setSelectedLanguage(lang);
    await i18n.changeLanguage(lang.code);
    setIsLangModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Government Branding Header */}
        <View style={styles.govHeader}>
        <View style={styles.emblemContainer}>
          <Image 
            source={require('../assets/images/Emblem_of_India_(navy_blue).svg.png')}
            style={styles.emblemImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.govTextContainer}>
          <Text style={styles.govText}>{t('launch.title')}</Text>
        </View>
        <View style={styles.flagContainer}>
          <Image 
            source={require('../assets/images/india.webp')}
            style={styles.flagImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Tricolor Stripe */}
      <View style={styles.tricolor}>
        <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.white }]} />
        <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
      </View>

      <View style={styles.contentWrap}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image 
              source={require('../assets/images/Dashboard.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appName}>ArogyaJal</Text>
          <Text style={styles.appNameHindi}>आरोग्य जल</Text>
          <Text style={styles.tagline}>{t('launch.tagline')}</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSection}>
          <Text style={styles.selectText}>{t('launch.selectRole')}</Text>
          
          <View style={styles.roleCards}>
            {/* ASHA Worker Card */}
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => navigation.navigate('UnifiedLogin', { role: 'asha' })}
              activeOpacity={0.7}
            >
              <View style={styles.roleIconContainer}>
                <Icon name="doctor" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.roleTitle}>{t('launch.roles.asha')}</Text>
              <Text style={styles.roleDescription}>{t('launch.roleDescriptions.asha')}</Text>
            </TouchableOpacity>

            {/* Local Resident Card */}
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => navigation.navigate('ResidentAuth')}
              activeOpacity={0.7}
            >
              <View style={styles.roleIconContainer}>
                <Icon name="community" size={28} color={COLORS.secondary} />
              </View>
              <Text style={styles.roleTitle}>{t('launch.roles.resident')}</Text>
              <Text style={styles.roleDescription}>{t('launch.roleDescriptions.resident')}</Text>
            </TouchableOpacity>

            {/* PHC Doctor Card */}
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => navigation.navigate('UnifiedLogin', { role: 'phc' })}
              activeOpacity={0.7}
            >
              <View style={styles.roleIconContainer}>
                <Icon name="health" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.roleTitle}>{t('launch.roles.phc')}</Text>
              <Text style={styles.roleDescription}>{t('launch.roleDescriptions.phc')}</Text>
            </TouchableOpacity>

            {/* Ops module removed - available on web admin portal */}
          </View>

          {/* Language Selector */}
          <TouchableOpacity style={styles.languageButton} onPress={handleLanguageSelect}>
            <Icon name="language" size={20} color={COLORS.primary} />
            <Text style={styles.languageButtonText}>{selectedLanguage.nativeName}</Text>
            <Icon name="chevronDown" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

        {/* Footer Badge */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('launch.subtitle')}</Text>
        </View>
      </ScrollView>

      {/* Language Select Modal */}
      <Modal
        visible={isLangModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLangModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Icon name="language" size={48} color={COLORS.primary} />
              <Text style={styles.modalTitle}>{t('settings.language')}</Text>
            </View>
            
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langOption,
                    selectedLanguage.code === lang.code && styles.langOptionActive,
                  ]}
                  onPress={() => selectLanguage(lang)}
                >
                  <View style={styles.langOptionContent}>
                    <Text style={[
                      styles.langOptionNative,
                      selectedLanguage.code === lang.code && styles.langOptionTextActive,
                    ]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={styles.langOptionLabel}>{lang.label}</Text>
                  </View>
                  {selectedLanguage.code === lang.code && (
                    <Icon name="checkCircle" size={24} color={COLORS.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <GovButton
              title={t('common.close')}
              onPress={() => setIsLangModalVisible(false)}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // Government Header
  govHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  emblemContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  emblemImage: {
    width: 45,
    height: 45,
  },
  govTextContainer: {
    flex: 1,
  },
  govText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  govTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    marginTop: 2,
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  flagImage: {
    width: 40,
    height: 40,
  },
  
  // Tricolor
  tricolor: {
    flexDirection: 'row',
    height: 2,
  },
  colorBar: {
    flex: 1,
  },
  
  // Content
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.secondary,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  appNameHindi: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    marginTop: SPACING.xs,
  },
  
  // Role Selection
  roleSection: {
    width: '100%',
    maxWidth: 500,
  },
  selectText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  selectTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  roleCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    justifyContent: 'center',
  },
  roleCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
    minHeight: 150,
    justifyContent: 'center',
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  roleTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  roleTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 14,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  languageButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.background,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  footerTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginTop: SPACING.sm,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  modalList: {
    marginBottom: SPACING.lg,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  langOptionActive: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  langOptionContent: {
    flex: 1,
  },
  langOptionNative: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  langOptionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginTop: 2,
  },
  langOptionTextActive: {
    color: COLORS.primary,
  },
});


