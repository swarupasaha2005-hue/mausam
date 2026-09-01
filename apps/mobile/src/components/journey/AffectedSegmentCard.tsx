import { StyleSheet, Text, View } from 'react-native';
import type { JourneyAffectedSegment } from '@cloud6/shared';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';

interface AffectedSegmentCardProps {
  segment: JourneyAffectedSegment;
}

/** Shows the backend-provided affected distance range — no segment math performed here. */
export function AffectedSegmentCard({ segment }: AffectedSegmentCardProps) {
  return (
    <Card>
      <Text style={typography.sectionTitle}>AFFECTED PART OF YOUR JOURNEY</Text>
      <View style={styles.rangeRow}>
        <Text style={styles.rangeValue}>{segment.fromDistanceKm.toFixed(1)} km</Text>
        <View style={styles.line} />
        <Text style={styles.rangeValue}>{segment.toDistanceKm.toFixed(1)} km</Text>
      </View>
      <Text style={styles.note}>Conditions may become difficult during this part of the route.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  rangeValue: {
    ...typography.body,
    fontWeight: '600',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  note: {
    ...typography.bodySecondary,
    marginTop: spacing.md,
  },
});
