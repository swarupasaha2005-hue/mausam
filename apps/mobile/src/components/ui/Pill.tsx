import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface PillProps {
  label: string;
  tone?: 'neutral' | 'surface';
}

/** Minimal, compact metadata pill — a subtle border, not a filled color block. */
export function Pill({ label, tone = 'neutral' }: PillProps) {
  return (
    <View style={[styles.pill, tone === 'surface' && styles.surface]}>
      <Text style={typography.meta}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
