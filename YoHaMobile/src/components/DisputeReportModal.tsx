import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { brand, ink, radius, shadows } from '../theme';
import { hapticSuccess } from '../lib/haptics';

interface DisputeReportModalProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
}

export function DisputeReportModal({ visible, orderId, onClose }: DisputeReportModalProps) {
  const [issueType, setIssueType] = useState('missing');
  const [details, setDetails] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!details.trim()) {
      Alert.alert('Champs requis', 'Veuillez décrire le problème rencontré avec votre commande.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      hapticSuccess();
      Alert.alert(
        'Signalement transmis 🛡️',
        `Votre signalement pour la commande #${orderId} a bien été reçu par le support YoHa CHU. Notre équipe vous recontactera sous 15 minutes.`
      );
      setDetails('');
      setPhotoAttached(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🚨 Signaler un problème (Commande #{orderId})</Text>
          <Text style={styles.sub}>Notre équipe d'assistance CHU réagit immédiatement.</Text>

          <Text style={styles.label}>Type d'incident :</Text>
          <View style={styles.typeRow}>
            {[
              { id: 'missing', label: 'Article manquant 📦' },
              { id: 'delay', label: 'Retard important ⏳' },
              { id: 'quality', label: 'Qualité plat 🍲' },
            ].map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setIssueType(t.id)}
                style={[styles.typeChip, issueType === t.id && styles.typeChipActive]}
              >
                <Text style={[styles.chipText, issueType === t.id && styles.chipTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Détails de votre réclamation * :</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Ex: Il manque la boisson et la sauce algérienne..."
            placeholderTextColor="#a1a1aa"
            multiline
            numberOfLines={4}
            style={styles.textInput}
          />

          <Pressable
            onPress={() => {
              setPhotoAttached(true);
              Alert.alert('Photo jointe 📷', 'Preuve photo rattachée au signalement.');
            }}
            style={[styles.photoBtn, photoAttached && styles.photoBtnAttached]}
          >
            <Text style={styles.photoBtnText}>
              {photoAttached ? '✓ Photo de la commande jointe' : '📷 Joindre une photo de la commande'}
            </Text>
          </Pressable>

          <View style={styles.actionRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} style={styles.submitBtn} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Envoi...' : 'Envoyer la réclamation'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  title: { fontWeight: '800', fontSize: 16, color: ink[900] },
  sub: { fontSize: 12, color: ink[500], marginTop: 4, marginBottom: 16 },
  label: { fontWeight: '700', fontSize: 12, color: ink[700], marginBottom: 6, marginTop: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: '#e4e4e7', backgroundColor: '#fafafa' },
  typeChipActive: { backgroundColor: brand[500], borderColor: brand[500] },
  chipText: { fontSize: 11, fontWeight: '600', color: ink[700] },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },
  textInput: { borderWidth: 1, borderColor: '#e4e4e7', borderRadius: radius.lg, padding: 12, height: 90, textAlignVertical: 'top', fontSize: 13, color: ink[900], backgroundColor: '#fdfdfd' },
  photoBtn: { marginTop: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: '#e4e4e7', borderStyle: 'dashed', alignItems: 'center', backgroundColor: '#fafafa' },
  photoBtnAttached: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  photoBtnText: { fontSize: 12, fontWeight: '600', color: ink[700] },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: radius.lg, backgroundColor: '#f4f4f5' },
  cancelText: { color: ink[700], fontWeight: '700', fontSize: 13 },
  submitBtn: { flex: 2, padding: 12, alignItems: 'center', borderRadius: radius.lg, backgroundColor: brand[500] },
  submitText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
});
