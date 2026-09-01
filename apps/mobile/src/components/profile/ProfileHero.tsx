import { StyleSheet, Text } from 'react-native';
import { Card } from '../ui';
import { spacing, typography } from '../../theme';

/** Identity card — no auth, so no fabricated name/avatar. */
export function ProfileHero() {
  return (
    <Card>
      <Text style={typography.sectionTitle}>YOUR CLOUD6 PROFILE</Text>
      <Text style={styles.title}>Tell us what matters to you.</Text>
      <Text style={styles.body}>
        Your preferences help CLOUD6 personalize weather insights.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.cardTitle,
    marginTop: spacing.sm,
  },
  body: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
});
