import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TimeOfDay } from '@cloud6/shared';
import { TIME_OF_DAY_LABELS, TIME_OF_DAY_OPTIONS } from '@cloud6/shared';
import { colors, radius, spacing, typography } from '../../theme';

interface TimeOfDaySelectorProps {
  value: TimeOfDay;
  onSelect: (time: TimeOfDay) => void;
}

/** Preferred-time-of-day pills, sourced from the shared TIME_OF_DAY_OPTIONS enumeration. */
export function TimeOfDaySelector({ value, onSelect }: TimeOfDaySelectorProps) {
  return (
    <View style={styles.grid}>
      {TIME_OF_DAY_OPTIONS.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityLabel={`${TIME_OF_DAY_LABELS[option]} time of day`}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.option,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[typography.body, selected && styles.selectedText]}>
              {TIME_OF_DAY_LABELS[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 44,
    justifyContent: 'center',
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
});
