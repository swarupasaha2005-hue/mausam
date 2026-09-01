import { StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '../ui';
import { spacing, typography } from '../../theme';

interface JourneyWeatherUnavailableProps {
  onRetry?: () => void;
}

/** Shown when every checkpoint's weather lookup failed — the route/map/distance stay visible above this. */
export function JourneyWeatherUnavailable({ onRetry }: JourneyWeatherUnavailableProps) {
  return (
    <Card>
      <Text style={typography.sectionTitle}>WEATHER UNAVAILABLE</Text>
      <Text style={styles.message}>
        We couldn't retrieve weather along this route right now.
      </Text>
      {onRetry && (
        <View style={styles.action}>
          <Button title="Try Again" variant="secondary" onPress={onRetry} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  message: {
    ...typography.bodySecondary,
    marginTop: spacing.md,
  },
  action: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
});
