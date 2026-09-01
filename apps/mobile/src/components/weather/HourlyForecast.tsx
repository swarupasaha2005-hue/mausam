import { ScrollView, StyleSheet, Text } from 'react-native';
import type { HourlyWeather, WeatherError } from '@cloud6/shared';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { HourlyForecastItem } from './HourlyForecastItem';

interface HourlyForecastProps {
  hours: HourlyWeather[];
  loading: boolean;
  error: WeatherError | null;
}

/** Horizontally scrollable hourly strip — compact, not a spreadsheet. */
export function HourlyForecast({ hours, loading, error }: HourlyForecastProps) {
  return (
    <Card>
      <Text style={typography.sectionTitle}>NEXT FEW HOURS</Text>

      {hours.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {hours.map((hour) => (
            <HourlyForecastItem key={hour.timestamp} hour={hour} />
          ))}
        </ScrollView>
      )}

      {hours.length === 0 && loading && (
        <Text style={styles.placeholder}>Loading hourly forecast…</Text>
      )}

      {hours.length === 0 && !loading && error && (
        <Text style={styles.placeholder}>Hourly forecast unavailable right now.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingRight: spacing.sm,
  },
  placeholder: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
