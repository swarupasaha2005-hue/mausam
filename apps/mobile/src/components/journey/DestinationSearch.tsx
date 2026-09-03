import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { LocationError, type GeoPoint } from '@cloud6/shared';
import { geocodingService } from '../../services/location';
import { InputField } from '../ui';
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

/**
 * The backend's /api/geocoding only returns { latitude, longitude } (no
 * name field — GeoPoint has none, and adding one is out of scope here),
 * and reverse geocoding is native-only (returns {} on web). When there's
 * exactly one candidate, the text the user searched for is the closest
 * thing we have to a real place name for it — for multiple candidates
 * that would be ambiguous (the same text on every distinct result), so
 * those fall back to coordinates to stay visually distinguishable.
 */
function labelFor(
  point: GeoPoint,
  place: { name?: string; city?: string; state?: string; country?: string },
  query: string,
  isOnlyResult: boolean,
) {
  const coordinateFallback = `${point.latitude.toFixed(2)}, ${point.longitude.toFixed(2)}`;
  const label = place.name ?? place.city ?? (isOnlyResult ? query : coordinateFallback);
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

      const candidatePoints = points.slice(0, 5);
      const candidates = await Promise.all(
        candidatePoints.map(async (point) => {
          const place = await geocodingService.reverseGeocode(point).catch(() => ({}));
          return { point, ...labelFor(point, place, trimmed, candidatePoints.length === 1) };
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
    <View style={styles.group}>
      <Text style={typography.sectionTitle}>TO</Text>
      <InputField icon={<Text style={styles.icon}>🔎</Text>}>
        <TextInput
          style={styles.input}
          value={selected ? selected.label : query}
          onChangeText={(text) => {
            setSelected(null);
            setQuery(text);
          }}
          placeholder="Where are you headed?"
          placeholderTextColor={colors.textTertiary}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        {status === 'searching' && <ActivityIndicator size="small" color={colors.textSecondary} />}
      </InputField>
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
  group: {
    gap: spacing.sm,
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
    marginLeft: spacing.lg,
  },
  resultsCard: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.medium,
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
