import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Location } from '@cloud6/shared';
import { useJourney } from '../src/hooks/useJourney';
import { geocodingService } from '../src/services/location';
import {
  DestinationSearch,
  JourneyHeader,
  JourneyIntelligenceSection,
  JourneyMap,
  JourneyWeatherHero,
  JourneyWeatherSummary,
  JourneyWeatherTimeline,
  JourneyWeatherUnavailable,
  LocationField,
  RouteSummary,
  type DestinationCandidate,
} from '../src/components/journey';
import { BottomNav } from '../src/components/home';
import { Button, Card } from '../src/components/ui';
import { colors, spacing, typography } from '../src/theme';

const ERROR_MESSAGES: Record<string, string> = {
  LOCATION_UNAVAILABLE: "We couldn't get your location.",
  LOCATION_PERMISSION_DENIED: "We couldn't get your location.",
  LOCATION_TIMEOUT: "We couldn't get your location.",
  GEOCODING_FAILED: "We couldn't find that place.",
  ROUTE_NOT_FOUND: "We couldn't plan this route right now.",
  ROUTE_PROVIDER_ERROR: "We couldn't plan this route right now.",
  ROUTE_INVALID_COORDINATES: "We couldn't plan this route right now.",
  JOURNEY_INVALID_ROUTE: "We couldn't analyze weather along your route right now.",
  JOURNEY_INVALID_DEPARTURE_TIME: "We couldn't analyze weather along your route right now.",
  JOURNEY_INVALID_OPTIONS: "We couldn't analyze weather along your route right now.",
};

function friendlyError(code?: string): string {
  return (code && ERROR_MESSAGES[code]) || "Something went wrong. Please try again.";
}

/**
 * Production Journey screen: planning → route → journey weather. Composes
 * existing hooks/services only — useJourney() for location/route/weather
 * state, geocodingService (via DestinationSearch) for destination search,
 * MapView (via JourneyMap) for the route visualization. No routing/
 * geocoding/weather/transition logic lives here.
 */
