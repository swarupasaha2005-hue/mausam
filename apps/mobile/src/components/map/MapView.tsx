import { StyleSheet, Text, View } from 'react-native';
import type { MapViewProps } from './types';

/**
 * Native (iOS/Android) fallback. This prototype doesn't add a native map
 * SDK (react-native-maps requires native config/build steps this
 * environment can't verify) — Leaflet is web-only by nature. This
 * summarizes the same route data textually so the pipeline is still
 * demonstrable on-device; swap in a native map renderer here later
 * without touching routing/journey logic, which only depends on
 * `MapViewProps`.
 */
export default function MapView({ start, destination, routeCoordinates }: MapViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.note}>Map preview available on web. Route summary:</Text>
      {start && (
        <Text style={styles.point}>
          ● Start: {start.latitude.toFixed(4)}, {start.longitude.toFixed(4)}
        </Text>
      )}
      {destination && (
        <Text style={styles.point}>
          ● Destination: {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
        </Text>
      )}
      <Text style={styles.point}>Route points: {routeCoordinates.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: 4,
    padding: 12,
    justifyContent: 'center',
  },
  note: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 8,
  },
  point: {
    fontSize: 14,
    marginBottom: 4,
  },
});
