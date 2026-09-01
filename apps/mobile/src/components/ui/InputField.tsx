import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface InputFieldProps {
  children: ReactNode;
  icon?: ReactNode;
}

/**
 * Shared visual shell for input-like rows (a real TextInput, or a
 * read-only display row such as the Journey "From" field) — white
 * surface, subtle border, rounded corners, comfortable height. Used by
 * both DestinationSearch and LocationField so Journey never has its
 * own separate input styling.
 */
export function InputField({ children, icon }: InputFieldProps) {
  return (
    <View style={styles.row}>
      {icon}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.medium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
});
