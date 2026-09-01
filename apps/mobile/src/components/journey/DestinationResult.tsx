import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface DestinationResultProps {
  label: string;
  sublabel?: string;
  onPress: () => void;
}

/** One selectable row in the destination search results list. */
export function DestinationResult({ label, sublabel, onPress }: DestinationResultProps) {
  return (
    <Pressable
      onPress={onPress}
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
    borderRadius: radius.sm,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  pin: {
    fontSize: 15,
  },
  textCol: {
    gap: 2,
  },
});
