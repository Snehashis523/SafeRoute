import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { startTrip } from '../services/api';

export default function RouteCompare({ route, navigation }: any) {
  const { routes } = route.params;

  const handleStart = async (selectedRoute: any) => {
    const res = await startTrip({
      origin: [88.36, 22.57],
      destination: [88.40, 22.60],
      mode: "driving",
      planned_route_geom: {},
      planned_segments: selectedRoute.segments
    });
    navigation.navigate('ActiveTrip', { tripId: res.trip_id });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Route</Text>
      <FlatList
        data={routes}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.scoreText}>Safety Score: {item.worst_segment_score.toFixed(2)}</Text>
            <Text>ETA: {Math.round(item.total_time_sec / 60)} mins</Text>
            <Button title="Start Trip" onPress={() => handleStart(item)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  title: { fontSize: 20, marginBottom: 10, fontWeight: 'bold' },
  card: { padding: 15, borderWidth: 1, borderColor: '#eee', marginBottom: 10, borderRadius: 5 },
  scoreText: { fontWeight: 'bold', marginBottom: 5 }
});

