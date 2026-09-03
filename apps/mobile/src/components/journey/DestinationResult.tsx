import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface DestinationResultProps {
  label: string;
  sublabel?: string;
  onPress: () => void;
}

/**
 * One selectable row in the destination search results list.
 *
 * Fires on `onPressIn`, not `onPress`. On web, clicking this row while
 * the search TextInput still has focus blurs that input on mousedown,
 * before mouseup/click completes — `onPress` (which only fires if
 * press-in and press-out resolve to the same target) can silently never
 * fire as a result. `onPressIn` fires immediately at press-start, before
 * that race window opens, so selection is unaffected by it.
 */
export function DestinationResult({ label, sublabel, onPress }: DestinationResultProps) {
  return (
    <Pressable
      onPressIn={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.pin}>📍</Text>
      <View style={styles.textCol}>
        <Text style={typography.body}>{label}</Text>
        {sublabel ? <Text style={typography.meta}>{sublabel}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.small,
  },
  pressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  pin: {
    fontSize: 15,
  },
  textCol: {
    gap: 2,
  },
});
