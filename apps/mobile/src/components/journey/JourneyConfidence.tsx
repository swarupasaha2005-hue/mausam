import { StyleSheet, Text, View } from 'react-native';
import type { JourneyAnalysisConfidence } from '@cloud6/shared';
import { spacing, typography } from '../../theme';

interface JourneyConfidenceProps {
  confidence: JourneyAnalysisConfidence;
  weatherAvailableCheckpoints: number;
  weatherUnavailableCheckpoints: number;
}

const CONFIDENCE_LABEL: Record<JourneyAnalysisConfidence, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/** Transparency about weather data coverage — not a numeric/AI confidence score. */
export function JourneyConfidence({
  confidence,
  weatherAvailableCheckpoints,
  weatherUnavailableCheckpoints,
}: JourneyConfidenceProps) {
  const total = weatherAvailableCheckpoints + weatherUnavailableCheckpoints;

  return (
    <View style={styles.row}>
      <Text style={typography.meta}>Weather confidence · {CONFIDENCE_LABEL[confidence]}</Text>
      {weatherUnavailableCheckpoints > 0 && (
        <Text style={typography.meta}>
          Based on {weatherAvailableCheckpoints} of {total} checkpoints
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
  },
});
