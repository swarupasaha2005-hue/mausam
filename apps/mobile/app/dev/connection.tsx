import { useState, type ReactNode } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import type {
  GeoPoint,
  JourneyIntelligence,
  JourneyPlan,
  JourneyWeatherPlan,
  Route,
  WeatherSnapshot,
} from '@cloud6/shared';
import { geocodingService, locationService, mockDeviceLocationProvider } from '../../src/services/location';
import { expoDeviceLocationProvider } from '../../src/services/location/expoDeviceLocationProvider';
import { weatherService } from '../../src/services/weather';
import { routingService } from '../../src/services/routing';
import { journeyService } from '../../src/services/journey';
import { personalizationService } from '../../src/services/personalization';

/** Only for this diagnostic screen — not used by production location behavior. */
const TEST_COORDINATES: GeoPoint = { latitude: 22.5726, longitude: 88.3639 };

type ResultState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'success'; detail: string }
  | { status: 'error'; detail: string };

const IDLE: ResultState = { status: 'idle' };

function describeError(cause: unknown): string {
  if (cause && typeof cause === 'object' && 'code' in cause) {
    const withCode = cause as { code: unknown; message?: unknown };
    return `${String(withCode.code)}${withCode.message ? `: ${String(withCode.message)}` : ''}`;
  }
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * DEVELOPMENT / TESTING ONLY. Runs the exact production services
 * (locationService, geocodingService, weatherService, routingService,
 * journeyService, personalizationService) against the real running
 * backend and shows the actual result or actual error on screen — no
 * fake data, no bypassing. Exists to make the frontend->backend runtime
 * path visible instead of hidden behind generic UI fallback text.
 */
export default function ConnectionDiagnosticsScreen() {
  const [backend, setBackend] = useState<ResultState>(IDLE);
  const [weather, setWeather] = useState<ResultState>(IDLE);
  const [location, setLocation] = useState<ResultState>(IDLE);
  const [geocoding, setGeocoding] = useState<ResultState>(IDLE);
  const [route, setRoute] = useState<ResultState>(IDLE);
  const [journeyPlan, setJourneyPlan] = useState<ResultState>(IDLE);
  const [journeyWeather, setJourneyWeather] = useState<ResultState>(IDLE);
  const [journeyIntelligence, setJourneyIntelligence] = useState<ResultState>(IDLE);
  const [usingTestLocation, setUsingTestLocation] = useState(false);

  // Kept across button presses so "Test Route" etc. can chain off a
  // previously fetched value without re-running earlier steps.
  const [lastRoute, setLastRoute] = useState<Route | null>(null);
  const [lastPlan, setLastPlan] = useState<JourneyPlan | null>(null);
  const [lastWeatherPlan, setLastWeatherPlan] = useState<JourneyWeatherPlan | null>(null);

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

  function useTestLocation() {
    locationService.useDevProvider(mockDeviceLocationProvider);
    setUsingTestLocation(true);
  }

  function useRealLocation() {
    locationService.useDevProvider(expoDeviceLocationProvider);
    setUsingTestLocation(false);
  }

  async function testBackend() {
    setBackend({ status: 'running' });
    try {
      const response = await fetch(`${apiBaseUrl}/health`);
      const body = await response.json();
      setBackend({
        status: response.ok ? 'success' : 'error',
        detail: `HTTP ${response.status} — ${JSON.stringify(body)}`,
      });
    } catch (cause) {
      setBackend({ status: 'error', detail: describeError(cause) });
    }
  }

  async function testWeather() {
    setWeather({ status: 'running' });
    try {
      const snapshot: WeatherSnapshot = await weatherService.getCurrentWeather(TEST_COORDINATES);
      setWeather({
        status: 'success',
        detail: `${snapshot.current.temperature}°C, ${snapshot.current.weatherCode}, feels like ${snapshot.current.feelsLike}°C`,
      });
    } catch (cause) {
      setWeather({ status: 'error', detail: describeError(cause) });
    }
  }

  async function testLocation() {
    setLocation({ status: 'running' });
    try {
      const point = await locationService.getCurrentLocation();
      setLocation({ status: 'success', detail: `${point.latitude}, ${point.longitude}` });
    } catch (cause) {
      setLocation({ status: 'error', detail: describeError(cause) });
    }
  }

  async function testGeocoding() {
    setGeocoding({ status: 'running' });
    try {
      const results = await geocodingService.geocode('Salt Lake, Kolkata');
      setGeocoding({
        status: results.length > 0 ? 'success' : 'error',
        detail:
          results.length > 0
            ? `${results.length} result(s) — first: ${results[0].latitude}, ${results[0].longitude}`
            : 'No results returned',
      });
    } catch (cause) {
      setGeocoding({ status: 'error', detail: describeError(cause) });
    }
  }

  async function testRoute() {
    setRoute({ status: 'running' });
    try {
      const destination = { latitude: 22.5958, longitude: 88.2636 };
      const result = await routingService.getRoute(TEST_COORDINATES, destination);
      setLastRoute(result);
      setRoute({
        status: 'success',
        detail: `${result.distanceKm.toFixed(1)} km, ${result.durationMinutes.toFixed(0)} min, ${result.coordinates.length} points`,
      });
    } catch (cause) {
      setRoute({ status: 'error', detail: describeError(cause) });
    }
  }

  async function testJourneyPlan() {
    if (!lastRoute) {
      setJourneyPlan({ status: 'error', detail: 'Run "Test Route" first' });
      return;
    }
    setJourneyPlan({ status: 'running' });
    try {
      const plan = await journeyService.planJourney(lastRoute);
      setLastPlan(plan);
      setJourneyPlan({ status: 'success', detail: `${plan.checkpoints.length} checkpoints` });
    } catch (cause) {
      setJourneyPlan({ status: 'error', detail: describeError(cause) });
    }
  }

  async function testJourneyWeather() {
    if (!lastPlan) {
      setJourneyWeather({ status: 'error', detail: 'Run "Test Journey Plan" first' });
      return;
    }
    setJourneyWeather({ status: 'running' });
    try {
      const plan = await journeyService.getJourneyWeather(lastPlan);
      setLastWeatherPlan(plan);
      setJourneyWeather({
        status: 'success',
        detail: `${plan.summary.weatherAvailableCheckpoints} available, ${plan.summary.weatherUnavailableCheckpoints} unavailable`,
      });
    } catch (cause) {
      setJourneyWeather({ status: 'error', detail: describeError(cause) });
    }
  }

  async function testJourneyIntelligence() {
    if (!lastWeatherPlan) {
      setJourneyIntelligence({ status: 'error', detail: 'Run "Test Journey Weather" first' });
      return;
    }
    setJourneyIntelligence({ status: 'running' });
    try {
      const context = await personalizationService.createUserContext({ persona: 'runner' });
      const intelligence: JourneyIntelligence = await journeyService.getJourneyIntelligence(
        lastWeatherPlan,
        context,
      );
      setJourneyIntelligence({
        status: 'success',
        detail: `risk=${intelligence.analysis.riskLevel}, "${intelligence.recommendation.title}"`,
      });
    } catch (cause) {
      setJourneyIntelligence({ status: 'error', detail: describeError(cause) });
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.warning}>DEVELOPMENT / TESTING ONLY</Text>
      <Text style={styles.title}>CLOUD6 Connection Diagnostics</Text>
      <Text style={styles.subtitle}>API base URL: {apiBaseUrl}</Text>

      <Section title="TEST LOCATION OVERRIDE">
        <Text style={styles.rowValue}>
          Active provider: {usingTestLocation ? 'MOCK (22.5726, 88.3639)' : 'real device/browser GPS'}
        </Text>
        <View style={styles.buttonRow}>
          <Button title="Use Test Location" onPress={useTestLocation} />
          <View style={styles.buttonGap} />
          <Button title="Use Real Location" onPress={useRealLocation} />
        </View>
      </Section>

      <ResultRow title="BACKEND" state={backend} onPress={testBackend} buttonLabel="Test Backend" />
      <ResultRow
        title="WEATHER"
        state={weather}
        onPress={testWeather}
        buttonLabel="Test Current Weather"
      />
      <ResultRow title="LOCATION" state={location} onPress={testLocation} buttonLabel="Test Location" />
      <ResultRow
        title="GEOCODING"
        state={geocoding}
        onPress={testGeocoding}
        buttonLabel="Test Geocoding"
      />
      <ResultRow title="ROUTE" state={route} onPress={testRoute} buttonLabel="Test Route" />
      <ResultRow
        title="JOURNEY PLAN"
        state={journeyPlan}
        onPress={testJourneyPlan}
        buttonLabel="Test Journey Plan"
      />
      <ResultRow
        title="JOURNEY WEATHER"
        state={journeyWeather}
        onPress={testJourneyWeather}
        buttonLabel="Test Journey Weather"
      />
      <ResultRow
        title="JOURNEY INTELLIGENCE"
        state={journeyIntelligence}
        onPress={testJourneyIntelligence}
        buttonLabel="Test Journey Intelligence"
      />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ResultRow({
  title,
  state,
  onPress,
  buttonLabel,
}: {
  title: string;
  state: ResultState;
  onPress: () => void;
  buttonLabel: string;
}) {
  const icon = state.status === 'success' ? '✓' : state.status === 'error' ? '✗' : '…';
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={state.status === 'error' ? styles.error : styles.rowValue}>
        {icon} {state.status === 'idle' ? 'not run yet' : state.status === 'running' ? 'running...' : state.detail}
      </Text>
      <View style={styles.spacer} />
      <Button title={buttonLabel} onPress={onPress} disabled={state.status === 'running'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  warning: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#c0392b',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    paddingTop: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  rowValue: {
    marginBottom: 4,
  },
  error: {
    marginBottom: 4,
    color: '#c0392b',
  },
  spacer: {
    height: 8,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonGap: {
    width: 12,
  },
});
