import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { triggerSOS } from '../services/api';

export default function SOS({ route }: any) {
  const { tripId } = route.params;

  useEffect(() => {
    triggerSOS(tripId).catch(console.error);
  }, [tripId]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>SOS Sent to Trusted Contacts!</Text>
      <Text style={styles.subtext}>Live location sharing is active.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffebee' },
  text: { fontSize: 24, fontWeight: 'bold', color: '#d32f2f', textAlign: 'center' },
  subtext: { fontSize: 16, marginTop: 10, color: '#333' }
});