export default function JourneyScreen() {
  const router = useRouter();
  const {
    start,
    route,
    journeyWeather,
    loading,
    error,
    loadStart,
    selectDestination,
    getRoute,
    planTimeline,
    journeyPlan,
    journeyIntelligence,
    persona,
    analyzeWeather,
    analyzeJourney,
  } = useJourney();

  const [selectedDestination, setSelectedDestination] = useState<DestinationCandidate | null>(null);
  const [startPlace, setStartPlace] = useState<Partial<Location> | null>(null);
  const [analyzingWeather, setAnalyzingWeather] = useState(false);
  const [insightRequested, setInsightRequested] = useState(false);

  useEffect(() => {
    loadStart();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!start) {
      setStartPlace(null);
      return;
    }
    let cancelled = false;
    geocodingService
      .reverseGeocode(start)
      .then((place) => {
        if (!cancelled) setStartPlace(place);
      })
      .catch(() => {
        if (!cancelled) setStartPlace(null);
      });
    return () => {
      cancelled = true;
    };
  }, [start?.latitude, start?.longitude]);

  // Chains planTimeline() -> analyzeWeather() across the two state
  // updates involved, rather than calling analyzeWeather() with a
  // stale (pre-planTimeline) journeyPlan closure.
  useEffect(() => {
    if (!analyzingWeather) return;
    if (error) {
      setAnalyzingWeather(false);
      return;
    }
    if (journeyPlan && !journeyWeather) {
      analyzeWeather().finally(() => setAnalyzingWeather(false));
    }
  }, [analyzingWeather, journeyPlan, journeyWeather, error, analyzeWeather]);

  function handleSelectDestination(candidate: DestinationCandidate) {
    setSelectedDestination(candidate);
    selectDestination(candidate.point);
  }

  function handleAnalyzeWeather() {
    setAnalyzingWeather(true);
    planTimeline();
  }

  async function handleSeeInsight() {
    setInsightRequested(true);
    await analyzeJourney();
  }

  const startLabel = startPlace?.city ?? startPlace?.name ?? null;
  const destinationLabel = selectedDestination?.label ?? 'Destination';
  const routeReady = !!route;
  const allWeatherUnavailable =
    !!journeyWeather && journeyWeather.summary.weatherAvailableCheckpoints === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <JourneyHeader
            title={routeReady ? 'Your Journey' : 'Plan a Journey'}
            onBack={() => router.push('/')}
          />

          {!routeReady && (
            <View style={styles.section}>
              <Text style={typography.cardTitle}>Where are you going?</Text>

              <View style={styles.field}>
                <LocationField
                  label="FROM"
                  value={startLabel}
                  unavailableText="Current location unavailable"
                  loading={loading && !start}
                  onRetry={loadStart}
                />
              </View>

              <View style={styles.connector}>
                <View style={styles.dot} />
                <View style={styles.connectorLine} />
                <View style={styles.dot} />
              </View>

              <View style={styles.field}>
                <DestinationSearch onSelect={handleSelectDestination} />
              </View>

              {error && <Text style={styles.errorText}>{friendlyError(error.code)}</Text>}

              <View style={styles.ctaRow}>
                <Button
                  title={loading ? 'Planning your route…' : 'Plan Journey →'}
                  onPress={getRoute}
                  disabled={!start || !selectedDestination || loading}
                />
              </View>
            </View>
          )}

          {routeReady && route && (
            <View style={styles.section}>
              <Text style={styles.routeTitle}>
                {startLabel ?? 'Your location'} → {destinationLabel}
              </Text>

              <JourneyMap
                start={route.start}
                destination={route.destination}
                routeCoordinates={route.coordinates}
              />

              <Card style={styles.summaryCard}>
                <RouteSummary distanceKm={route.distanceKm} durationMinutes={route.durationMinutes} />
              </Card>

              {!journeyWeather && error && (
                <Text style={styles.errorText}>{friendlyError(error.code)}</Text>
              )}

              {!journeyWeather && (
                <View style={styles.ctaRow}>
                  <Button
                    title={analyzingWeather ? 'Analyzing your route…' : 'Analyze Weather →'}
                    variant="secondary"
                    onPress={handleAnalyzeWeather}
                    disabled={analyzingWeather}
                  />
                  {analyzingWeather && (
                    <Text style={styles.loadingNote}>Checking weather along the journey</Text>
                  )}
                </View>
              )}

              {journeyWeather && allWeatherUnavailable && (
                <View style={styles.weatherSection}>
                  <JourneyWeatherUnavailable onRetry={handleAnalyzeWeather} />
                </View>
              )}

              {journeyWeather && !allWeatherUnavailable && (
                <View style={styles.weatherSection}>
                  <JourneyWeatherHero
                    checkpoints={journeyWeather.checkpoints}
                    summary={journeyWeather.summary}
                  />

                  <JourneyWeatherTimeline
                    checkpoints={journeyWeather.checkpoints}
                    summary={journeyWeather.summary}
                    startLabel={startLabel ?? 'Your location'}
                    destinationLabel={destinationLabel}
                  />

                  <JourneyWeatherSummary
                    summary={journeyWeather.summary}
                    checkpoints={journeyWeather.checkpoints}
                  />

                  <View style={styles.intelligenceSection}>
                    <JourneyIntelligenceSection
                      journeyWeather={journeyWeather}
                      journeyIntelligence={journeyIntelligence}
                      persona={persona}
                      requested={insightRequested}
                      loading={loading}
                      error={insightRequested ? error : null}
                      onAnalyze={handleSeeInsight}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  field: {
    marginTop: spacing.sm,
  },
  connector: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textTertiary,
  },
  connectorLine: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  ctaRow: {
    marginTop: spacing.md,
    alignItems: 'stretch',
  },
  errorText: {
    ...typography.bodySecondary,
    color: colors.danger,
  },
  routeTitle: {
    ...typography.cardTitle,
  },
  summaryCard: {
    paddingVertical: spacing.lg,
  },
  loadingNote: {
    ...typography.meta,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  weatherSection: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  intelligenceSection: {
    marginTop: spacing.md,
  },
});
