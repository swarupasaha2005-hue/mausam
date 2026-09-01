import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InputField } from '../ui';
import { colors, spacing, typography } from '../../theme';

interface LocationFieldProps {
  label: string;
  value: string | null;
  unavailableText: string;
  loading?: boolean;
  onRetry?: () => void;
}

/** Read-only "From" field sourced from the existing location system — shares InputField's shell. */
export function LocationField({ label, value, unavailableText, loading, onRetry }: LocationFieldProps) {
  return (
    <View style={styles.group}>
      <Text style={typography.sectionTitle}>{label}</Text>
      <InputField icon={<Text style={styles.icon}>📍</Text>}>
        <Text style={styles.value}>{loading ? 'Locating…' : (value ?? unavailableText)}</Text>
        {!loading && !value && onRetry && (
          <Pressable onPress={onRetry} hitSlop={8}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        )}
      </InputField>
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
  value: {
    ...typography.body,
    flex: 1,
  },
  retry: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
