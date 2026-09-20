import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, Switch, TextInput, TouchableOpacity } from 'react-native';
import { VoiceHashes, testPhrase, getConfig, setVoiceConfig } from '../services/voice';

export default function VoiceSetup({ navigation }: any) {
  const [safeWord, setSafeWord] = useState('im fine');
  const [duressWord, setDuressWord] = useState('pineapple');
  const [enabled, setEnabled] = useState(true);
  const [testingSafe, setTestingSafe] = useState(false);
  const [testingDuress, setTestingDuress] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'safe' | 'duress'; match: boolean; confidence: number } | null>(null);
  const [hashes, setHashes] = useState<VoiceHashes | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const config = getConfig();
    if (config) {
      // Config now stores hashes, not plain words
      // Plain words are managed in component state
      setEnabled(config.enabled);
    }
  };

  const hashPhrase = async (phrase: string): Promise<string> => {
    const normalized = phrase.toLowerCase().replace(/[.,!?;:]/g, '').trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const saveConfig = async () => {
    if (!safeWord.trim() || !duressWord.trim()) {
      Alert.alert('Error', 'Both safe word and duress word are required');
      return;
    }
    
    if (safeWord.trim().toLowerCase() === duressWord.trim().toLowerCase()) {
      Alert.alert('Error', 'Safe word and duress word must be different');
      return;
    }

    setSaving(true);
    try {
      const safeHash = await hashPhrase(safeWord);
      const duressHash = await hashPhrase(duressWord);
      
      await setVoiceConfig(safeHash, duressHash, enabled);
      
      setHashes({ safeWordHash: safeHash, duressWordHash: duressHash });
      Alert.alert('Saved', 'Voice configuration saved successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testSafeWord = async () => {
    setTestingSafe(true);
    setTestResult(null);
    try {
      const safeHash = await hashPhrase(safeWord);
      const result = await testPhrase(safeWord, safeHash);
      setTestResult({ type: 'safe', ...result });
      Alert.alert(
        result.match ? 'Match!' : 'No Match',
        `Confidence: ${Math.round(result.confidence * 100)}%`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setTestingSafe(false);
    }
  };

  const testDuressWord = async () => {
    setTestingDuress(true);
    setTestResult(null);
    try {
      const duressHash = await hashPhrase(duressWord);
      const result = await testPhrase(duressWord, duressHash);
      setTestResult({ type: 'duress', ...result });
      Alert.alert(
        result.match ? 'Match!' : 'No Match',
        `Confidence: ${Math.round(result.confidence * 100)}%`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setTestingDuress(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Assistant Setup</Text>
      <Text style={styles.subtitle}>
        Set your safe word (de-escalates) and duress word (silent SOS).
        Duress word should sound natural but never be used casually.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safe Word</Text>
        <Text style={styles.helpText}>
          Say this to cancel an alert. Example: "I'm fine", "All good"
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., I'm fine"
          value={safeWord}
          onChangeText={setSafeWord}
          autoCapitalize="none"
        />
        <Button
          title={testingSafe ? 'Testing...' : 'Test Safe Word'}
          onPress={testSafeWord}
          disabled={testingSafe || testingDuress}
          color="#1976d2"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Duress Word</Text>
        <Text style={styles.helpText}>
          Say this to trigger silent SOS. Should sound normal but never used casually.
          Example: "pineapple", "blueberry", "coffee time"
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., pineapple"
          value={duressWord}
          onChangeText={setDuressWord}
          autoCapitalize="none"
        />
        <Button
          title={testingDuress ? 'Testing...' : 'Test Duress Word'}
          onPress={testDuressWord}
          disabled={testingSafe || testingDuress}
          color="#c62828"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Voice Assistant Enabled</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            thumbColor={enabled ? '#2e7d32' : '#ccc'}
            trackColor={{ false: '#ccc', true: '#a5d6a7' }}
          />
        </View>
        <Text style={styles.helpText}>
          When enabled, the app listens for your words during active trips only.
          Never runs in background. Runs on-device only — audio never leaves your phone.
        </Text>
      </View>

      {testResult && (
        <View style={[styles.resultBox, testResult.match ? styles.resultSuccess : styles.resultError]}>
          <Text style={styles.resultTitle}>
            {testResult.type === 'safe' ? 'Safe Word' : 'Duress Word'} Test
          </Text>
          <Text style={styles.resultText}>
            {testResult.match ? '✓ MATCH' : '✗ NO MATCH'}
          </Text>
          <Text style={styles.resultDetail}>
            Confidence: {Math.round(testResult.confidence * 100)}%
          </Text>
        </View>
      )}

      {hashes && (
        <View style={styles.hashInfo}>
          <Text style={styles.hashLabel}>Stored Hashes (never plaintext):</Text>
          <Text style={styles.hashValue} numberOfLines={1}>Safe: {hashes.safeWordHash.slice(0, 16)}...</Text>
          <Text style={styles.hashValue} numberOfLines={1}>Duress: {hashes.duressWordHash.slice(0, 16)}...</Text>
        </View>
      )}

      <Button
        title={saving ? 'Saving...' : 'Save Configuration'}
        onPress={saveConfig}
        disabled={saving}
        color="#2e7d32"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 20, lineHeight: 22 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  helpText: { color: '#666', fontSize: 13, marginBottom: 12, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12, backgroundColor: '#fafafa' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  toggleLabel: { fontSize: 16, fontWeight: '600' },
  resultBox: { padding: 16, borderRadius: 8, marginTop: 16 },
  resultSuccess: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#2e7d32' },
  resultError: { backgroundColor: '#fdeaea', borderWidth: 1, borderColor: '#c62828' },
  resultTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  resultText: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  resultDetail: { fontSize: 14, color: '#666' },
  hashInfo: { marginTop: 20, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  hashLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4, color: '#666' },
  hashValue: { fontSize: 12, fontFamily: 'monospace', color: '#444', marginBottom: 2 },
});