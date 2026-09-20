import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { sendReport, ReportPayload } from '../services/api';

const RATINGS = ['🟢', '🟡', '🔴'] as const;
const RATING_LABELS = {
  '🟢': 'Safe',
  '🟡': 'Okay',
  '🔴': 'Unsafe',
};

const TAGS = [
  'Poorly lit', 'Empty street', 'Harassment', 'Crowded',
  'No footpath', 'Broken streetlight', 'Suspicious activity',
  'Eve teasing', 'Theft', 'Accident prone',
];

export default function Report({ route, navigation }: any) {
  const { tripId } = route.params;
  const [rating, setRating] = useState<ReportPayload['rating']>('🟢');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) 
      ? prev.filter(t => t !== tag) 
      : [...prev, tag]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await sendReport(tripId, { rating, tags: selectedTags, note: note || undefined });
      Alert.alert('Report Submitted', 'Thank you for your feedback!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>How was your trip?</Text>
      <Text style={styles.subtitle}>Your feedback helps improve safety for everyone</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Safety</Text>
        <View style={styles.ratingRow}>
          {RATINGS.map(r => (
            <TouchableOpacity
              key={r}
              style={[
                styles.ratingBtn,
                rating === r && styles.ratingBtnSelected
              ]}
              onPress={() => setRating(r)}
            >
              <Text style={[
                styles.ratingEmoji,
                rating === r && styles.ratingEmojiSelected
              ]}>
                {r}
              </Text>
              <Text style={[
                styles.ratingLabel,
                rating === r && styles.ratingLabelSelected
              ]}>
                {RATING_LABELS[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tags (optional)</Text>
        <View style={styles.tagsContainer}>
          {TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagBtn,
                selectedTags.includes(tag) && styles.tagBtnSelected
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[
                styles.tagText,
                selectedTags.includes(tag) && styles.tagTextSelected
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes (optional)</Text>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          placeholder="Any details you'd like to share..."
          value={note}
          onChangeText={setNote}
        />
      </View>

      <View style={styles.submitContainer}>
        <Button
          title={submitting ? 'Submitting...' : 'Submit Report'}
          onPress={handleSubmit}
          disabled={submitting}
          color="#1976d2"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ratingBtn: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  ratingBtnSelected: { borderColor: '#2e7d32', backgroundColor: '#e8f5e9' },
  ratingEmoji: { fontSize: 32, marginBottom: 8 },
  ratingEmojiSelected: { transform: [{ scale: 1.1 }] },
  ratingLabel: { fontSize: 14, color: '#444' },
  ratingLabelSelected: { color: '#2e7d32', fontWeight: 'bold' },
  tagsContainer: { flexWrap: 'wrap', flexDirection: 'row', gap: 8 },
  tagBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#fafafa',
  },
  tagBtnSelected: { borderColor: '#1976d2', backgroundColor: '#e3f2fd' },
  tagText: { fontSize: 13, color: '#444' },
  tagTextSelected: { color: '#1976d2', fontWeight: '600' },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  submitContainer: { marginTop: 16 },
  });