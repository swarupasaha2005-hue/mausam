import { StyleSheet, Text, View } from 'react-native';
import type { JourneyRecommendation } from '@cloud6/shared';
import { Button, Card } from '../ui';
import { colors, spacing, typography } from '../../theme';

interface JourneyRecommendationCardProps {
  recommendation: JourneyRecommendation;
}

/**
 * recommendation.message + recommendation.action, verbatim from the
 * backend. The action is shown via the existing Button component but
 * disabled — CLOUD6 doesn't execute it (e.g. it can't actually change a
 * departure time), so it must never look like a live control.
 */
export function JourneyRecommendationCard({ recommendation }: JourneyRecommendationCardProps) {
  return (
    <Card>
      <Text style={styles.message}>{recommendation.message}</Text>
      <View style={styles.actionBlock}>
        <Text style={typography.sectionTitle}>CONSIDER</Text>
        <View style={styles.actionButton}>
          <Button title={recommendation.action} onPress={() => {}} disabled variant="secondary" />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  message: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actionBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    alignItems: 'flex-start',
  },
});
