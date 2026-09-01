import { colors } from './colors';

/** Centralized type scale. Uses the platform default sans-serif — no custom font added. */
export const typography = {
  greeting: { fontSize: 22, fontWeight: '600' as const, color: colors.textPrimary },
  temperature: { fontSize: 64, fontWeight: '700' as const, color: colors.textPrimary },
  sectionTitle: { fontSize: 13, fontWeight: '700' as const, color: colors.textSecondary, letterSpacing: 0.6 },
  cardTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.textPrimary },
  bodySecondary: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  meta: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  button: { fontSize: 15, fontWeight: '600' as const },
} as const;
