/**
 * Centralized CLOUD6 color palette. Components should import from here
 * rather than hardcoding hex values, so the palette can be refined later
 * by editing one file.
 */
export const colors = {
  background: '#F7F5F2',
  surface: '#FFFFFF',

  softBlue: '#DCEBFA',
  softBlueStrong: '#B9D9F5',
  softLavender: '#E6E1F7',
  softLavenderStrong: '#D2C9F0',
  softMint: '#DFF3EA',
  softMintStrong: '#C2E9D8',

  textPrimary: '#232323',
  textSecondary: '#7A7A7F',
  textInverse: '#FFFFFF',
  textMuted: '#A6A6AC',

  primaryCta: '#232323',
  border: '#ECE9E4',

  success: '#3E9C6F',
  warning: '#C97A2B',
  danger: '#C0392B',
} as const;

export type ThemeColors = typeof colors;
