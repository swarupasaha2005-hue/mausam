/**
 * Centralized corner-radius scale. Large cards use generous rounding;
 * compact controls (buttons, chips) use `pill`. Kept separate from
 * spacing.ts so the two scales can be tuned independently.
 */
export const radius = {
  small: 10,
  medium: 16,
  large: 24,
  extraLarge: 32,
  pill: 999,
} as const;
