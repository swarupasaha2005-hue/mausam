import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Activity } from '@cloud6/shared';
import { usePersonalization } from '../src/hooks/usePersonalization';
import { BottomNav } from '../src/components/home';
import {
  ActivitySelector,
  PersonaSelector,
  PersonalizationPreview,
  ProfileHeader,
  ProfileHero,
  ProfileSection,
  TimeOfDaySelector,
  WeatherPriorityPreview,
} from '../src/components/profile';
import { Button, Card } from '../src/components/ui';
import { colors, spacing, typography } from '../src/theme';

/**
 * Production Profile screen: personalization only, no auth/account UI.
 * Composes usePersonalization() only — persona/time/activity selection
 * flows straight into the existing PersonalizationService; no
 * recommendation/weather logic lives here.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const {
    persona,
    preferredTimeOfDay,
    activities,
    context,
    loading,
    error,
    setPersona,
    setPreferredTimeOfDay,
    setActivities,
  } = usePersonalization();

  const selectedActivities = activities ?? [];

  function toggleActivity(activity: Activity) {
    const next = selectedActivities.includes(activity)
      ? selectedActivities.filter((item) => item !== activity)
      : [...selectedActivities, activity];
    setActivities(next);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileHeader />

        <View style={styles.section}>
          <ProfileHero />
        </View>

        <View style={styles.section}>
          <ProfileSection title="HOW DO YOU USE CLOUD6?">
            <PersonaSelector persona={persona} onSelect={setPersona} />
          </ProfileSection>
        </View>

        <View style={styles.section}>
          <ProfileSection title="WHEN DO YOU USUALLY PLAN?">
            <TimeOfDaySelector value={preferredTimeOfDay} onSelect={setPreferredTimeOfDay} />
          </ProfileSection>
        </View>

        <View style={styles.section}>
          <ProfileSection title="WHAT DO YOU DO?">
            <ActivitySelector selected={selectedActivities} onToggle={toggleActivity} />
          </ProfileSection>
        </View>

        <View style={styles.section}>
          <ProfileSection title="CLOUD6 WILL WATCH FOR">
            <WeatherPriorityPreview priorities={context?.weatherPriorities ?? []} />
          </ProfileSection>
        </View>

        {context && (
          <View style={styles.section}>
            <PersonalizationPreview persona={persona} priorities={context.weatherPriorities} />
          </View>
        )}

        <View style={styles.statusRow}>
          {loading && <Text style={styles.statusText}>Loading your preferences...</Text>}
          {!loading && error && <Text style={styles.errorText}>Couldn't update your preferences.</Text>}
          {!loading && !error && context && <Text style={styles.statusText}>Preferences updated</Text>}
        </View>

        <View style={styles.section}>
          <Card>
            <Text style={typography.sectionTitle}>READY TO PLAN A JOURNEY?</Text>
            <Text style={styles.journeyBody}>
              See the weather all along your route, personalized to you.
            </Text>
            <View style={styles.journeyButton}>
              <Button title="Plan a Journey →" variant="secondary" onPress={() => router.push('/journey')} />
            </View>
          </Card>
        </View>

        <View style={styles.about}>
          <Text style={styles.aboutTitle}>ABOUT CLOUD6</Text>
          <Text style={styles.aboutBody}>Weather intelligence for everyday journeys.</Text>
          <Text style={styles.aboutMeta}>Version 1.0 · Prototype</Text>
        </View>
      </ScrollView>

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
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  statusRow: {
    marginTop: spacing.sm,
    minHeight: spacing.xl,
  },
  statusText: {
    ...typography.meta,
  },
  errorText: {
    ...typography.meta,
    color: colors.danger,
  },
  journeyBody: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
  },
  journeyButton: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  about: {
    marginTop: spacing.xxl,
    gap: spacing.xs,
    alignItems: 'center',
  },
  aboutTitle: {
    ...typography.sectionTitle,
  },
  aboutBody: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
  aboutMeta: {
    ...typography.meta,
  },
});
