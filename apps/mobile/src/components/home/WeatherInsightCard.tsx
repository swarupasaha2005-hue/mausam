import { StyleSheet, Text, View } from 'react-native';
import type { Recommendation, RecommendationError } from '@cloud6/shared';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';

interface WeatherInsightCardProps {
  recommendation: Recommendation | null;
  error: RecommendationError | null;
  loading: boolean;
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
 * insight rules live here. Falls back to a graceful neutral state when
 * no recommendation is available yet.
 */
export function WeatherInsightCard({ recommendation, error, loading }: WeatherInsightCardProps) {
  if (recommendation) {
    return (
      <Card tone="mint">
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{TYPE_ICON[recommendation.type]}</Text>
          <Text style={typography.cardTitle}>{recommendation.title}</Text>
        </View>
        <Text style={styles.message}>{recommendation.message}</Text>
      </Card>
    );
  }

  return (
    <Card tone="mint">
      <View style={styles.titleRow}>
        <Text style={styles.icon}>💭</Text>
        <Text style={typography.cardTitle}>
          {loading ? 'Preparing your insight…' : 'No insight available right now'}
        </Text>
      </View>
      {!loading && (
        <Text style={styles.message}>
          {error
            ? "We couldn't generate a personalized insight right now."
            : 'Check back once your weather has loaded.'}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 22,
  },
  message: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
});
