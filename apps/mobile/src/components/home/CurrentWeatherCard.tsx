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
    <Card style={styles.card}>
      <Text style={typography.sectionTitle}>CURRENT WEATHER</Text>

      {weather && (
        <>
          <View style={styles.mainRow}>
            <View>
              <Text style={typography.hero}>{Math.round(weather.temperature)}°</Text>
              <Text style={styles.condition}>{weatherLabel(weather.weatherCode)}</Text>
            </View>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{weatherIcon(weather.weatherCode)}</Text>
            </View>
          </View>
          <View style={styles.pillRow}>
            <Pill label={`Feels like ${Math.round(weather.feelsLike)}°`} />
            <Pill label={`Humidity ${weather.humidity}%`} />
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
    ...typography.label,
    marginTop: spacing.xs,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 26,
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
