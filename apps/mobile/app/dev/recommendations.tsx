import { useState, type ReactNode } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  PERSONAS,
  RecommendationError,
  type Persona,
  type RecommendationResult,
} from '@cloud6/shared';
import { personalizationService } from '../../src/services/personalization';
import { recommendationsService } from '../../src/services/recommendations';

/**
 * DEVELOPMENT / TESTING ONLY. Exercises PersonalizationService +
 * RecommendationService together against the CLOUD6 backend to verify
 * the rule engine across personas and weather inputs. Not part of the
 * final CLOUD6 UI, and contains no recommendation logic itself.
 */
export default function RecommendationsTestScreen() {
  const [persona, setPersona] = useState<Persona>('runner');
  const [temperature, setTemperature] = useState('24');
  const [feelsLike, setFeelsLike] = useState('25');
  const [humidity, setHumidity] = useState('50');
  const [rainProbability, setRainProbability] = useState('5');
  const [precipitation, setPrecipitation] = useState('0');
  const [windSpeed, setWindSpeed] = useState('10');
  const [uvIndex, setUvIndex] = useState('3');

  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RecommendationError | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const context = await personalizationService.createUserContext({ persona });
      const weather = {
        temperature: Number(temperature),
        feelsLike: Number(feelsLike),
        humidity: Number(humidity),
        precipitation: Number(precipitation),
        rainProbability: Number(rainProbability),
        windSpeed: Number(windSpeed),
        windDirection: 0,
        uvIndex: Number(uvIndex),
        visibility: 10,
        weatherCode: 'clear' as const,
        timestamp: new Date().toISOString(),
      };
      const recommendationResult = await recommendationsService.generate(context, weather);
      setResult(recommendationResult);
    } catch (cause) {
      setError(
        cause instanceof RecommendationError
          ? cause
          : new RecommendationError('RECOMMENDATION_INVALID_WEATHER'),
      );
    } finally {
      setLoading(false);
    }
  }

  const primary = result?.primaryRecommendation;
  const others = result?.recommendations.slice(1) ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.warning}>DEVELOPMENT / TESTING ONLY</Text>
      <Text style={styles.title}>CLOUD6</Text>
      <Text style={styles.subtitle}>Recommendation Engine Test</Text>

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
      </Section>

      <Section title="WEATHER INPUTS">
        <LabeledInput label="Temperature (°C)" value={temperature} onChangeText={setTemperature} />
        <LabeledInput label="Feels Like (°C)" value={feelsLike} onChangeText={setFeelsLike} />
        <LabeledInput label="Humidity (%)" value={humidity} onChangeText={setHumidity} />
        <LabeledInput
          label="Rain Probability (%)"
          value={rainProbability}
          onChangeText={setRainProbability}
        />
        <LabeledInput
          label="Precipitation (mm)"
          value={precipitation}
          onChangeText={setPrecipitation}
        />
        <LabeledInput label="Wind (km/h)" value={windSpeed} onChangeText={setWindSpeed} />
        <LabeledInput label="UV Index" value={uvIndex} onChangeText={setUvIndex} />
      </Section>

      <Section title="ACTIONS">
        <Button title="Generate Recommendation" onPress={generate} disabled={loading} />
      </Section>

      <Section title="STATUS">
        <Row label="Loading" value={loading ? 'Yes' : 'No'} />
        <Row label="Error" value={error ? error.code : 'None'} />
      </Section>

      {primary && (
        <Section title="PRIMARY RECOMMENDATION">
          <Row label="Type" value={primary.type} />
          <Row label="Priority" value={primary.priority} />
          <Row label="Title" value={primary.title} />
          <Row label="Message" value={primary.message} />
          <Row label="Action" value={primary.action} />
          <Text style={styles.sectionTitle}>Reasons</Text>
          {primary.reasons.map((reason) => (
            <Text key={reason} style={styles.reason}>
              • {reason}
            </Text>
          ))}
        </Section>
      )}

      {others.length > 0 && (
        <Section title="OTHER RECOMMENDATIONS">
          {others.map((rec, index) => (
            <View key={`${rec.type}-${index}`} style={styles.otherRec}>
              <Row label="Type" value={rec.type} />
              <Row label="Title" value={rec.title} />
              <Row label="Reasons" value={rec.reasons.join(', ')} />
            </View>
          ))}
        </Section>
      )}
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

function LabeledInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
      />
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
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rowLabel: {
    width: 90,
    fontWeight: '600',
  },
  rowValue: {
    flex: 1,
  },
  reason: {
    fontSize: 14,
  },
  otherRec: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  inputRow: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    borderRadius: 4,
    padding: 8,
  },
});
