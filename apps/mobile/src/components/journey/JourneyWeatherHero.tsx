import { StyleSheet, Text, View } from 'react-native';
import type { JourneyWeatherCheckpoint, JourneyWeatherSummary } from '@cloud6/shared';
import { Card } from '../ui';
import { spacing, typography } from '../../theme';
import { weatherIcon } from '../home/weatherIcon';

interface JourneyWeatherHeroProps {
  checkpoints: JourneyWeatherCheckpoint[];
  summary: JourneyWeatherSummary;
}

const MAX_ICONS = 4;

/**
 * Minimal summary card: an icon sequence + one sentence. The sequence
 * and "consistent vs. changing" wording both come directly from the
 * backend's own `summary.transitions` — no transition detection here.
 */
export function JourneyWeatherHero({ checkpoints, summary }: JourneyWeatherHeroProps) {
  const firstAvailable = checkpoints.find((checkpoint) => checkpoint.weather)?.weather;
  if (!firstAvailable) {
    return null;
  }

  const conditions = [
    firstAvailable.weatherCode,
    ...summary.transitions.map((transition) => transition.toCondition),
  ].slice(0, MAX_ICONS);

  const message =
    summary.transitions.length > 0
      ? 'Conditions change during your journey.'
      : 'Conditions look fairly consistent throughout your journey.';

  return (
    <Card>
      <Text style={typography.sectionTitle}>WEATHER ALONG YOUR ROUTE</Text>
      <View style={styles.iconRow}>
        {conditions.map((code, index) => (
          <View key={`${code}-${index}`} style={styles.iconGroup}>
            <Text style={styles.icon}>{weatherIcon(code)}</Text>
            {index < conditions.length - 1 && <Text style={styles.arrow}>→</Text>}
          </View>
        ))}
      </View>
      <Text style={styles.message}>{message}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 28,
  },
  arrow: {
    ...typography.meta,
    marginHorizontal: spacing.xs,
  },
  message: {
    ...typography.bodySecondary,
    marginTop: spacing.md,
  },
});
