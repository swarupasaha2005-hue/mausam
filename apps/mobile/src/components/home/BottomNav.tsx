import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface NavItem {
  label: string;
  icon: string;
  href: '/' | '/journey' | '/weather' | '/profile';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: '🏠', href: '/' },
  { label: 'Journey', icon: '🧭', href: '/journey' },
  { label: 'Weather', icon: '🌤️', href: '/weather' },
  { label: 'Profile', icon: '🙂', href: '/profile' },
];

/** Bottom navigation shared across top-level screens. Only routes to screens that exist. */
export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href)}
            style={styles.item}
            accessibilityLabel={item.label}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={[typography.meta, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  item: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.softBlue,
  },
  icon: {
    fontSize: 17,
  },
  labelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
