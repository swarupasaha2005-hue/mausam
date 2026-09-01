import { StyleSheet, Text, View } from 'react-native';
import type { CurrentWeather, WeatherError } from '@cloud6/shared';
import { Card, Pill } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { weatherIcon, weatherLabel } from './weatherIcon';

interface CurrentWeatherCardProps {
  weather: CurrentWeather | null;
  error: WeatherError | null;
  loading: boolean;
}

/** The primary, visually dominant Home card: temperature, condition, feels-like, humidity. */
export function CurrentWeatherCard({ weather, error, loading }: CurrentWeatherCardProps) {
  return (
    <Card tone="blue" style={styles.card}>
      <Text style={typography.sectionTitle}>CURRENT WEATHER</Text>

      {weather && (
        <>
          <View style={styles.mainRow}>
            <View>
              <Text style={typography.temperature}>{Math.round(weather.temperature)}°</Text>
              <Text style={styles.condition}>{weatherLabel(weather.weatherCode)}</Text>
            </View>
            <Text style={styles.icon}>{weatherIcon(weather.weatherCode)}</Text>
          </View>
          <View style={styles.pillRow}>
            <Pill label={`Feels like ${Math.round(weather.feelsLike)}°`} tone="surface" />
            <Pill label={`Humidity ${weather.humidity}%`} tone="surface" />
          </View>
        </>
      )}

      {!weather && loading && <Text style={styles.placeholder}>Checking the weather…</Text>}

      {!weather && !loading && error && (
        <Text style={styles.placeholder}>Weather isn't available right now.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  condition: {
    ...typography.cardTitle,
    marginTop: spacing.xs,
  },
  icon: {
    fontSize: 56,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  placeholder: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  },
});
