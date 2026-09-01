import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface HomeHeaderProps {
  locationLabel: string | null;
  onAvatarPress?: () => void;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Greeting + location, visually secondary location text, small avatar affordance. */
export function HomeHeader({ locationLabel, onAvatarPress }: HomeHeaderProps) {
  const greeting = greetingForHour(new Date().getHours());

  return (
    <View style={styles.row}>
      <View>
        <Text style={typography.greeting}>{greeting}</Text>
        <View style={styles.locationRow}>
          <Text style={styles.pin}>📍</Text>
          <Text style={typography.bodySecondary}>{locationLabel ?? 'Finding you...'}</Text>
        </View>
      </View>
      <Pressable onPress={onAvatarPress} style={styles.avatar} accessibilityLabel="Profile">
        <Text style={styles.avatarText}>🙂</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pin: {
    fontSize: 13,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
});
