import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePersonalizedWeather } from '../src/hooks/usePersonalizedWeather';
import { useHourlyPreview } from '../src/hooks/useHourlyPreview';
import {
  BottomNav,
  CurrentWeatherCard,
  HomeHeader,
  HourlyPreview,
  JourneyCard,
  WeatherInsightCard,
} from '../src/components/home';
import { colors, spacing } from '../src/theme';

/**
 * CLOUD6 production Home screen. Composes existing hooks/services only —
 * no weather/recommendation/journey business logic lives here.
 */
export default function Home() {
  const router = useRouter();
  const {
    location,
    locationError,
    weather,
    weatherError,
    recommendation,
    recommendationError,
    status,
  } = usePersonalizedWeather();
  const hourly = useHourlyPreview(location);

  const locationLabel = location
    ? (location.city ?? location.name ?? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`)
    : locationError
      ? 'Location unavailable'
      : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HomeHeader locationLabel={locationLabel} onAvatarPress={() => router.push('/profile')} />

        <View style={styles.section}>
          <CurrentWeatherCard weather={weather} error={weatherError} loading={status === 'loading'} />
        </View>

        <View style={styles.section}>
          <WeatherInsightCard
            recommendation={recommendation?.primaryRecommendation ?? null}
            error={recommendationError}
            loading={status === 'loading'}
          />
        </View>

        <View style={styles.section}>
          <JourneyCard onPlanJourney={() => router.push('/journey')} />
        </View>

        <View style={styles.section}>
          <HourlyPreview hours={hourly.hours} loading={hourly.loading} error={hourly.error} />
        </View>
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
    gap: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
});
