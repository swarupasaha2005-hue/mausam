import { colors } from './colors';

/**
 * Centralized type scale — an editorial, restrained hierarchy (hero →
 * label). Uses the platform default sans-serif; no decorative/custom
 * font added. Avoids stacking many weights: only regular/medium/
 * semibold/bold appear, and never more than one bold element per card.
 */
export const typography = {
  hero: { fontSize: 56, fontWeight: '600' as const, color: colors.textPrimary, letterSpacing: -1 },
  screenTitle: { fontSize: 20, fontWeight: '600' as const, color: colors.textPrimary },
  greeting: { fontSize: 22, fontWeight: '600' as const, color: colors.textPrimary },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  cardTitle: { fontSize: 16, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.textPrimary },
  bodySecondary: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  label: { fontSize: 13, fontWeight: '500' as const, color: colors.textSecondary },
  meta: { fontSize: 12, fontWeight: '500' as const, color: colors.textTertiary },
  button: { fontSize: 15, fontWeight: '600' as const },
} as const;
