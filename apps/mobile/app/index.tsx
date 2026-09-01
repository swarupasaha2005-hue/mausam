import { Link } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useLocation } from '../src/hooks/useLocation';

export default function Index() {
  const { location, loading, error, permissionStatus, requestPermission, refreshLocation } =
    useLocation();

  async function handlePress() {
    if (permissionStatus !== 'granted') {
      const status = await requestPermission();
      if (status !== 'granted') {
        return;
      }
    }
    await refreshLocation();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CLOUD6</Text>
      <Text style={styles.subtitle}>Phase 2 — Location Engine</Text>

      <View style={styles.section}>
        <Button
          title={loading ? 'Locating…' : 'Use my location'}
          onPress={handlePress}
          disabled={loading}
        />
        {location && (
          <Text style={styles.result}>
            {location.city ?? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
          </Text>
        )}
        {error && <Text style={styles.error}>{error.code}</Text>}
      </View>

      <Link href="/dev/location" style={styles.devLink}>
        Location Engine dev test screen
      </Link>
      <Link href="/dev/weather" style={styles.devLink}>
        Weather Engine dev test screen
      </Link>
      <Link href="/dev/persona" style={styles.devLink}>
        Personalization dev test screen
      </Link>
      <Link href="/dev/recommendations" style={styles.devLink}>
        Recommendation Engine dev test screen
      </Link>
      <Link href="/dev/dashboard" style={styles.devLink}>
        End-to-end dashboard dev test screen
      </Link>
      <Link href="/dev/journey" style={styles.devLink}>
        Maps + Routing dev test screen
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  result: {
    fontSize: 14,
  },
  error: {
    fontSize: 14,
    color: '#c0392b',
  },
  devLink: {
    marginTop: 32,
    fontSize: 12,
    color: '#999',
  },
});
