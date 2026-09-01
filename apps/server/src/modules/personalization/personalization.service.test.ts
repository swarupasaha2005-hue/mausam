import { PersonalizationError } from '@cloud6/shared';
import { PersonalizationService } from './personalization.service';
import { PERSONA_CONFIG } from './persona.config';

describe('PersonalizationService.getPersonaConfig', () => {
  const service = new PersonalizationService();

  it('returns the config for a valid persona', () => {
    expect(service.getPersonaConfig('runner')).toEqual(PERSONA_CONFIG.runner);
  });

  it('throws PERSONA_INVALID for an unknown persona', () => {
    expect(() => service.getPersonaConfig('astronaut' as never)).toThrow(PersonalizationError);
    expect(() => service.getPersonaConfig('astronaut' as never)).toThrow(
      expect.objectContaining({ code: 'PERSONA_INVALID' }),
    );
  });
});

describe('PersonalizationService.getWeatherPriorities', () => {
  const service = new PersonalizationService();

  it('returns the persona weather priorities', () => {
    expect(service.getWeatherPriorities('health')).toEqual(PERSONA_CONFIG.health.weatherPriorities);
  });
});

describe('PersonalizationService.createUserContext', () => {
  const service = new PersonalizationService();

  it('creates a full context from valid input', () => {
    const context = service.createUserContext({ persona: 'runner', preferredTimeOfDay: 'morning' });

    expect(context).toEqual({
      persona: 'runner',
      activities: ['running'],
      preferredTimeOfDay: 'morning',
      weatherPriorities: PERSONA_CONFIG.runner.weatherPriorities,
    });
  });

  it('defaults preferredTimeOfDay to flexible when omitted', () => {
    const context = service.createUserContext({ persona: 'commuter' });
    expect(context.preferredTimeOfDay).toBe('flexible');
  });

  it('defaults activities to the persona config activities when omitted', () => {
    const context = service.createUserContext({ persona: 'agriculture' });
    expect(context.activities).toEqual(PERSONA_CONFIG.agriculture.activities);
  });

  it('accepts an explicit activities override', () => {
    const context = service.createUserContext({ persona: 'outdoor', activities: ['event'] });
    expect(context.activities).toEqual(['event']);
  });

  it('throws PERSONA_INVALID for a missing/invalid persona', () => {
    expect(() => service.createUserContext({ persona: undefined as never })).toThrow(
      expect.objectContaining({ code: 'PERSONA_INVALID' }),
    );
  });

  it('throws TIME_INVALID for an invalid preferred time of day', () => {
    expect(() =>
      service.createUserContext({ persona: 'runner', preferredTimeOfDay: 'noon' as never }),
    ).toThrow(expect.objectContaining({ code: 'TIME_INVALID' }));
  });

  it('throws ACTIVITY_INVALID for an invalid activity', () => {
    expect(() =>
      service.createUserContext({ persona: 'runner', activities: ['sleeping' as never] }),
    ).toThrow(expect.objectContaining({ code: 'ACTIVITY_INVALID' }));
  });
});
