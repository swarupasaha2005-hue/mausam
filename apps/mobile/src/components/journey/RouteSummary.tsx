import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../theme';

interface RouteSummaryProps {
  distanceKm: number;
  durationMinutes: number;
}

/** Just distance + duration — no coordinate counts, providers, or internal IDs. */
export function RouteSummary({ distanceKm, durationMinutes }: RouteSummaryProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.value}>{distanceKm.toFixed(1)} km</Text>
      <Text style={styles.value}>{Math.round(durationMinutes)} min</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  value: {
    ...typography.cardTitle,
  },
});
