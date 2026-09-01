import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../theme';

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
}

/** Shared section wrapper — a sectionTitle label above content, consistent spacing. */
export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={typography.sectionTitle}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  content: {
    gap: spacing.md,
  },
});
