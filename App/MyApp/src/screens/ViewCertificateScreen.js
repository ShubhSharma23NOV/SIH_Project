/**
 * View Certificate Screen - Government of India
 * ArogyaJal - Water Health Initiative
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Image,
  Share,
  Alert,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import Icon from '../components/Icon';

export default function ViewCertificateScreen({ navigation, route }) {
  const { certification, name, ashaId, district, createdAt } = route.params || {};

  const handleShare = async () => {
    try {
      const message = `
ASHA Worker Certificate
आशा कार्यकर्ता प्रमाणपत्र

Name: ${name}
ASHA ID: ${ashaId}
Certification: ${certification}
District: ${district}

Ministry of Health & Family Welfare
Government of India
      `.trim();

      await Share.share({
        message: message,
        title: 'ASHA Certificate',
      });
    } catch (error) {
      console.error('Error sharing certificate:', error);
    }
  };

  const handleDownload = () => {
    Alert.alert(
      'Download Certificate',
      'Certificate download feature will be available soon.\n\nप्रमाणपत्र डाउनलोड सुविधा जल्द ही उपलब्ध होगी।'
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Certificate"
        subtitle="प्रमाणपत्र"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Certificate Card */}
        <GovCard style={styles.certificateCard}>
          {/* Government Emblem */}
          <View style={styles.emblemContainer}>
            <Image 
              source={require('../assets/images/Emblem_of_India_(navy_blue).svg.png')}
              style={styles.emblemImage}
              resizeMode="contain"
            />
          </View>

          {/* Tricolor */}
          <View style={styles.tricolor}>
            <View style={[styles.colorBar, { backgroundColor: COLORS.saffron }]} />
            <View style={[styles.colorBar, { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border }]} />
            <View style={[styles.colorBar, { backgroundColor: COLORS.green }]} />
          </View>

          {/* Certificate Header */}
          <Text style={styles.certificateTitle}>Certificate of Recognition</Text>
          <Text style={styles.certificateTitleHindi}>मान्यता प्रमाणपत्र</Text>

          {/* Certificate Body */}
          <View style={styles.certificateBody}>
            <Text style={styles.certText}>This is to certify that</Text>
            <Text style={styles.certTextHindi}>यह प्रमाणित किया जाता है कि</Text>

            <View style={styles.nameContainer}>
              <Text style={styles.certName}>{name}</Text>
              <View style={styles.nameLine} />
            </View>

            <Text style={styles.certText}>has been certified as</Text>
            <Text style={styles.certTextHindi}>के रूप में प्रमाणित किया गया है</Text>

            <View style={styles.certificationBadge}>
              <Icon name="certificate" size={24} color={COLORS.accent} />
              <Text style={styles.certificationText}>{certification}</Text>
            </View>

            <Text style={styles.certText}>ASHA Worker</Text>
            <Text style={styles.certTextHindi}>आशा कार्यकर्ता</Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ASHA ID:</Text>
                <Text style={styles.detailValue}>{ashaId || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>District:</Text>
                <Text style={styles.detailValue}>{district || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Issued Date:</Text>
                <Text style={styles.detailValue}>{formatDate(createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* Certificate Footer */}
          <View style={styles.certificateFooter}>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>Authorized Signature</Text>
              <Text style={styles.signatureTextHindi}>अधिकृत हस्ताक्षर</Text>
            </View>
          </View>

          {/* Ministry Info */}
          <View style={styles.ministryInfo}>
            <Text style={styles.ministryText}>Ministry of Health & Family Welfare</Text>
            <Text style={styles.ministryTextHindi}>स्वास्थ्य और परिवार कल्याण मंत्रालय</Text>
            <Text style={styles.govText}>Government of India • भारत सरकार</Text>
          </View>
        </GovCard>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <GovButton
            title="Share Certificate"
            subtitle="प्रमाणपत्र साझा करें"
            onPress={handleShare}
            variant="primary"
            icon="share"
            fullWidth
          />

          <GovButton
            title="Download PDF"
            subtitle="पीडीएफ डाउनलोड करें"
            onPress={handleDownload}
            variant="secondary"
            icon="download"
            fullWidth
          />
        </View>

        {/* Info Note */}
        <GovCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="info" size={20} color={COLORS.info} />
            <Text style={styles.infoTitle}>Certificate Information</Text>
          </View>
          <Text style={styles.infoText}>
            This certificate is issued by the Ministry of Health & Family Welfare, Government of India, 
            recognizing your role as an ASHA worker in the ArogyaJal initiative.
          </Text>
          <Text style={styles.infoTextHindi}>
            यह प्रमाणपत्र स्वास्थ्य और परिवार कल्याण मंत्रालय, भारत सरकार द्वारा जारी किया गया है, 
            जो आरोग्य जल पहल में आशा कार्यकर्ता के रूप में आपकी भूमिका को मान्यता देता है।
          </Text>
        </GovCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  certificateCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
  },
  emblemContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emblemImage: {
    width: 80,
    height: 80,
  },
  tricolor: {
    flexDirection: 'row',
    height: 4,
    marginBottom: SPACING.lg,
  },
  colorBar: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  certificateTitleHindi: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  certificateBody: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  certText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  certTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  nameContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  certName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  nameLine: {
    width: 200,
    height: 2,
    backgroundColor: COLORS.primary,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent}15`,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.base,
    marginVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  certificationText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.accent,
  },
  detailsContainer: {
    width: '100%',
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  certificateFooter: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  signatureContainer: {
    alignItems: 'flex-end',
    paddingRight: SPACING.lg,
  },
  signatureLine: {
    width: 150,
    height: 1,
    backgroundColor: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  signatureText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
  },
  signatureTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
  },
  ministryInfo: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  ministryText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  ministryTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  govText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  actionButtons: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoCard: {
    marginBottom: SPACING.xl,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMedium,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  infoTextHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    lineHeight: 20,
  },
});
