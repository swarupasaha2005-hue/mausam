import { useEffect, useState, type ReactNode } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useJourney } from '../../src/hooks/useJourney';
import { MapView } from '../../src/components/map';

/**
 * DEVELOPMENT / TESTING ONLY. Exercises useJourney() (LocationService +
 * GeocodingService + routingService) to verify the Maps + Routing
 * pipeline. Not the final CLOUD6 journey UI. No routing/OSRM logic lives
 * in this component.
 */
export default function JourneyTestScreen() {
  const {
    start,
    destination,
    route,
    loading,
    error,
    loadStart,
    searchDestination,
    getRoute,
    refresh,
  } = useJourney();
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadStart();
    // eslint-disable-next-line
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.warning}>DEVELOPMENT / TESTING ONLY</Text>
      <Text style={styles.title}>CLOUD6</Text>
      <Text style={styles.subtitle}>Journey Test</Text>

      <Section title="START">
        {start ? (
          <>
            <Row label="Latitude" value={start.latitude.toFixed(6)} />
            <Row label="Longitude" value={start.longitude.toFixed(6)} />
          </>
        ) : (
          <Text style={styles.value}>Not available</Text>
        )}
      </Section>

      <Section title="DESTINATION">
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Enter destination"
        />
        <Button
          title="Search Destination"
          onPress={() => searchDestination(query)}
          disabled={loading}
        />
        {destination && (
          <>
            <Row label="Latitude" value={destination.latitude.toFixed(6)} />
            <Row label="Longitude" value={destination.longitude.toFixed(6)} />
          </>
        )}
      </Section>

      <Section title="ROUTE">
        <Button title="Get Route" onPress={getRoute} disabled={loading || !start || !destination} />
      </Section>

      <Section title="MAP">
        <MapView
          start={start}
          destination={destination}
          routeCoordinates={route?.coordinates ?? []}
        />
      </Section>

      <Section title="ROUTE INFORMATION">
        <Row label="Distance" value={route ? `${route.distanceKm.toFixed(1)} km` : '—'} />
        <Row
          label="Est. duration"
          value={route ? `${route.durationMinutes.toFixed(0)} min` : '—'}
        />
        <Row label="Route points" value={route ? String(route.coordinates.length) : '—'} />
      </Section>

      <Section title="STATUS">
        <Row label="Loading" value={loading ? 'Yes' : 'No'} />
        <Row label="Error" value={error ? error.code : 'None'} />
      </Section>

      <Section title="ACTIONS">
        <Button title="Refresh" onPress={refresh} disabled={loading} />
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
    width: 110,
    fontWeight: '600',
  },
  rowValue: {
    flex: 1,
  },
  value: {
    fontSize: 14,
  },
});
