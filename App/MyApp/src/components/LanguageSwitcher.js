import React, { useState } from 'react';
import { Modal, Pressable, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { setLanguage, getLanguage } from '../utils/i18n';
import { Colors } from '../constants/Colors';

const LANGS = [
  { tag: 'en', label: 'English' },
  { tag: 'as', label: 'অসমীয়া' },
  { tag: 'mni', label: 'ꯃꯩꯇꯩ' },
  { tag: 'brx', label: 'बड़ो' },
  { tag: 'lus', label: 'Mizo' },
  { tag: 'ne', label: 'नेपाली' },
  { tag: 'hi', label: 'हिन्दी' },
];

export default function LanguageSwitcher() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState('en');

  React.useEffect(() => {
    getLanguage().then(setCurrent);
  }, []);

  const choose = async (tag) => {
    await setLanguage(tag);
    setCurrent(tag);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Text style={{ color: 'white', fontSize: 16, marginHorizontal: 8 }}>A/अ</Text>
      </TouchableOpacity>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.card}>
            <Text style={styles.title}>Select language</Text>
            {LANGS.map((l) => (
              <TouchableOpacity key={l.tag} style={styles.row} onPress={() => choose(l.tag)}>
                <Text style={[styles.rowText, current === l.tag && styles.selected]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: 'white', borderRadius: 12, overflow: 'hidden' },
  title: { fontWeight: '800', color: '#111827', fontSize: 16, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  row: { paddingHorizontal: 16, paddingVertical: 12 },
  rowText: { color: '#111827' },
  selected: { color: Colors.primary, fontWeight: '800' },
});


