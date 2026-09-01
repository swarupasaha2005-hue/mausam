import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface NavItem {
  label: string;
  icon: string;
  href: '/' | '/journey' | '/weather' | '/profile';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: '⌂', href: '/' },
  { label: 'Journey', icon: '↗', href: '/journey' },
  { label: 'Weather', icon: '☁', href: '/weather' },
  { label: 'Profile', icon: '◉', href: '/profile' },
];

/** Floating, dark, pill-shaped bottom navigation. Only routes to screens that exist. */
export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              style={[styles.item, active && styles.itemActive]}
              accessibilityLabel={`${item.label} tab`}
            >
              <Text style={[styles.icon, active && styles.iconActive]}>{item.icon}</Text>
              {active && <Text style={styles.label}>{item.label}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  itemActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  icon: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.55)',
  },
  iconActive: {
    color: colors.textInverse,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
