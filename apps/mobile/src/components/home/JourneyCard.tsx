import { StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '../ui';
import { spacing, typography } from '../../theme';

interface JourneyCardProps {
  onPlanJourney: () => void;
}

/**
 * CLOUD6's core differentiator, surfaced on Home. No journey persistence
 * exists yet, so this always renders the "plan a journey" empty state —
 * never a fabricated previous journey.
 */
export function JourneyCard({ onPlanJourney }: JourneyCardProps) {
  return (
    <Card tone="lavender">
      <Text style={typography.sectionTitle}>PLAN A JOURNEY</Text>
      <Text style={styles.title}>See the weather along your route</Text>
      <Text style={styles.body}>
        Where are you headed? CLOUD6 checks conditions all along the way, not just where you are
        now.
      </Text>
      <View style={styles.buttonRow}>
        <Button title="Plan Journey →" onPress={onPlanJourney} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.cardTitle,
    marginTop: spacing.sm,
  },
  body: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
  buttonRow: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
});
