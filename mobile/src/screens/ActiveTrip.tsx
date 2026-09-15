import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView } from 'react-native';
import { TripWebSocket } from '../services/ws';

export default function ActiveTrip({ route, navigation }: any) {
  const { tripId } = route.params;
  const [level, setLevel] = useState("L0_Normal");

  useEffect(() => {
    const ws = new TripWebSocket(tripId, (data) => {
      if (data.level) setLevel(data.level);
    });
    ws.connect();

    return () => ws.disconnect();
  }, [tripId]);

  return (
    <SafeAreaView style={styles.container}>
      {level !== "L0_Normal" && level !== "L1_Watch" && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Escalation Level: {level}</Text>
        </View>
      )}
      <View style={styles.mapPlaceholder}>
        <Text>Map View Active</Text>
        <Text>Trip ID: {tripId}</Text>
      </View>
      <View style={styles.footer}>
        <Button title="SOS" color="#d32f2f" onPress={() => navigation.navigate('SOS', { tripId })} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  banner: { backgroundColor: '#ff9800', padding: 15, alignItems: 'center' },
  bannerText: { fontWeight: 'bold', color: 'white' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  footer: { padding: 20, paddingBottom: 40, backgroundColor: 'white' }
});

