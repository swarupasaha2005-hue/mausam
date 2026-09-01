import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  tone?: 'surface' | 'blue' | 'lavender' | 'mint';
}

const TONE_BACKGROUND: Record<NonNullable<CardProps['tone']>, string> = {
  surface: colors.surface,
  blue: colors.softBlue,
  lavender: colors.softLavender,
  mint: colors.softMint,
};

/** Base card: large rounded corners, subtle elevation, generous padding. Reused by all Home cards. */
export function Card({ children, style, tone = 'surface' }: CardProps) {
  return (
    <View style={[styles.card, { backgroundColor: TONE_BACKGROUND[tone] }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
});
