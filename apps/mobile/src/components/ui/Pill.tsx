import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface PillProps {
  label: string;
  tone?: 'neutral' | 'surface';
}

/** Small rounded pill for a single piece of metadata (e.g. "Feels like 34°"). */
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
    backgroundColor: colors.background,
  },
  surface: {
    backgroundColor: colors.surface,
  },
});
