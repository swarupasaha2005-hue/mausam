import { StyleSheet, Text } from 'react-native';
import type { Persona, WeatherPriority } from '@cloud6/shared';
import { PERSONA_DISPLAY, WEATHER_PRIORITY_DISPLAY } from '@cloud6/shared';
import { Card } from '../ui';
import { spacing, typography } from '../../theme';

interface PersonalizationPreviewProps {
  persona: Persona;
  priorities: WeatherPriority[];
}

/** Explains why the persona matters — a preview of configured priorities, not generated recommendation text. */
export function PersonalizationPreview({ persona, priorities }: PersonalizationPreviewProps) {
  const { displayName } = PERSONA_DISPLAY[persona];
  const labels = priorities.map((priority) => WEATHER_PRIORITY_DISPLAY[priority].label.toLowerCase());
  const priorityText = joinWithAnd(labels);

  return (
    <Card>
      <Text style={typography.sectionTitle}>YOUR WEATHER INSIGHTS</Text>
      <Text style={styles.title}>{displayName}</Text>
      <Text style={styles.body}>
        {priorityText
          ? `CLOUD6 will pay extra attention to ${priorityText} when generating your recommendations.`
          : 'CLOUD6 will personalize recommendations once weather priorities are available.'}
      </Text>
    </Card>
  );
}

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const styles = StyleSheet.create({
  title: {
    ...typography.cardTitle,
    marginTop: spacing.sm,
  },
  body: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
});
