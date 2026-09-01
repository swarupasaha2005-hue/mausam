import { useState, type ReactNode } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { WeatherError, type CurrentWeather } from '@cloud6/shared';
import { weatherService } from '../../src/services/weather';

const ERROR_MESSAGES: Record<string, string> = {
  WEATHER_INVALID_COORDINATES: 'Invalid latitude/longitude.',
  WEATHER_TIMEOUT: 'The weather request timed out.',
  WEATHER_RATE_LIMITED: 'Rate limited — try again shortly.',
  WEATHER_PROVIDER_ERROR: 'Weather provider error.',
  WEATHER_REQUEST_FAILED: 'Could not reach the CLOUD6 backend.',
  WEATHER_INVALID_RESPONSE: 'Received an invalid response.',
};

/**
 * DEVELOPMENT / TESTING ONLY. Exercises weatherService directly against
 * the CLOUD6 backend to verify the Weather Engine end to end. Not part of
 * the final CLOUD6 UI.
 */
export default function WeatherTestScreen() {
  const [latitude, setLatitude] = useState('22.5726');
  const [longitude, setLongitude] = useState('88.3639');
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourlyCount, setHourlyCount] = useState<number | null>(null);
  const [dailyCount, setDailyCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WeatherError | null>(null);

  function point() {
    return { latitude: Number(latitude), longitude: Number(longitude) };
  }

  async function run(task: () => Promise<void>) {
    setLoading(true);
    setError(null);
    try {
      await task();
    } catch (cause) {
      setError(cause instanceof WeatherError ? cause : new WeatherError('WEATHER_PROVIDER_ERROR'));
    } finally {
      setLoading(false);
    }
  }

  const fetchCurrent = () =>
    run(async () => {
      const result = await weatherService.getCurrentWeather(point());
      setCurrent(result.current);
    });

  const fetchHourly = () =>
    run(async () => {
      const result = await weatherService.getHourlyForecast(point());
      setHourlyCount(result.hourly.length);
    });

  const fetchDaily = () =>
    run(async () => {
      const result = await weatherService.getDailyForecast(point());
      setDailyCount(result.daily.length);
    });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.warning}>DEVELOPMENT / TESTING ONLY</Text>
      <Text style={styles.title}>CLOUD6</Text>
      <Text style={styles.subtitle}>Weather Engine Test</Text>

      <Section title="COORDINATES">
        <TextInput
          style={styles.input}
          value={latitude}
          onChangeText={setLatitude}
          placeholder="Latitude"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={longitude}
          onChangeText={setLongitude}
          placeholder="Longitude"
          keyboardType="numeric"
        />
      </Section>

      <Section title="ACTIONS">
        <Button title="Fetch Current Weather" onPress={fetchCurrent} disabled={loading} />
        <View style={styles.spacer} />
        <Button title="Fetch Hourly Forecast" onPress={fetchHourly} disabled={loading} />
        <View style={styles.spacer} />
        <Button title="Fetch Daily Forecast" onPress={fetchDaily} disabled={loading} />
      </Section>

      <Section title="CURRENT WEATHER">
        <Row label="Temperature" value={current ? `${current.temperature}°C` : '—'} />
        <Row label="Feels Like" value={current ? `${current.feelsLike}°C` : '—'} />
        <Row label="Humidity" value={current ? `${current.humidity}%` : '—'} />
        <Row label="Rain Probability" value={current ? `${current.rainProbability}%` : '—'} />
        <Row label="Precipitation" value={current ? `${current.precipitation}mm` : '—'} />
        <Row
          label="Wind"
          value={current ? `${current.windSpeed}km/h @ ${current.windDirection}°` : '—'}
        />
        <Row label="UV" value={current ? String(current.uvIndex) : '—'} />
        <Row label="Condition" value={current ? current.weatherCode : '—'} />
        <Row label="Timestamp" value={current ? current.timestamp : '—'} />
      </Section>

      <Section title="FORECAST">
        <Row label="Hourly entries" value={hourlyCount === null ? '—' : String(hourlyCount)} />
        <Row label="Daily entries" value={dailyCount === null ? '—' : String(dailyCount)} />
      </Section>

      <Section title="STATUS">
        <Row label="Loading" value={loading ? 'Yes' : 'No'} />
        <Row label="Error" value={error ? (ERROR_MESSAGES[error.code] ?? error.code) : 'None'} />
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
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rowLabel: {
    width: 130,
    fontWeight: '600',
  },
  rowValue: {
    flex: 1,
  },
  spacer: {
    height: 8,
  },
});
