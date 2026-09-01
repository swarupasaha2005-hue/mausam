import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Activity } from '@cloud6/shared';
import { ACTIVITIES, ACTIVITY_LABELS } from '@cloud6/shared';
import { colors, radius, spacing, typography } from '../../theme';

interface ActivitySelectorProps {
  selected: Activity[];
  onToggle: (activity: Activity) => void;
}

/** Multi-select activity pills, sourced from the shared ACTIVITIES enumeration. */
export function ActivitySelector({ selected, onToggle }: ActivitySelectorProps) {
  return (
    <View style={styles.grid}>
      {ACTIVITIES.map((activity) => {
        const isSelected = selected.includes(activity);
        return (
          <Pressable
            key={activity}
            onPress={() => onToggle(activity)}
            accessibilityRole="button"
            accessibilityLabel={`${ACTIVITY_LABELS[activity]} activity`}
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[typography.body, isSelected && styles.selectedText]}>
              {ACTIVITY_LABELS[activity]}
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
