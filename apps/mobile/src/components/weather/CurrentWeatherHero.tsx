import { StyleSheet, Text, View } from 'react-native';
import type { CurrentWeather, WeatherError } from '@cloud6/shared';
import { Card, Button } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { weatherIcon, weatherLabel } from '../home/weatherIcon';
import { WeatherMetricGrid } from './WeatherMetricGrid';

interface CurrentWeatherHeroProps {
  weather: CurrentWeather | null;
  error: WeatherError | null;
  loading: boolean;
  locationLabel: string | null;
  onRetry: () => void;
}

/** The main card: current temperature, condition, and a compact metric grid. */
export function CurrentWeatherHero({
  weather,
  error,
  loading,
  locationLabel,
  onRetry,
}: CurrentWeatherHeroProps) {
  return (
    <Card>
      <Text style={typography.sectionTitle}>CURRENT WEATHER</Text>

      {weather && (
        <>
          <View style={styles.mainRow}>
            <View>
              <Text style={typography.hero}>{Math.round(weather.temperature)}°</Text>
              <Text style={styles.condition}>{weatherLabel(weather.weatherCode)}</Text>
              {locationLabel && <Text style={styles.location}>{locationLabel}</Text>}
            </View>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{weatherIcon(weather.weatherCode)}</Text>
            </View>
          </View>
          <WeatherMetricGrid weather={weather} />
        </>
      )}

      {!weather && loading && <Text style={styles.placeholder}>Checking current weather…</Text>}

      {!weather && !loading && error && (
        <View style={styles.errorBlock}>
          <Text style={typography.cardTitle}>WEATHER UNAVAILABLE</Text>
          <Text style={styles.placeholder}>We couldn't get the current weather right now.</Text>
          <View style={styles.retryButton}>
            <Button title="Try Again" variant="secondary" onPress={onRetry} />
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  condition: {
    ...typography.label,
    marginTop: spacing.xs,
  },
  location: {
    ...typography.meta,
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
  placeholder: {
    ...typography.bodySecondary,
    marginTop: spacing.md,
  },
  errorBlock: {
    marginTop: spacing.md,
  },
  retryButton: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
});
