import { StyleSheet, Text, View } from 'react-native';
import type { JourneyRiskLevel } from '@cloud6/shared';
import { colors, radius, spacing, typography } from '../../theme';

interface JourneyRiskBadgeProps {
  riskLevel: JourneyRiskLevel;
}

/**
 * Reuses the existing JourneyRiskLevel (RecommendationPriority) scale —
 * no separate risk system, no numeric score. Colors are restrained: a
 * small dot + label, never a filled alarm banner.
 */
const RISK_CONFIG: Record<JourneyRiskLevel, { label: string; color: string }> = {
  low: { label: 'LOW IMPACT', color: colors.success },
  medium: { label: 'MODERATE IMPACT', color: colors.warning },
  high: { label: 'HIGH IMPACT', color: colors.danger },
  severe: { label: 'SEVERE CONDITIONS', color: colors.danger },
};

export function JourneyRiskBadge({ riskLevel }: JourneyRiskBadgeProps) {
  const config = RISK_CONFIG[riskLevel];
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    ...typography.label,
    fontWeight: '700',
  },
});
