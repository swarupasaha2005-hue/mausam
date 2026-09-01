import { StyleSheet, Text, View } from 'react-native';
import type { JourneyWeatherCheckpoint, JourneyWeatherSummary as JourneyWeatherSummaryType } from '@cloud6/shared';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { formatCheckpointTime, formatDistanceKm } from './journeyWeatherFormat';

interface JourneyWeatherSummaryProps {
  summary: JourneyWeatherSummaryType;
  checkpoints: JourneyWeatherCheckpoint[];
}

/** Journey-level weather overview, sourced entirely from the backend's own summary — no re-derivation. */
export function JourneyWeatherSummary({ summary, checkpoints }: JourneyWeatherSummaryProps) {
  const hasRain = summary.rainAffectedCheckpointCount > 0;
  const totalCheckpoints = summary.weatherAvailableCheckpoints + summary.weatherUnavailableCheckpoints;
  const firstRainCheckpoint = checkpoints.find(
    (checkpoint) => checkpoint.sequence === summary.firstRainCheckpointSequence,
  );

  return (
    <Card>
      <Text style={typography.sectionTitle}>JOURNEY WEATHER</Text>

      <Text style={styles.headline}>{hasRain ? '🌧️ Rain expected' : '☀️ Mostly favorable'}</Text>
      <Text style={styles.subtext}>
        {hasRain
          ? `${summary.rainAffectedCheckpointCount} checkpoint${summary.rainAffectedCheckpointCount === 1 ? '' : 's'} affected`
          : 'Conditions remain fairly consistent throughout your route.'}
      </Text>

      {hasRain && firstRainCheckpoint && (
        <View style={styles.row}>
          <Text style={typography.label}>First likely rain</Text>
          <Text style={styles.value}>
            {formatCheckpointTime(firstRainCheckpoint.estimatedArrivalTime)} ·{' '}
            {formatDistanceKm(firstRainCheckpoint.distanceFromStartKm)}
          </Text>
        </View>
      )}

      {summary.weatherUnavailableCheckpoints > 0 && (
        <View style={styles.row}>
          <Text style={typography.label}>Weather coverage</Text>
          <Text style={styles.value}>
            {summary.weatherAvailableCheckpoints} / {totalCheckpoints} checkpoints
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headline: {
    ...typography.cardTitle,
    marginTop: spacing.md,
  },
  subtext: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  value: {
    ...typography.body,
    fontWeight: '600',
  },
});
