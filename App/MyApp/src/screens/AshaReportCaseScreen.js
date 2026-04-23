import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, TextInput, Modal, Pressable, Image } from 'react-native';
import { Colors } from '../constants/Colors';

export default function AshaReportCaseScreen({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');

  const [symptom, setSymptom] = useState('Cough');
  const [severity, setSeverity] = useState('Mild');
  const [duration, setDuration] = useState('');

  const [sourceType, setSourceType] = useState('Handpump');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);

  // Simple cross-platform picker modal
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerOptions, setPickerOptions] = useState([]);
  const [pickerOnSelect, setPickerOnSelect] = useState(() => (v) => {});

  const openPicker = (title, options, onSelect) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerOnSelect(() => onSelect);
    setPickerVisible(true);
  };

  const ageOptions = ['0-5', '6-12', '13-18', '19-30', '31-45', '46-60', '60+'];
  const genderOptions = ['Male', 'Female', 'Other'];
  const symptomOptions = ['Cough', 'Fever', 'Diarrhea', 'Vomiting', 'Skin Rash'];
  const severityOptions = ['Mild', 'Moderate', 'Severe'];
  const sourceOptions = ['Handpump', 'Well', 'Tap', 'Tank', 'River', 'Unknown'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('AshaDashboard')}>
          <Text style={styles.topBack}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Report a Case</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Patient Details */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionIcon}>👤</Text>
          <Text style={styles.sectionTitle}>Pateint Details</Text>
        </View>
        <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#6b7280" value={name} onChangeText={setName} />

        <View style={styles.row2}>
          <TouchableOpacity
            style={[styles.input, styles.dropdown, styles.mr8]}
            onPress={() => openPicker('Select Age', ageOptions, setAge)}
          >
            <Text style={styles.placeholderText}>{age || 'Age'}</Text>
            <Text style={styles.caret}>▾</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.input, styles.dropdown]}
            onPress={() => openPicker('Select Gender', genderOptions, setGender)}
          >
            <Text style={styles.placeholderText}>{gender || 'Gender'}</Text>
            <Text style={styles.caret}>▾</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#6b7280" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        {/* Symptoms */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionIcon}>🧾</Text>
          <Text style={styles.sectionTitle}>Symptoms Details</Text>
        </View>
        <TouchableOpacity style={[styles.input, styles.dropdown]} onPress={() => openPicker('Select Symptom', symptomOptions, setSymptom)}>
          <Text style={styles.placeholderText}>{symptom}</Text>
          <Text style={styles.caret}>▾</Text>
        </TouchableOpacity>
        <View style={styles.row2}>
          <TouchableOpacity style={[styles.input, styles.dropdown, styles.mr8]} onPress={() => openPicker('Select Severity', severityOptions, setSeverity)}>
            <Text style={styles.placeholderText}>{severity}</Text>
            <Text style={styles.caret}>▾</Text>
          </TouchableOpacity>
          <TextInput style={styles.input} placeholder="Duration" placeholderTextColor="#6b7280" value={duration} onChangeText={setDuration} />
        </View>

        {/* Water Source */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionIcon}>🧰</Text>
          <Text style={styles.sectionTitle}>Water Source</Text>
        </View>
        <TouchableOpacity style={[styles.input, styles.dropdown]} onPress={() => openPicker('Select Water Source', sourceOptions, setSourceType)}>
          <Text style={styles.placeholderText}>{sourceType}</Text>
          <Text style={styles.caret}>▾</Text>
        </TouchableOpacity>
        <View style={[styles.input, styles.inputWithIcon]}> 
          <TextInput style={styles.flexInput} placeholder="Location" placeholderTextColor="#6b7280" value={location} onChangeText={setLocation} />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Use current location (static demo)"
            onPress={() => setLocation('28.6139, 77.2090 (Demo)')}
          >
            <Text style={{fontSize:16}}>📍</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => setPhotoAttached(true)}
        >
          <Text style={styles.uploadBtnText}>{photoAttached ? 'Change Photo (Demo)' : 'Upload Photo of Source (Optional)'}</Text>
        </TouchableOpacity>

        {photoAttached && (
          <View style={styles.photoRow}>
            <Image source={require('../assets/images/Dashboard.jpg')} style={styles.photoPreview} resizeMode="contain" />
            <TouchableOpacity style={styles.removeBtn} onPress={() => setPhotoAttached(false)}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Anything else"
          placeholderTextColor="#6b7280"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={() => navigation && navigation.navigate && navigation.navigate('AshaDashboard')}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Picker Modal */}
      <Modal
        transparent
        visible={pickerVisible}
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pickerTitle}</Text>
            {pickerOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.optionRow}
                onPress={() => {
                  pickerOnSelect(opt);
                  setPickerVisible(false);
                }}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setPickerVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Bottom nav */}
      <View style={styles.bottomBar}>
        <View style={styles.tabItem}><Text style={styles.tabIcon}>🏠</Text><Text style={styles.tabText}>Home</Text></View>
        <View style={styles.tabItem}><Text style={styles.tabIcon}>👤</Text><Text style={styles.tabText}>Profile</Text></View>
        <View style={styles.tabItem}><Text style={styles.tabIcon}>⚙️</Text><Text style={styles.tabText}>Settings</Text></View>
        <View style={styles.tabItem}><Text style={styles.tabIcon}>❓</Text><Text style={styles.tabText}>Help</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbff' },
  topBar: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBack: { color: 'white', fontSize: 18 },
  topTitle: { color: 'white', fontWeight: '800', fontSize: 16 },
  content: { padding: 16, paddingBottom: 110 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { color: '#111827', fontWeight: '800', fontSize: 16 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 10 },
  row2: { flexDirection: 'row', justifyContent: 'space-between' },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  mr8: { marginRight: 8 },
  caret: { color: '#6b7280' },
  placeholderText: { color: '#111827' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center' },
  flexInput: { flex: 1, color: '#111827' },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  uploadBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4, marginBottom: 10 },
  uploadBtnText: { color: 'white', fontWeight: '700' },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  photoPreview: { width: 72, height: 72, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginRight: 10 },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444', backgroundColor: '#fff' },
  removeBtnText: { color: '#ef4444', fontWeight: '700' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: 'white', fontWeight: '800' },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between'
  },
  tabItem: { alignItems: 'center' },
  tabIcon: { color: 'white' },
  tabText: { color: 'white', fontSize: 10, marginTop: 2 },

  // Modal styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', backgroundColor: 'white', borderRadius: 12, paddingVertical: 8, overflow: 'hidden' },
  modalTitle: { fontWeight: '800', color: '#111827', fontSize: 16, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  optionRow: { paddingHorizontal: 16, paddingVertical: 12 },
  optionText: { color: '#111827' },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', alignItems: 'center' },
  modalCancelText: { color: Colors.primary, fontWeight: '800' },
});
