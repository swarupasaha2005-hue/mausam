import type { ReactNode } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PERSONAS, TIME_OF_DAY_OPTIONS } from '@cloud6/shared';
import { usePersonalization } from '../../src/hooks/usePersonalization';

/**
 * DEVELOPMENT / TESTING ONLY. Exercises usePersonalization() /
 * PersonalizationService directly to verify the Persona Engine. Not part
 * of the final CLOUD6 UI — no persona configuration is duplicated here.
 */
export default function PersonaTestScreen() {
  const {
    persona,
    preferredTimeOfDay,
    context,
    loading,
    error,
    setPersona,
    setPreferredTimeOfDay,
  } = usePersonalization();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.warning}>DEVELOPMENT / TESTING ONLY</Text>
      <Text style={styles.title}>CLOUD6</Text>
      <Text style={styles.subtitle}>Personalization Test</Text>

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
        <Row label="Loading" value={loading ? 'Yes' : 'No'} />
        <Row label="Error" value={error ? error.code : 'None'} />
      </Section>

      <Section title="RESULTING CONTEXT">
        <Row label="Persona" value={context?.persona ?? '—'} />
        <Row label="Preferred Time" value={context?.preferredTimeOfDay ?? '—'} />
        <Row label="Activities" value={context?.activities.join(', ') ?? '—'} />
        <Text style={styles.sectionTitle}>Weather Priorities</Text>
        {context?.weatherPriorities.map((priority) => (
          <Text key={priority} style={styles.priority}>
            • {priority}
          </Text>
        ))}
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
  priority: {
    fontSize: 14,
  },
});
