import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../theme';

/** Compact screen header — matches the Home/Journey/Weather header style, not a settings-dashboard title. */
export function ProfileHeader() {
  return (
    <View style={styles.wrap}>
      <Text style={typography.screenTitle}>Profile</Text>
      <Text style={styles.subtitle}>Make CLOUD6 work for you.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  subtitle: {
    ...typography.bodySecondary,
  },
});
