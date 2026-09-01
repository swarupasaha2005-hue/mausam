import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { LocationError, type GeoPoint } from '@cloud6/shared';
import { geocodingService } from '../../services/location';
import { colors, radius, spacing, typography } from '../../theme';
import { DestinationResult } from './DestinationResult';

export interface DestinationCandidate {
  point: GeoPoint;
  label: string;
  sublabel?: string;
}

interface DestinationSearchProps {
  onSelect: (candidate: DestinationCandidate) => void;
}

type Status = 'idle' | 'searching' | 'success' | 'empty' | 'error';

function labelFor(point: GeoPoint, place: { name?: string; city?: string; state?: string; country?: string }) {
  const label = place.name ?? place.city ?? `${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)}`;
  const sublabelParts = [place.city, place.state].filter(
    (part): part is string => !!part && part !== label,
  );
  return { label, sublabel: sublabelParts.length > 0 ? sublabelParts.join(', ') : place.country };
}

/**
 * Destination text search. Calls the existing geocodingService only —
 * no new geocoding provider, no direct Expo Location calls. Forward
 * geocoding (geocode) finds candidate coordinates; each candidate is
 * then reverse-geocoded (also existing) to get a human-readable
 * name/place, since forward geocoding alone returns coordinates only.
 */
export function DestinationSearch({ onSelect }: DestinationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DestinationCandidate[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [selected, setSelected] = useState<DestinationCandidate | null>(null);

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setStatus('searching');
    setResults([]);
    setSelected(null);

    try {
      const points = await geocodingService.geocode(trimmed);
      if (points.length === 0) {
        setStatus('empty');
        return;
      }

      const candidates = await Promise.all(
        points.slice(0, 5).map(async (point) => {
          const place = await geocodingService.reverseGeocode(point).catch(() => ({}));
          return { point, ...labelFor(point, place) };
        }),
      );
      setResults(candidates);
      setStatus('success');
    } catch (cause) {
      setStatus('error');
      void (cause instanceof LocationError ? cause : new LocationError('GEOCODING_FAILED'));
    }
  }

  function handleSelect(candidate: DestinationCandidate) {
    setSelected(candidate);
    setResults([]);
    setStatus('idle');
    onSelect(candidate);
  }

  return (
    <View>
      <Text style={typography.sectionTitle}>TO</Text>
      <View style={styles.inputRow}>
        <Text style={styles.icon}>🔎</Text>
        <TextInput
          style={styles.input}
          value={selected ? selected.label : query}
          onChangeText={(text) => {
            setSelected(null);
            setQuery(text);
          }}
          placeholder="Where are you headed?"
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        {status === 'searching' && <ActivityIndicator size="small" color={colors.textSecondary} />}
      </View>
      {selected?.sublabel && <Text style={styles.selectedSublabel}>{selected.sublabel}</Text>}

      {status === 'success' && results.length > 0 && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Search results</Text>
          {results.map((candidate) => (
            <DestinationResult
              key={`${candidate.point.latitude},${candidate.point.longitude}`}
              label={candidate.label}
              sublabel={candidate.sublabel}
              onPress={() => handleSelect(candidate)}
            />
          ))}
        </View>
      )}

      {status === 'empty' && <Text style={styles.message}>No locations found.</Text>}
      {status === 'error' && <Text style={styles.message}>We couldn't find that place.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    ...typography.body,
  },
  selectedSublabel: {
    ...typography.meta,
    marginTop: spacing.xs,
    marginLeft: spacing.lg,
  },
  resultsCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  resultsTitle: {
    ...typography.meta,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  message: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
  },
});
