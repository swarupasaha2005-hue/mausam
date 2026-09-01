import { StyleSheet, Text, View } from 'react-native';
import type { JourneyAnalysis, JourneyRecommendation, Persona } from '@cloud6/shared';
import { Card } from '../ui';
import { spacing, typography } from '../../theme';
import { JourneyRiskBadge } from './JourneyRiskBadge';
import { personaContextLabel } from './personaLabel';

interface JourneyInsightCardProps {
  analysis: JourneyAnalysis;
  recommendation: JourneyRecommendation;
  persona: Persona;
}

/**
 * The hero of the intelligence screen — answers "how does my journey
 * look?" in one glance. Headline comes from recommendation.title, the
 * supporting line from analysis.primaryConcern — both backend-owned,
 * nothing composed in the UI.
 */
export function JourneyInsightCard({ analysis, recommendation, persona }: JourneyInsightCardProps) {
  const isFavorable = recommendation.type === 'FAVORABLE';

  return (
    <Card>
      <Text style={styles.headline}>
        {isFavorable ? '✓ ' : ''}
        {recommendation.title}
      </Text>
      <Text style={styles.subtext}>{analysis.primaryConcern}</Text>
      <View style={styles.metaRow}>
        <JourneyRiskBadge riskLevel={analysis.riskLevel} />
        <Text style={styles.personaLabel}>{personaContextLabel(persona)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headline: {
    ...typography.screenTitle,
  },
  subtext: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  personaLabel: {
    ...typography.meta,
  },
});
