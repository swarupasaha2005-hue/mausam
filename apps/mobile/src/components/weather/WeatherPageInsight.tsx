import { StyleSheet, Text, View } from 'react-native';
import type { Recommendation } from '@cloud6/shared';
import { Card } from '../ui';
import { spacing, typography } from '../../theme';

interface WeatherPageInsightProps {
  recommendation: Recommendation | null;
}

const TYPE_ICON: Record<Recommendation['type'], string> = {
  FAVORABLE: '☀️',
  CAUTION: '⚠️',
  AVOID: '🚫',
  RESCHEDULE: '☂️',
  PREPARE: '🧭',
  ALERT: '🔺',
};

/**
 * Renders the existing RecommendationService's output only — no new
 * insight rules here. Omitted entirely (by the caller) when no
 * recommendation is available, rather than inventing one.
 */
export function WeatherPageInsight({ recommendation }: WeatherPageInsightProps) {
  if (!recommendation) {
    return null;
  }

  return (
    <Card>
      <Text style={typography.sectionTitle}>TODAY'S INSIGHT</Text>
      <View style={styles.row}>
        <Text style={styles.icon}>{TYPE_ICON[recommendation.type]}</Text>
        <Text style={styles.message}>{recommendation.message}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  icon: {
    fontSize: 18,
  },
  message: {
    ...typography.body,
    flex: 1,
  },
});
