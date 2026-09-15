import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { planRoute } from '../services/api';

export default function Plan({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  const handlePlan = async () => {
    setLoading(true);
    try {
      // Mock origin/dest for MVP
      const origin = [88.36, 22.57];
      const dest = [88.40, 22.60];
      const routes = await planRoute(origin, dest, "driving", new Date().toISOString());
      navigation.navigate('RouteCompare', { routes });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Where to?</Text>
      <TextInput style={styles.input} placeholder="Destination" />
      <Button title={loading ? "Planning..." : "Find Routes"} onPress={handlePlan} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  label: { fontSize: 18, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 }
});

