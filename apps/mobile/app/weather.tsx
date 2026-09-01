import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../src/components/home';
import { colors, spacing, typography } from '../src/theme';

/** Placeholder route for bottom navigation. Full Weather screen is a later phase. */
export default function WeatherPlaceholder() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <Text style={typography.cardTitle}>Weather</Text>
        <Text style={styles.body}>The detailed weather screen is coming soon.</Text>
      </View>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  body: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
});
