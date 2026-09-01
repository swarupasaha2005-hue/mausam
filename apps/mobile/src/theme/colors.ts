/**
 * Centralized CLOUD6 color palette — a premium, restrained
 * charcoal/off-white system (not the earlier pastel-card palette).
 * Components should import from here rather than hardcoding hex
 * values, so the entire visual identity can be changed by editing
 * this one file.
 */
export const colors = {
  background: '#F4F2EE',
  surface: '#FFFFFF',
  surfaceSecondary: '#EFEDE8',

  primary: '#181818',
  primaryPressed: '#000000',

  textPrimary: '#181818',
  textSecondary: '#6E6C68',
  textTertiary: '#A3A19B',
  textInverse: '#FFFFFF',

  border: '#E6E3DC',
  borderStrong: '#D8D4CA',

  success: '#3F7A5C',
  warning: '#B07A2E',
  danger: '#B2452E',

  /**
   * Restrained, contextual weather accents — used sparingly (e.g. a
   * checkpoint icon tint or a single card background), never as the
   * app's defining palette. Each is a soft, desaturated tint plus a
   * matching "strong" tone for icon/text accents.
   */
  weather: {
    clear: '#F3E8D2',
    clearStrong: '#B8863A',
    cloudy: '#EDECE8',
    cloudyStrong: '#8B8A85',
    rain: '#DEE6E9',
    rainStrong: '#4A7686',
    storm: '#2A2C30',
    stormStrong: '#585B61',
    favorable: '#E1EAE2',
    favorableStrong: '#3F7A5C',
  },
} as const;

export type ThemeColors = typeof colors;
