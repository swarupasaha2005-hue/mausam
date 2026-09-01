import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui';
import { spacing, typography } from '../../theme';

interface JourneyReasonListProps {
  reasons: string[];
}

/** Renders analysis.reasons verbatim — already human-readable sentences from the backend. */
export function JourneyReasonList({ reasons }: JourneyReasonListProps) {
  if (reasons.length === 0) {
    return null;
  }

  return (
    <Card>
      <Text style={typography.sectionTitle}>WHY WE'RE SAYING THIS</Text>
      <View style={styles.list}>
        {reasons.map((reason, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.reason}>{reason}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    ...typography.body,
  },
  reason: {
    ...typography.body,
    flex: 1,
  },
});
