/**
 * Resident Feedback Screen
 * Rate ASHA visits and provide feedback
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import Icon from '../components/Icon';
import { useResidentAuth } from '../context/ResidentAuthContext';

export default function ResidentFeedbackScreen({ navigation }) {
  const { residentProfile } = useResidentAuth();
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('asha_visit');
  const [feedback, setFeedback] = useState('');

  const categories = [
    { id: 'asha_visit', label: 'ASHA Visit', labelHindi: 'आशा विज़िट', icon: 'person' },
    { id: 'water_quality', label: 'Water Quality', labelHindi: 'जल गुणवत्ता', icon: 'waterTest' },
    { id: 'health_service', label: 'Health Service', labelHindi: 'स्वास्थ्य सेवा', icon: 'health' },
    { id: 'app_experience', label: 'App Experience', labelHindi: 'ऐप अनुभव', icon: 'star' },
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        language === 'en' ? 'Required' : 'आवश्यक',
        language === 'en' ? 'Please select a rating' : 'कृपया रेटिंग चुनें'
      );
      return;
    }

    if (!feedback.trim()) {
      Alert.alert(
        language === 'en' ? 'Required' : 'आवश्यक',
        language === 'en' ? 'Please provide feedback' : 'कृपया प्रतिक्रिया प्रदान करें'
      );
      return;
    }

    setLoading(true);
    try {
      await firestore().collection('feedback').add({
        residentId: residentProfile.uid,
        residentName: residentProfile.name,
        householdId: residentProfile.householdId,
        village: residentProfile.village,
        category,
        rating,
        feedback,
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: 'pending',
      });

      Alert.alert(
        language === 'en' ? 'Thank You!' : 'धन्यवाद!',
        language === 'en'
          ? 'Your feedback has been submitted successfully.'
          : 'आपकी प्रतिक्रिया सफलतापूर्वक सबमिट की गई है।',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        language === 'en' ? 'Error' : 'त्रुटि',
        language === 'en'
          ? 'Failed to submit feedback. Please try again.'
          : 'प्रतिक्रिया सबमिट करने में विफल। कृपया पुनः प्रयास करें।'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title={language === 'en' ? 'Feedback & Rating' : 'प्रतिक्रिया और रेटिंग'}
        subtitle={language === 'en' ? 'Help us improve' : 'हमें बेहतर बनाने में मदद करें'}
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'How would you rate your experience?' : 'आप अपने अनुभव को कैसे रेट करेंगे?'}
          </Text>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Icon
                  name={star <= rating ? 'starFilled' : 'star'}
                  size={48}
                  color={star <= rating ? COLORS.warning : COLORS.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 5 && (language === 'en' ? 'Excellent!' : 'उत्कृष्ट!')}
              {rating === 4 && (language === 'en' ? 'Very Good!' : 'बहुत अच्छा!')}
              {rating === 3 && (language === 'en' ? 'Good' : 'अच्छा')}
              {rating === 2 && (language === 'en' ? 'Fair' : 'ठीक')}
              {rating === 1 && (language === 'en' ? 'Poor' : 'खराब')}
            </Text>
          )}
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Feedback Category' : 'प्रतिक्रिया श्रेणी'}
          </Text>
          
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  category === cat.id && styles.categoryCardActive,
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Icon
                  name={cat.icon}
                  size={24}
                  color={category === cat.id ? COLORS.primary : COLORS.textMedium}
                />
                <Text style={[
                  styles.categoryLabel,
                  category === cat.id && styles.categoryLabelActive,
                ]}>
                  {language === 'en' ? cat.label : cat.labelHindi}
                </Text>
                {category === cat.id && (
                  <View style={styles.categoryCheck}>
                    <Icon name="checkCircle" size={16} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Your Feedback' : 'आपकी प्रतिक्रिया'} *
          </Text>
          
          <TextInput
            style={styles.textArea}
            value={feedback}
            onChangeText={setFeedback}
            placeholder={
              language === 'en'
                ? 'Tell us about your experience...'
                : 'हमें अपने अनुभव के बारे में बताएं...'
            }
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Info Card */}
        <GovCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="info" size={20} color={COLORS.info} />
            <Text style={styles.infoTitle}>
              {language === 'en' ? 'Your feedback matters' : 'आपकी प्रतिक्रिया मायने रखती है'}
            </Text>
          </View>
          <Text style={styles.infoText}>
            {language === 'en'
              ? 'Your feedback helps us improve our services and provide better healthcare to your community.'
              : 'आपकी प्रतिक्रिया हमें अपनी सेवाओं में सुधार करने और आपके समुदाय को बेहतर स्वास्थ्य सेवा प्रदान करने में मदद करती है।'}
          </Text>
        </GovCard>

        {/* Submit Button */}
        <GovButton
          title={language === 'en' ? 'Submit Feedback' : 'प्रतिक्रिया सबमिट करें'}
          subtitle={language === 'en' ? 'Thank you for your time' : 'आपके समय के लिए धन्यवाद'}
          onPress={handleSubmit}
          variant="primary"
          icon="send"
          fullWidth
          loading={loading}
          disabled={loading || rating === 0 || !feedback.trim()}
        />
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  starButton: {
    padding: SPACING.xs,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.warning,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.sm,
  },
  categoryCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  categoryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  categoryLabelActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  categoryCheck: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
    minHeight: 120,
  },
  infoCard: {
    backgroundColor: `${COLORS.info}10`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: SPACING.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
  },
});
