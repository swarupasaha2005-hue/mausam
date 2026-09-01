import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeather } from '../src/hooks/useWeather';
import {
  CurrentWeatherHero,
  DailyForecast,
  HourlyForecast,
  WeatherHeader,
  WeatherPageInsight,
} from '../src/components/weather';
import { BottomNav } from '../src/components/home';
import { Button, Card } from '../src/components/ui';
import { colors, spacing, typography } from '../src/theme';

/**
 * Production Weather page: "what's happening at my current location."
 * Composes useWeather() (location + weatherService + personalization/
 * recommendation services) only — no weather/recommendation logic here.
 * Distinct from the Journey Weather experience, which answers "what
 * will I encounter along my route."
 */
export default function WeatherScreen() {
  const router = useRouter();
  const {
    location,
    locationError,
    locationLoading,
    current,
    currentError,
    currentLoading,
    hourly,
    hourlyError,
    hourlyLoading,
    daily,
    dailyError,
    dailyLoading,
    recommendation,
    refresh,
  } = useWeather();

  const locationLabel = location ? (location.city ?? location.name ?? null) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WeatherHeader locationLabel={locationLabel} loading={locationLoading} onRetry={refresh} />

        {locationError && !location && (
          <View style={styles.section}>
            <Card>
              <Text style={typography.cardTitle}>Location unavailable</Text>
              <Text style={styles.errorText}>
                We couldn't determine your current location.
              </Text>
              <View style={styles.retryButton}>
                <Button title="Try Again" variant="secondary" onPress={refresh} />
              </View>
            </Card>
          </View>
        )}

        {!locationError && (
          <>
            <View style={styles.section}>
              <CurrentWeatherHero
                weather={current}
                error={currentError}
                loading={currentLoading}
                locationLabel={locationLabel}
                onRetry={refresh}
              />
            </View>

            {recommendation?.primaryRecommendation && (
              <View style={styles.section}>
                <WeatherPageInsight recommendation={recommendation.primaryRecommendation} />
              </View>
            )}

            <View style={styles.section}>
              <HourlyForecast hours={hourly} loading={hourlyLoading} error={hourlyError} />
            </View>

            <View style={styles.section}>
              <DailyForecast days={daily} loading={dailyLoading} error={dailyError} />
            </View>

            <View style={styles.section}>
              <Card>
                <Text style={typography.sectionTitle}>PLANNING A TRIP?</Text>
                <Text style={styles.journeyBody}>
                  See the weather all along your route, not just here.
                </Text>
                <View style={styles.journeyButton}>
                  <Button
                    title="Check Weather Along My Route →"
                    variant="secondary"
                    onPress={() => router.push('/journey')}
                  />
                </View>
              </Card>
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginTop: spacing.lg,
  },
  errorText: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  journeyBody: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
  },
  journeyButton: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
});
