import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { planRoute } from '../services/api';

export default function Plan({ navigation }: any) {
  const [origin, setOrigin] = useState('[88.36, 22.57]');
  const [destination, setDestination] = useState('[88.40, 22.60]');
  const [mode, setMode] = useState<'walk' | 'driving'>('walk');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePlan = async () => {
    setLoading(true);
    setError('');
    try {
      let originCoords: number[];
      let destCoords: number[];
      
      try {
        originCoords = JSON.parse(origin);
        destCoords = JSON.parse(destination);
      } catch {
        throw new Error('Invalid coordinate format. Use [lon, lat]');
      }
      
      if (!Array.isArray(originCoords) || originCoords.length !== 2 ||
          !Array.isArray(destCoords) || destCoords.length !== 2) {
        throw new Error('Coordinates must be [longitude, latitude]');
      }
      
      const routes = await planRoute({
        origin: originCoords,
        destination: destCoords,
        mode,
        depart_at: new Date().toISOString(),
      });
      
      navigation.navigate('RouteCompare', { routes, origin: originCoords, destination: destCoords, mode });
    } catch (e: any) {
      setError(e.message || 'Failed to plan route');
      Alert.alert('Error', e.message || 'Failed to plan route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Origin [lon, lat]</Text>
      <TextInput
        style={styles.input}
        value={origin}
        onChangeText={setOrigin}
        placeholder="[88.36, 22.57]"
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>Destination [lon, lat]</Text>
      <TextInput
        style={styles.input}
        value={destination}
        onChangeText={setDestination}
        placeholder="[88.40, 22.60]"
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>Mode</Text>
      <View style={styles.modeRow}>
        <Button
          title={mode === 'walk' ? '● Walk' : 'Walk'}
          onPress={() => setMode('walk')}
          color={mode === 'walk' ? '#1976d2' : '#ccc'}
        />
        <Button
          title={mode === 'driving' ? '● Drive' : 'Drive'}
          onPress={() => setMode('driving')}
          color={mode === 'driving' ? '#1976d2' : '#ccc'}
        />
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      <Button
        title={loading ? 'Planning...' : 'Find Routes'}
        onPress={handlePlan}
        disabled={loading}
      />
      
      {loading && <ActivityIndicator style={styles.spinner} size="large" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white', justifyContent: 'center' },
  label: { fontSize: 16, marginBottom: 5, marginTop: 15, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 10, borderRadius: 5, fontFamily: 'monospace' },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  error: { color: '#d32f2f', marginTop: 10, textAlign: 'center' },
  spinner: { marginTop: 20 },
});