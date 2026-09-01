import { StyleSheet, View } from 'react-native';
import type { GeoPoint } from '@cloud6/shared';
import { MapView } from '../map';
import { colors, radius } from '../../theme';

interface JourneyMapProps {
  start: GeoPoint | null;
  destination: GeoPoint | null;
  routeCoordinates: GeoPoint[];
}

/** Rounded-card wrapper around the existing MapView — no map logic of its own. */
export function JourneyMap({ start, destination, routeCoordinates }: JourneyMapProps) {
  return (
    <View style={styles.wrap}>
      <MapView start={start} destination={destination} routeCoordinates={routeCoordinates} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 220,
    borderRadius: radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
