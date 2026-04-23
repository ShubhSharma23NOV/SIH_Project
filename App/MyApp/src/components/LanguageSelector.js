/**
 * Language Selector Component
 * Allows users to switch between supported languages
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import Icon from './Icon';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
  { code: 'as', label: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
  { code: 'brx', label: 'Bodo', nativeName: 'बड़ो' },
  { code: 'grt', label: 'Garo', nativeName: 'Garo' },
  { code: 'kha', label: 'Khasi', nativeName: 'Khasi' },
  { code: 'mizo', label: 'Mizo', nativeName: 'Mizo' },
  { code: 'mni', label: 'Manipuri', nativeName: 'ꯃꯩꯇꯩ' },
  { code: 'ne', label: 'Nepali', nativeName: 'नेपाली' },
];

export default function LanguageSelector({ buttonStyle, iconSize = 24 }) {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = LANGUAGE_OPTIONS.find(
    (lang) => lang.code === i18n.language
  ) || LANGUAGE_OPTIONS[0];

  const handleLanguageChange = async (langCode) => {
    await i18n.changeLanguage(langCode);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, buttonStyle]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Icon name="language" size={iconSize} color={COLORS.primary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Icon name="language" size={48} color={COLORS.primary} />
              <Text style={styles.modalTitle}>{t('settings.language')}</Text>
            </View>

            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langOption,
                    currentLanguage.code === lang.code &&
                      styles.langOptionActive,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <View style={styles.langOptionContent}>
                    <Text
                      style={[
                        styles.langOptionNative,
                        currentLanguage.code === lang.code &&
                          styles.langOptionTextActive,
                      ]}
                    >
                      {lang.nativeName}
                    </Text>
                    <Text style={styles.langOptionLabel}>{lang.label}</Text>
                  </View>
                  {currentLanguage.code === lang.code && (
                    <Icon name="checkCircle" size={24} color={COLORS.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.button,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
