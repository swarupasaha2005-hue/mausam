import {
  PersonalizationError,
  type Persona,
  type PersonaConfig,
  type UserContext,
  type UserContextInput,
  type WeatherPriority,
} from '@cloud6/shared';
import { isValidPersona, PERSONA_CONFIG } from './persona.config';
import { isValidActivity, isValidTimeOfDay } from './personalization.validation';

const DEFAULT_TIME_OF_DAY = 'flexible' as const;

/**
 * Owns persona configuration lookup and UserContext creation — nothing
 * about weather fetching or recommendations. WeatherService and this
 * service are combined by a future RecommendationService, not by either
 * of them depending on the other.
 */
export class PersonalizationService {
  getPersonaConfig(persona: Persona): PersonaConfig {
    if (!isValidPersona(persona)) {
      throw new PersonalizationError('PERSONA_INVALID', `Unknown persona: ${String(persona)}`);
    }
    return PERSONA_CONFIG[persona];
  }

  getWeatherPriorities(persona: Persona): WeatherPriority[] {
    return this.getPersonaConfig(persona).weatherPriorities;
  }

  createUserContext(input: UserContextInput): UserContext {
    if (!isValidPersona(input.persona)) {
      throw new PersonalizationError(
        'PERSONA_INVALID',
        `Unknown persona: ${String(input.persona)}`,
      );
    }

    const preferredTimeOfDay = input.preferredTimeOfDay ?? DEFAULT_TIME_OF_DAY;
    if (!isValidTimeOfDay(preferredTimeOfDay)) {
      throw new PersonalizationError(
        'TIME_INVALID',
        `Unknown preferred time of day: ${String(preferredTimeOfDay)}`,
      );
    }

    const config = this.getPersonaConfig(input.persona);
    const activities = input.activities ?? config.activities;
    for (const activity of activities) {
      if (!isValidActivity(activity)) {
        throw new PersonalizationError('ACTIVITY_INVALID', `Unknown activity: ${String(activity)}`);
      }
    }

    return {
      persona: input.persona,
      activities,
      preferredTimeOfDay,
      weatherPriorities: config.weatherPriorities,
    };
  }
}

export const personalizationService = new PersonalizationService();
