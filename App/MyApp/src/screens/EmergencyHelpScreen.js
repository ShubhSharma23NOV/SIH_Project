import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function EmergencyHelpScreen({ navigation }) {
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [expandedAid, setExpandedAid] = useState(null);
  const [pendingSync, setPendingSync] = useState(0);

  const criticalSymptoms = [
    { id: 'dehydration', icon: '🌡', label: 'Severe\nDehydration', labelHi: 'गंभीर\nनिर्जलीकरण' },
    { id: 'blood', icon: '🩸', label: 'Blood in\nStool', labelHi: 'मल में\nखून' },
    { id: 'vomiting', icon: '🤮', label: 'Persistent\nVomiting', labelHi: 'लगातार\nउल्टी' },
    { id: 'fever', icon: '🔥', label: 'High Fever/\nUnconscious', labelHi: 'तेज बुखार/\nबेहोश' },
  ];

  const emergencyContacts = [
    { id: 1, name: 'Local Health Centre', nameHi: 'स्थानीय स्वास्थ्य केंद्र', number: '1234567890' },
    { id: 2, name: 'ANM / PHC Contact', nameHi: 'ANM / PHC संपर्क', number: '0987654321' },
    { id: 3, name: 'District Health Officer', nameHi: 'जिला स्वास्थ्य अधिकारी', number: '1122334455' },
    { id: 4, name: 'Ambulance: 108', nameHi: 'एम्बुलेंस: 108', number: '108' },
  ];

  const firstAidSteps = {
    dehydration: 'Give ORS immediately, small frequent sips • तुरंत ORS दें, छोटे घूंट',
    blood: 'Urgent medical referral needed immediately • तुरंत चिकित्सा रेफरल की आवश्यकता',
    vomiting: 'Give small sips of clean boiled water • साफ उबला पानी छोटे घूंट में दें',
    fever: 'Keep patient cool, monitor temperature • रोगी को ठंडा रखें, तापमान की निगरानी करें',
  };

  const handleFlagCritical = () => {
    if (!selectedSymptom) {
      Alert.alert('Select Symptom', 'Please select a critical symptom first\nकृपया पहले एक गंभीर लक्षण चुनें');
      return;
    }

    const newPendingCount = pendingSync + 1;
    setPendingSync(newPendingCount);
    
    Alert.alert(
      'Case Flagged',
      `Critical case flagged offline.\nWill sync automatically.\nPending: ${newPendingCount}\n\nगंभीर मामला ऑफ़लाइन फ्लैग किया गया।\nस्वचालित रूप से सिंक होगा।`,
      [{ text: 'OK' }]
    );
  };

  const handleBeaconAlert = () => {
    Alert.alert(
      'Local Alert Sent',
      'Bluetooth alert sent to nearby ASHA workers.\nStored for sync.\n\nनिकटवर्ती ASHA कार्यकर्ताओं को ब्लूटूथ अलर्ट भेजा गया।',
      [{ text: 'OK' }]
    );
  };

  const handleCall = (number) => {
    Linking.canOpenURL(`tel:${number}`)
      .then((supported) => {
        if (supported) {
          Linking.openURL(`tel:${number}`);
        } else {
          Alert.alert('Cannot Call', 'Call requires mobile network\nकॉल के लिए मोबाइल नेटवर्क की आवश्यकता है');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to make call\nकॉल करने में असमर्थ');
      });
  };

  const handleSaveReport = () => {
    if (!selectedSymptom) {
      Alert.alert('Select Symptom', 'Please select a critical symptom first\nकृपया पहले एक गंभीर लक्षण चुनें');
      return;
    }

    const newPendingCount = pendingSync + 1;
    setPendingSync(newPendingCount);
    
    Alert.alert(
      'Report Saved',
      `Emergency report saved offline.\nPending sync: ${newPendingCount}\n\nआपातकालीन रिपोर्ट ऑफ़लाइन सहेजी गई।`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Emergency Help</Text>
          <Text style={styles.headerSubtitle}>आपातकालीन सहायता • Immediate actions</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Critical Symptom Quick-Select */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Critical Symptom • गंभीर लक्षण चुनें</Text>
          <View style={styles.symptomGrid}>
            {criticalSymptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom.id}
                style={[
                  styles.symptomTile,
                  selectedSymptom?.id === symptom.id && styles.symptomTileActive
                ]}
                onPress={() => setSelectedSymptom(symptom)}
                activeOpacity={0.7}
              >
                <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                <Text style={styles.symptomLabel}>{symptom.label}</Text>
                <Text style={styles.symptomLabelHi}>{symptom.labelHi}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* One-Tap Emergency Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Actions • आपातकालीन कार्रवाई</Text>
          
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handleFlagCritical}
          >
            <Text style={styles.emergencyButtonIcon}>🚨</Text>
            <View style={styles.emergencyButtonText}>
              <Text style={styles.emergencyButtonTitle}>Flag as Critical Case</Text>
              <Text style={styles.emergencyButtonSubtitle}>गंभीर मामले के रूप में फ्लैग करें</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handleBeaconAlert}
          >
            <Text style={styles.emergencyButtonIcon}>📡</Text>
            <View style={styles.emergencyButtonText}>
              <Text style={styles.emergencyButtonTitle}>Send Local Alert (Offline)</Text>
              <Text style={styles.emergencyButtonSubtitle}>स्थानीय अलर्ट भेजें (ऑफ़लाइन)</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts • आपातकालीन संपर्क</Text>
          <View style={styles.contactsCard}>
            {emergencyContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactRow}
                onPress={() => handleCall(contact.number)}
              >
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNameHi}>{contact.nameHi}</Text>
                  <Text style={styles.contactNumber}>{contact.number}</Text>
                </View>
                <View style={styles.callButton}>
                  <Text style={styles.callIcon}>📞</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.contactNote}>
            Call requires mobile network • कॉल के लिए मोबाइल नेटवर्क चाहिए
          </Text>
        </View>

        {/* First Aid Instructions */}
        {selectedSymptom && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>First Aid Steps • प्राथमिक चिकित्सा</Text>
            <View style={styles.firstAidCard}>
              <Text style={styles.firstAidIcon}>💡</Text>
              <Text style={styles.firstAidText}>
                {firstAidSteps[selectedSymptom.id]}
              </Text>
            </View>
          </View>
        )}

        {/* Photo / Note Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Info (Optional) • अतिरिक्त जानकारी</Text>
          <View style={styles.optionalActions}>
            <TouchableOpacity style={styles.optionalButton}>
              <Text style={styles.optionalButtonIcon}>📷</Text>
              <Text style={styles.optionalButtonText}>Add Photo • फोटो जोड़ें</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionalButton}>
              <Text style={styles.optionalButtonIcon}>📝</Text>
              <Text style={styles.optionalButtonText}>Add Note • नोट जोड़ें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveReport}>
          <Text style={styles.saveButtonText}>💾 Save Emergency Report Offline</Text>
          <Text style={styles.saveButtonSubtext}>आपातकालीन रिपोर्ट ऑफ़लाइन सहेजें</Text>
        </TouchableOpacity>
        <Text style={styles.syncCaption}>Pending sync: {pendingSync} • लंबित सिंक: {pendingSync}</Text>
      </View>
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
    paddingBottom: 140,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    paddingLeft: 2,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomTile: {
    width: (width - 56) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fca5a5',
    minHeight: 120,
  },
  symptomTileActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  symptomIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  symptomLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 16,
  },
  symptomLabelHi: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyButtonIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  emergencyButtonText: {
    flex: 1,
  },
  emergencyButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  emergencyButtonSubtitle: {
    fontSize: 13,
    color: '#fef2f2',
  },
  contactsCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginVertical: 4,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  contactNameHi: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  contactNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14b8a6',
    marginTop: 4,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#14b8a6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  callIcon: {
    fontSize: 24,
  },
  contactNote: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  firstAidCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  firstAidIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  firstAidText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    lineHeight: 20,
  },
  optionalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  optionalButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionalButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionalButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  saveButtonSubtext: {
    color: '#ffffff',
    fontSize: 13,
    marginTop: 4,
  },
  syncCaption: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
