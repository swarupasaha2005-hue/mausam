import { StyleSheet, Text, View } from 'react-native';
import type { WeatherPriority } from '@cloud6/shared';
import { WEATHER_PRIORITY_DISPLAY } from '@cloud6/shared';
import { Pill } from '../ui';
import { spacing, typography } from '../../theme';

interface WeatherPriorityPreviewProps {
  priorities: WeatherPriority[];
}

/** Read-only preview of weatherPriorities from UserContext — no manual editing, no internal terminology. */
export function WeatherPriorityPreview({ priorities }: WeatherPriorityPreviewProps) {
  if (priorities.length === 0) {
    return (
      <Text style={styles.empty}>Choose a persona to see what CLOUD6 will watch for.</Text>
    );
  }

  return (
    <View style={styles.row}>
      {priorities.map((priority) => {
        const { icon, label } = WEATHER_PRIORITY_DISPLAY[priority];
        return <Pill key={priority} label={`${icon} ${label}`} tone="surface" />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  empty: {
    ...typography.bodySecondary,
  },
});
