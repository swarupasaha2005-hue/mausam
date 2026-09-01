import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface JourneyHeaderProps {
  title: string;
  onBack: () => void;
}

/** Compact header with a back button — no large title treatment. */
export function JourneyHeader({ title, onBack }: JourneyHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="Back">
        <Text style={styles.backIcon}>←</Text>
      </Pressable>
      <Text style={typography.cardTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },
});
