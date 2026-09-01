import { StyleSheet, Text, View } from 'react-native';
import type { JourneyWeatherCheckpoint } from '@cloud6/shared';
import { colors, radius, spacing, typography } from '../../theme';
import { weatherIcon, weatherLabel } from '../home/weatherIcon';
import { formatCheckpointTime, formatDistanceKm } from './journeyWeatherFormat';

interface JourneyWeatherCheckpointCardProps {
  checkpoint: JourneyWeatherCheckpoint;
  kind?: 'start' | 'destination';
  locationLabel?: string | null;
  isFirstRain?: boolean;
}

/**
 * One checkpoint in the journey weather timeline — ETA, distance,
 * condition, temperature, and rain probability when relevant. Never
 * more than that: this screen is about understanding the journey, not
 * reading a full weather report.
 */
export function JourneyWeatherCheckpointCard({
  checkpoint,
  kind,
  locationLabel,
  isFirstRain,
}: JourneyWeatherCheckpointCardProps) {
  const { weather } = checkpoint;

  return (
    <View style={[styles.card, isFirstRain && styles.firstRain]}>
      <View style={styles.metaRow}>
        <Text style={styles.time}>{formatCheckpointTime(checkpoint.estimatedArrivalTime)}</Text>
        <Text style={styles.distance}>{formatDistanceKm(checkpoint.distanceFromStartKm)}</Text>
      </View>

      {kind && (
        <Text style={styles.kindLabel}>
          {kind === 'start' ? 'START' : 'DESTINATION'}
          {locationLabel ? ` · ${locationLabel}` : ''}
        </Text>
      )}

      {weather ? (
        <View style={styles.weatherRow}>
          <Text style={styles.icon}>{weatherIcon(weather.weatherCode)}</Text>
          <View>
            <Text style={styles.temperature}>{Math.round(weather.temperature)}°</Text>
            <Text style={styles.condition}>{weatherLabel(weather.weatherCode)}</Text>
            {weather.rainProbability > 0 && (
              <Text style={styles.rain}>{weather.rainProbability}% rain probability</Text>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.unavailable}>We couldn't retrieve weather here.</Text>
      )}

      {isFirstRain && <Text style={styles.rainFlag}>🌧️ Rain begins around here</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  firstRain: {
    borderColor: colors.weather.rainStrong,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    ...typography.label,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  distance: {
    ...typography.meta,
  },
  kindLabel: {
    ...typography.sectionTitle,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  icon: {
    fontSize: 30,
  },
  temperature: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  condition: {
    ...typography.bodySecondary,
  },
  rain: {
    ...typography.meta,
    color: colors.weather.rainStrong,
    marginTop: 2,
  },
  unavailable: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
  rainFlag: {
    ...typography.label,
    color: colors.weather.rainStrong,
    marginTop: spacing.xs,
  },
});
