import { StyleSheet, Text, View } from 'react-native';
import type { HourlyWeather, WeatherError } from '@cloud6/shared';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { weatherIcon } from './weatherIcon';

interface HourlyPreviewProps {
  hours: HourlyWeather[];
  loading: boolean;
  error: WeatherError | null;
}

function formatHour(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric' });
}

/** Compact "next few hours" strip — not a full hourly dashboard. */
export function HourlyPreview({ hours, loading, error }: HourlyPreviewProps) {
  return (
    <Card>
      <Text style={typography.sectionTitle}>NEXT FEW HOURS</Text>

      {hours.length > 0 && (
        <View style={styles.row}>
          {hours.map((hour) => (
            <View key={hour.timestamp} style={styles.hour}>
              <Text style={typography.meta}>{formatHour(hour.timestamp)}</Text>
              <Text style={styles.icon}>{weatherIcon(hour.weatherCode)}</Text>
              <Text style={typography.body}>{Math.round(hour.temperature)}°</Text>
            </View>
          ))}
        </View>
      )}

      {hours.length === 0 && loading && (
        <Text style={styles.placeholder}>Loading the hourly outlook…</Text>
      )}

      {hours.length === 0 && !loading && error && (
        <Text style={styles.placeholder}>Hourly weather isn't available right now.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  hour: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: {
    fontSize: 22,
  },
  placeholder: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
