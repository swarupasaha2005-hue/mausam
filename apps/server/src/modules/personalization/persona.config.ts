import { PERSONAS, type Persona, type PersonaConfig } from '@cloud6/shared';

/**
 * Static persona definitions. Prototype configuration for SIH — intended
 * to be easy to read and edit, not exhaustive. Add/change personas here;
 * PersonalizationService and everything downstream reads from this map
 * rather than branching on persona by name.
 */
export const PERSONA_CONFIG: Record<Persona, PersonaConfig> = {
  runner: {
    displayName: 'Runner',
    description: 'Runs outdoors and needs to plan around heat, air, and rain.',
    weatherPriorities: [
      'temperature',
      'feels_like',
      'humidity',
      'precipitation',
      'rain_probability',
      'wind',
      'uv',
    ],
    activities: ['running'],
    concerns: ['heat exhaustion', 'dehydration', 'slippery routes'],
  },
  commuter: {
    displayName: 'Commuter',
    description: 'Travels to work/school daily and needs to plan the commute.',
    weatherPriorities: [
      'precipitation',
      'rain_probability',
      'wind',
      'visibility',
      'severe_weather',
      'temperature',
    ],
    activities: ['commuting'],
    concerns: ['delays', 'poor visibility', 'flooded roads'],
  },
  parent: {
    displayName: 'Parent',
    description: "Plans a child's school day and outdoor time.",
    weatherPriorities: [
      'precipitation',
      'rain_probability',
      'temperature',
      'severe_weather',
      'air_quality',
      'uv',
    ],
    activities: ['school'],
    concerns: ['child safety', 'air quality', 'sun exposure'],
  },
  agriculture: {
    displayName: 'Agriculture & Gardening',
    description:
      'Manages crops or a garden and needs to plan around soil and irrigation conditions.',
    weatherPriorities: ['precipitation', 'temperature', 'humidity', 'wind', 'uv'],
    activities: ['gardening'],
    concerns: ['frost', 'drought', 'irrigation timing'],
  },
  traveler: {
    displayName: 'Traveler',
    description: 'Traveling between locations and needs route-wide conditions.',
    weatherPriorities: ['precipitation', 'wind', 'temperature', 'visibility', 'severe_weather'],
    activities: ['travel'],
    concerns: ['travel delays', 'road conditions', 'severe weather en route'],
  },
  health: {
    displayName: 'Health-Conscious',
    description: 'Sensitive to heat, humidity, and air quality.',
    weatherPriorities: ['temperature', 'feels_like', 'humidity', 'uv', 'air_quality'],
    activities: ['outdoor'],
    concerns: ['heat stress', 'poor air quality', 'sun exposure'],
  },
  outdoor: {
    displayName: 'Beach & Outdoor',
    description: 'Spends leisure time outdoors and needs comfort/safety conditions.',
    weatherPriorities: ['temperature', 'precipitation', 'rain_probability', 'uv', 'wind'],
    activities: ['outdoor'],
    concerns: ['sunburn', 'sudden rain', 'strong wind'],
  },
  event_planner: {
    displayName: 'Event Planner',
    description: 'Plans outdoor or semi-outdoor events around weather risk.',
    weatherPriorities: [
      'precipitation',
      'rain_probability',
      'wind',
      'temperature',
      'severe_weather',
    ],
    activities: ['event'],
    concerns: ['event disruption', 'guest comfort', 'setup/teardown safety'],
  },
};

export { PERSONAS };

export function isValidPersona(value: unknown): value is Persona {
  return typeof value === 'string' && (PERSONAS as string[]).includes(value);
}
