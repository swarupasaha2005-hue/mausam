import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface LocationFieldProps {
  label: string;
  value: string | null;
  unavailableText: string;
  loading?: boolean;
  onRetry?: () => void;
}

/** Read-only "From" field sourced from the existing location system. */
export function LocationField({ label, value, unavailableText, loading, onRetry }: LocationFieldProps) {
  return (
    <View>
      <Text style={typography.sectionTitle}>{label}</Text>
      <View style={styles.row}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.value}>
          {loading ? 'Locating…' : (value ?? unavailableText)}
        </Text>
        {!loading && !value && onRetry && (
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
  value: {
    ...typography.body,
    flex: 1,
  },
  retry: {
    ...typography.meta,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
