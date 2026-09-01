import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  /**
   * `surface` (default) is the plain white card used everywhere.
   * `blue`/`lavender`/`mint` are kept as the existing prop names for
   * screens that already pass them, but now render as restrained,
   * weather-contextual tints (cool/neutral/favorable) rather than
   * strong pastels — the palette that previously defined the whole app.
   */
  tone?: 'surface' | 'blue' | 'lavender' | 'mint';
}

const TONE_BACKGROUND: Record<NonNullable<CardProps['tone']>, string> = {
  surface: colors.surface,
  blue: colors.weather.rain,
  lavender: colors.surfaceSecondary,
  mint: colors.weather.favorable,
};

/** Base card: generous rounding, a subtle border instead of a heavy shadow, generous padding. */
export function Card({ children, style, tone = 'surface' }: CardProps) {
  return (
    <View style={[styles.card, { backgroundColor: TONE_BACKGROUND[tone] }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.large,
    padding: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
