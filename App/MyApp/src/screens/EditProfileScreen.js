/**
 * Edit Profile Screen - Government of India
 * ArogyaJal - Water Health Initiative
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';
import { GovHeader, GovCard, GovButton } from '../components/gov';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen({ navigation, route }) {
  const { profileData } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profileData?.name || '',
    nameHindi: profileData?.nameHindi || '',
    email: profileData?.email || '',
    district: profileData?.district || '',
    districtHindi: profileData?.districtHindi || '',
    block: profileData?.block || '',
    blockHindi: profileData?.blockHindi || '',
    village: profileData?.village || '',
    villageHindi: profileData?.villageHindi || '',
  });

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.name.trim()) {
        Alert.alert('Error', 'Name is required\nनाम आवश्यक है');
        return;
      }

      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No authenticated user found');
        return;
      }

      // Update Firestore
      await firestore()
        .collection('asha_workers')
        .doc(user.uid)
        .update({
          name: formData.name.trim(),
          nameHindi: formData.nameHindi.trim(),
          email: formData.email.trim(),
          district: formData.district.trim(),
          districtHindi: formData.districtHindi.trim(),
          block: formData.block.trim(),
          blockHindi: formData.blockHindi.trim(),
          village: formData.village.trim(),
          villageHindi: formData.villageHindi.trim(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Update cache
      const updatedProfile = {
        ...profileData,
        ...formData,
        updatedAt: new Date(),
      };
      await AsyncStorage.setItem('asha_profile', JSON.stringify(updatedProfile));

      Alert.alert(
        'Success',
        'Profile updated successfully\nप्रोफ़ाइल सफलतापूर्वक अपडेट की गई',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile\nप्रोफ़ाइल अपडेट करने में विफल');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <GovHeader
        title="Edit Profile"
        subtitle="प्रोफ़ाइल संपादित करें"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GovCard>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.sectionSubtitle}>व्यक्तिगत जानकारी</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name (English) *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name (Hindi)</Text>
            <TextInput
              style={styles.input}
              value={formData.nameHindi}
              onChangeText={(text) => setFormData({ ...formData, nameHindi: text })}
              placeholder="अपना नाम दर्ज करें"
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="your.email@example.com"
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </GovCard>

        <GovCard>
          <Text style={styles.sectionTitle}>Work Location</Text>
          <Text style={styles.sectionSubtitle}>कार्य स्थान</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>District (English)</Text>
            <TextInput
              style={styles.input}
              value={formData.district}
              onChangeText={(text) => setFormData({ ...formData, district: text })}
              placeholder="Enter district name"
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>District (Hindi)</Text>
            <TextInput
              style={styles.input}
              value={formData.districtHindi}
              onChangeText={(text) => setFormData({ ...formData, districtHindi: text })}
              placeholder="जिला का नाम दर्ज करें"
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Block (English)</Text>
            <TextInput
              style={styles.input}
              value={formData.block}
              onChangeText={(text) => setFormData({ ...formData, block: text })}
              placeholder="Enter block name"
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Block (Hindi)</Text>
            <TextInput
              style={styles.input}
              value={formData.blockHindi}
              onChangeText={(text) => setFormData({ ...formData, blockHindi: text })}
              placeholder="ब्लॉक का नाम दर्ज करें"
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Village (English)</Text>
            <TextInput
              style={styles.input}
              value={formData.village}
              onChangeText={(text) => setFormData({ ...formData, village: text })}
              placeholder="Enter village name"
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Village (Hindi)</Text>
            <TextInput
              style={styles.input}
              value={formData.villageHindi}
              onChangeText={(text) => setFormData({ ...formData, villageHindi: text })}
              placeholder="गाँव का नाम दर्ज करें"
              placeholderTextColor={COLORS.textLight}
              editable={!loading}
            />
          </View>
        </GovCard>

        <View style={styles.buttonContainer}>
          <GovButton
            title="Save Changes"
            subtitle="परिवर्तन सहेजें"
            onPress={handleSave}
            variant="primary"
            icon="checkCircle"
            fullWidth
            loading={loading}
            disabled={loading}
          />

          <GovButton
            title="Cancel"
            subtitle="रद्द करें"
            onPress={() => navigation.goBack()}
            variant="secondary"
            fullWidth
            disabled={loading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>* Required fields</Text>
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
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.base,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textDark,
  },
  buttonContainer: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textLight,
  },
});
