import { StyleSheet, Text, View } from 'react-native';
import type { JourneyIntelligence, JourneyWeatherPlan, Persona } from '@cloud6/shared';
import { Button, Card } from '../ui';
import { spacing, typography } from '../../theme';
import { AffectedSegmentCard } from './AffectedSegmentCard';
import { JourneyConfidence } from './JourneyConfidence';
import { JourneyInsightCard } from './JourneyInsightCard';
import { JourneyReasonList } from './JourneyReasonList';
import { JourneyRecommendationCard } from './JourneyRecommendationCard';

interface JourneyIntelligenceSectionProps {
  journeyWeather: JourneyWeatherPlan | null;
  journeyIntelligence: JourneyIntelligence | null;
  persona: Persona;
  requested: boolean;
  loading: boolean;
  /** Only the error's presence/absence is used here — the friendly message is chosen by this component. */
  error: { code: string; message: string } | null;
  onAnalyze: () => void;
}

/**
 * Top-level Journey Intelligence presentation — composes the smaller
 * insight/recommendation/reasons/segment/confidence components. Reads
 * an already-produced JourneyIntelligence only; calculates nothing.
 */
export function JourneyIntelligenceSection({
  journeyWeather,
  journeyIntelligence,
  persona,
  requested,
  loading,
  error,
  onAnalyze,
}: JourneyIntelligenceSectionProps) {
  if (!journeyWeather) {
    return (
      <Card>
        <Text style={typography.sectionTitle}>PLAN A JOURNEY FIRST</Text>
        <Text style={styles.message}>
          CLOUD6 needs a route and weather data before it can generate a journey insight.
        </Text>
      </Card>
    );
  }

  if (requested && loading && !journeyIntelligence) {
    return (
      <Card>
        <Text style={typography.cardTitle}>Understanding your journey…</Text>
        <Text style={styles.message}>
          Turning the weather along your route into a personalized insight.
        </Text>
      </Card>
    );
  }

  if (requested && error && !journeyIntelligence) {
    return (
      <Card>
        <Text style={typography.sectionTitle}>JOURNEY INSIGHT UNAVAILABLE</Text>
        <Text style={styles.message}>We couldn't generate an insight for this journey right now.</Text>
        <View style={styles.action}>
          <Button title="Try Again" variant="secondary" onPress={onAnalyze} />
        </View>
      </Card>
    );
  }

  if (!journeyIntelligence) {
    return (
      <View style={styles.action}>
        <Button title="See Journey Insight →" onPress={onAnalyze} />
      </View>
    );
  }

  const { analysis, recommendation } = journeyIntelligence;

  if (analysis.weatherAvailableCheckpoints === 0) {
    return (
      <Card>
        <Text style={typography.sectionTitle}>JOURNEY INSIGHT UNAVAILABLE</Text>
        <Text style={styles.message}>
          We don't have enough weather data to assess this journey right now.
        </Text>
      </Card>
    );
  }

  return (
    <View style={styles.stack}>
      <JourneyInsightCard analysis={analysis} recommendation={recommendation} persona={persona} />
      <JourneyRecommendationCard recommendation={recommendation} />
      <JourneyReasonList reasons={analysis.reasons} />
      {analysis.affectedSegment && <AffectedSegmentCard segment={analysis.affectedSegment} />}
      <JourneyConfidence
        confidence={analysis.confidence}
        weatherAvailableCheckpoints={analysis.weatherAvailableCheckpoints}
        weatherUnavailableCheckpoints={analysis.weatherUnavailableCheckpoints}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    ...typography.bodySecondary,
    marginTop: spacing.md,
  },
  action: {
    marginTop: spacing.md,
    alignItems: 'stretch',
  },
  stack: {
    gap: spacing.lg,
  },
});
