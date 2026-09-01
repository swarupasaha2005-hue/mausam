import type { Persona } from '@cloud6/shared';

/** Display-only persona phrasing — no persona rules, just copy formatting. */
export function personaContextLabel(persona: Persona): string {
  const words = persona.split('_').join(' ');
  return `For your ${words} plans`;
}
