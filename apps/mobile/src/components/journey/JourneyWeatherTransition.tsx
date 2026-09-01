import { StyleSheet, Text, View } from 'react-native';
import type { JourneyWeatherTransition as JourneyWeatherTransitionType } from '@cloud6/shared';
import { colors, spacing, typography } from '../../theme';
import { weatherLabel } from '../home/weatherIcon';

interface JourneyWeatherTransitionProps {
  transition: JourneyWeatherTransitionType;
}

/** Inline marker shown between two checkpoints where the backend detected a condition change. */
export function JourneyWeatherTransition({ transition }: JourneyWeatherTransitionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
      <Text style={styles.label}>
        {weatherLabel(transition.fromCondition)} → {weatherLabel(transition.toCondition)}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.xl,
    marginVertical: spacing.xs,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  label: {
    ...typography.meta,
    color: colors.textSecondary,
  },
});
