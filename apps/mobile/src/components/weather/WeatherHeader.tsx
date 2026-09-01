import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface WeatherHeaderProps {
  locationLabel: string | null;
  loading?: boolean;
  onRetry?: () => void;
}

/** Compact header: page title + resolved location, with a retry affordance on failure. */
export function WeatherHeader({ locationLabel, loading, onRetry }: WeatherHeaderProps) {
  return (
    <View>
      <Text style={typography.screenTitle}>Weather</Text>
      <View style={styles.locationRow}>
        <Text style={styles.pin}>📍</Text>
        <Text style={typography.bodySecondary}>
          {loading ? 'Finding you…' : (locationLabel ?? 'Current location')}
        </Text>
        {!loading && !locationLabel && onRetry && (
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pin: {
    fontSize: 13,
  },
  retry: {
    ...typography.meta,
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
