import { StyleSheet, Text, View } from 'react-native';
import type { CurrentWeather } from '@cloud6/shared';
import { colors, spacing, typography } from '../../theme';

interface WeatherMetricGridProps {
  weather: CurrentWeather;
}

/** Compact 2x2 grid of the most useful supporting fields — not a full data dump. */
export function WeatherMetricGrid({ weather }: WeatherMetricGridProps) {
  const metrics = [
    { label: 'Feels like', value: `${Math.round(weather.feelsLike)}°` },
    { label: 'Humidity', value: `${weather.humidity}%` },
    { label: 'Wind', value: `${Math.round(weather.windSpeed)} km/h` },
    { label: 'UV', value: String(weather.uvIndex) },
  ];

  return (
    <View style={styles.grid}>
      {metrics.map((metric) => (
        <View key={metric.label} style={styles.cell}>
          <Text style={typography.label}>{metric.label}</Text>
          <Text style={styles.value}>{metric.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cell: {
    width: '50%',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  value: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
});
