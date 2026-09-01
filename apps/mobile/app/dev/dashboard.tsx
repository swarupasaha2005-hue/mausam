import type { ReactNode } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PERSONAS, TIME_OF_DAY_OPTIONS } from '@cloud6/shared';
import { usePersonalizedWeather } from '../../src/hooks/usePersonalizedWeather';

const ERROR_MESSAGES: Record<string, string> = {
  LOCATION_PERMISSION_DENIED:
    "We couldn't access your location. Please enable location access or try again.",
  LOCATION_UNAVAILABLE:
    "We couldn't access your location. Please enable location access or try again.",
  LOCATION_TIMEOUT: "We couldn't access your location. Please enable location access or try again.",
  LOCATION_INVALID: "We couldn't access your location. Please enable location access or try again.",
  GEOCODING_FAILED: 'Location name unavailable.',
  WEATHER_INVALID_COORDINATES: "We couldn't retrieve the weather right now. Please try again.",
  WEATHER_TIMEOUT: "We couldn't retrieve the weather right now. Please try again.",
  WEATHER_PROVIDER_ERROR: "We couldn't retrieve the weather right now. Please try again.",
  WEATHER_REQUEST_FAILED: "We couldn't retrieve the weather right now. Please try again.",
  WEATHER_INVALID_RESPONSE: "We couldn't retrieve the weather right now. Please try again.",
  PERSONA_INVALID: "We couldn't load your preferences.",
  TIME_INVALID: "We couldn't load your preferences.",
  ACTIVITY_INVALID: "We couldn't load your preferences.",
  RECOMMENDATION_INVALID_CONTEXT:
    "Weather is available, but we couldn't generate a personalized recommendation.",
  RECOMMENDATION_INVALID_WEATHER:
    "Weather is available, but we couldn't generate a personalized recommendation.",
};

/**
 * DEVELOPMENT / TESTING ONLY. Demonstrates the full CLOUD6 pipeline —
 * location → weather → user context → recommendation — via
 * usePersonalizedWeather(), which orchestrates the existing Location/
 * Weather/Personalization/Recommendation services. No domain logic lives
 * in this component. Not the final CLOUD6 UI.
 */
export default function DashboardTestScreen() {
  const {
    location,
    locationError,
    weather,
    weatherError,
    personalizationError,
    recommendation,
    recommendationError,
    status,
    statusMessage,
    persona,
    preferredTimeOfDay,
    setPersona,
    setPreferredTimeOfDay,
    refresh,
  } = usePersonalizedWeather();

  const others = recommendation?.recommendations.slice(1) ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.warning}>DEVELOPMENT / TESTING ONLY</Text>
      <Text style={styles.title}>CLOUD6</Text>
      <Text style={styles.subtitle}>Personalized Weather Test</Text>

      <Section title="PERSONA">
        <View style={styles.buttonRow}>
          {PERSONAS.map((option) => (
            <View key={option} style={styles.buttonWrap}>
              <Button
                title={option}
                onPress={() => setPersona(option)}
                disabled={option === persona}
              />
            </View>
          ))}
        </View>
        <Text style={styles.selected}>Selected: {persona}</Text>
      </Section>

      <Section title="PREFERRED TIME">
        <View style={styles.buttonRow}>
          {TIME_OF_DAY_OPTIONS.map((option) => (
            <View key={option} style={styles.buttonWrap}>
              <Button
                title={option}
                onPress={() => setPreferredTimeOfDay(option)}
                disabled={option === preferredTimeOfDay}
              />
            </View>
          ))}
        </View>
      </Section>

      <Section title="STATUS">
        <Row label="Status" value={status} />
        {statusMessage.length > 0 && <Text style={styles.statusMessage}>{statusMessage}</Text>}
      </Section>

      <Section title="LOCATION">
        {location ? (
          <>
            <Text style={styles.value}>
              {[location.city, location.state].filter(Boolean).join(', ') ||
                'Location name unavailable'}
            </Text>
            <Text style={styles.value}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </>
        ) : (
          <Text style={styles.error}>
            {locationError
              ? (ERROR_MESSAGES[locationError.code] ?? locationError.code)
              : 'Not available'}
          </Text>
        )}
      </Section>

      <Section title="CURRENT WEATHER">
        {weather ? (
          <>
            <Text style={styles.value}>{weather.temperature}°C</Text>
            <Row label="Feels like" value={`${weather.feelsLike}°C`} />
            <Row label="Humidity" value={`${weather.humidity}%`} />
            <Row label="Rain probability" value={`${weather.rainProbability}%`} />
            <Row label="UV" value={String(weather.uvIndex)} />
            <Row label="Wind" value={`${weather.windSpeed} km/h`} />
          </>
        ) : (
          <Text style={styles.error}>
            {weatherError
              ? (ERROR_MESSAGES[weatherError.code] ?? weatherError.code)
              : 'Not available'}
          </Text>
        )}
      </Section>

      <Section title="PERSONALIZED RECOMMENDATION">
        {recommendation?.primaryRecommendation ? (
          <>
            <Text style={styles.value}>{recommendation.primaryRecommendation.title}</Text>
            <Text style={styles.message}>{recommendation.primaryRecommendation.message}</Text>
            <Row label="Action" value={recommendation.primaryRecommendation.action} />
            <Row label="Priority" value={recommendation.primaryRecommendation.priority} />
            <Text style={styles.sectionTitle}>Reasons</Text>
            {recommendation.primaryRecommendation.reasons.map((reason) => (
              <Text key={reason} style={styles.reason}>
                • {reason}
              </Text>
            ))}
            {others.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Other recommendations</Text>
                {others.map((rec, index) => (
                  <Text key={`${rec.type}-${index}`} style={styles.reason}>
                    • {rec.title}
                  </Text>
                ))}
              </>
            )}
          </>
        ) : (
          <Text style={styles.error}>
            {recommendationError
              ? (ERROR_MESSAGES[recommendationError.code] ?? recommendationError.code)
              : personalizationError
                ? (ERROR_MESSAGES[personalizationError.code] ?? personalizationError.code)
                : 'Not available'}
          </Text>
        )}
      </Section>

      <Section title="ACTIONS">
        <Button title="Refresh" onPress={refresh} disabled={status === 'loading'} />
      </Section>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}:</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    paddingTop: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonWrap: {
    marginBottom: 8,
  },
  selected: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rowLabel: {
    width: 120,
    fontWeight: '600',
  },
  rowValue: {
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    marginBottom: 8,
  },
  reason: {
    fontSize: 14,
  },
  statusMessage: {
    fontStyle: 'italic',
    color: '#666',
  },
  error: {
    color: '#c0392b',
  },
});
