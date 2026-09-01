import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Persona } from '@cloud6/shared';
import { PERSONA_DISPLAY } from '@cloud6/shared';
import { colors, radius, spacing, typography } from '../../theme';

interface PersonaOptionProps {
  persona: Persona;
  selected: boolean;
  onPress: () => void;
}

/** One selectable persona pill — touch-friendly, selected state shown via fill + border, not color alone. */
export function PersonaOption({ persona, selected, onPress }: PersonaOptionProps) {
  const { icon, displayName } = PERSONA_DISPLAY[persona];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName} persona`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View>
        <Text style={[typography.body, selected && styles.selectedText]}>{displayName}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 44,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedText: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    fontSize: 18,
  },
});
