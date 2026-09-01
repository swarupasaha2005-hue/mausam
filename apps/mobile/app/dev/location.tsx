import type { ReactNode } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocation } from '../../src/hooks/useLocation';

const ERROR_MESSAGES: Record<string, string> = {
  LOCATION_PERMISSION_DENIED: 'Location permission was denied.',
  LOCATION_UNAVAILABLE: 'Unable to determine your current location.',
  LOCATION_TIMEOUT: 'Unable to retrieve location.',
  LOCATION_INVALID: 'Received invalid coordinates.',
  GEOCODING_FAILED: 'Location name unavailable.',
};

/**
 * DEVELOPMENT / TESTING ONLY. Exercises useLocation() directly to verify
 * the Location Engine end to end. Not part of the final CLOUD6 UI — will
 * be removed or replaced once real screens consume useLocation().
 */
export default function LocationTestScreen() {
  const { location, loading, error, permissionStatus, requestPermission, refreshLocation } =
    useLocation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.warning}>DEVELOPMENT / TESTING ONLY</Text>
      <Text style={styles.title}>CLOUD6</Text>
      <Text style={styles.subtitle}>Location Engine Test</Text>

      <Section title="PERMISSION">
        <Row label="Status" value={permissionStatus} />
        <Button title="Request Permission" onPress={requestPermission} />
      </Section>

      <Section title="CURRENT LOCATION">
        <Row label="Latitude" value={location ? location.latitude.toFixed(6) : 'Not available'} />
        <Row label="Longitude" value={location ? location.longitude.toFixed(6) : 'Not available'} />
        <Row
          label="Location"
          value={
            location
              ? [location.city, location.state].filter(Boolean).join(', ') ||
                'Location name unavailable'
              : 'Not available'
          }
        />
      </Section>

      <Section title="STATUS">
        <Row label="Loading" value={loading ? 'Yes' : 'No'} />
        <Row label="Error" value={error ? (ERROR_MESSAGES[error.code] ?? error.code) : 'None'} />
      </Section>

      <Section title="ACTIONS">
        <Button title="Get Current Location" onPress={refreshLocation} disabled={loading} />
        <View style={styles.spacer} />
        <Button title="Refresh Location" onPress={refreshLocation} disabled={loading} />
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
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rowLabel: {
    width: 100,
    fontWeight: '600',
  },
  rowValue: {
    flex: 1,
  },
  spacer: {
    height: 8,
  },
});
