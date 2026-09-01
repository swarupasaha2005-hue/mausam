import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { JourneyWeatherCheckpoint, JourneyWeatherSummary } from '@cloud6/shared';
import { colors, spacing, typography } from '../../theme';
import { JourneyWeatherCheckpointCard } from './JourneyWeatherCheckpointCard';
import { JourneyWeatherTransition } from './JourneyWeatherTransition';

interface JourneyWeatherTimelineProps {
  checkpoints: JourneyWeatherCheckpoint[];
  summary: JourneyWeatherSummary;
  startLabel?: string | null;
  destinationLabel?: string | null;
}

/**
 * Vertical journey/weather timeline — the main feature of this screen.
 * Purely presentational: transitions and the first-rain checkpoint are
 * both read directly from the backend-provided summary, never
 * recomputed here.
 */
export function JourneyWeatherTimeline({
  checkpoints,
  summary,
  startLabel,
  destinationLabel,
}: JourneyWeatherTimelineProps) {
  return (
    <View>
      <Text style={typography.sectionTitle}>WEATHER TIMELINE</Text>
      <View style={styles.list}>
        {checkpoints.map((checkpoint, index) => {
          const isStart = index === 0;
          const isDestination = index === checkpoints.length - 1;
          const transition = summary.transitions.find(
            (item) =>
              item.fromSequence === checkpoint.sequence &&
              index + 1 < checkpoints.length &&
              item.toSequence === checkpoints[index + 1].sequence,
          );

          return (
            <Fragment key={checkpoint.sequence}>
              <View style={styles.row}>
                <View style={styles.railColumn}>
                  <View style={styles.dot} />
                  {!isDestination && <View style={styles.rail} />}
                </View>
                <View style={styles.cardColumn}>
                  <JourneyWeatherCheckpointCard
                    checkpoint={checkpoint}
                    kind={isStart ? 'start' : isDestination ? 'destination' : undefined}
                    locationLabel={isStart ? startLabel : isDestination ? destinationLabel : null}
                    isFirstRain={summary.firstRainCheckpointSequence === checkpoint.sequence}
                  />
                </View>
              </View>
              {transition && <JourneyWeatherTransition transition={transition} />}
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  railColumn: {
    width: 12,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  rail: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  cardColumn: {
    flex: 1,
    marginBottom: spacing.md,
  },
});
