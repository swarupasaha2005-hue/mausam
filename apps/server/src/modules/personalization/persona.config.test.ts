import { PERSONA_CONFIG, PERSONAS, isValidPersona } from './persona.config';

describe('isValidPersona', () => {
  it.each(PERSONAS)('accepts %s', (persona) => {
    expect(isValidPersona(persona)).toBe(true);
  });

  it('rejects an unknown persona', () => {
    expect(isValidPersona('astronaut')).toBe(false);
  });

  it('rejects a missing/undefined persona', () => {
    expect(isValidPersona(undefined)).toBe(false);
  });

  it('rejects a non-string value', () => {
    expect(isValidPersona(42)).toBe(false);
  });
});

describe('PERSONA_CONFIG consistency', () => {
  it.each(PERSONAS)('%s has a display name and description', (persona) => {
    const config = PERSONA_CONFIG[persona];
    expect(config.displayName.length).toBeGreaterThan(0);
    expect(config.description.length).toBeGreaterThan(0);
  });

  it.each(PERSONAS)('%s has non-empty weather priorities', (persona) => {
    expect(PERSONA_CONFIG[persona].weatherPriorities.length).toBeGreaterThan(0);
  });

  it.each(PERSONAS)('%s has a defined activities list', (persona) => {
    expect(Array.isArray(PERSONA_CONFIG[persona].activities)).toBe(true);
    expect(PERSONA_CONFIG[persona].activities.length).toBeGreaterThan(0);
  });

  it.each(PERSONAS)('%s has concerns defined', (persona) => {
    expect(Array.isArray(PERSONA_CONFIG[persona].concerns)).toBe(true);
  });
});

describe('persona-specific priorities', () => {
  it('runner cares about temperature, humidity, precipitation, UV', () => {
    const priorities = PERSONA_CONFIG.runner.weatherPriorities;
    expect(priorities).toEqual(
      expect.arrayContaining(['temperature', 'humidity', 'precipitation', 'uv']),
    );
  });

  it('commuter cares about precipitation, wind, visibility, severe weather', () => {
    const priorities = PERSONA_CONFIG.commuter.weatherPriorities;
    expect(priorities).toEqual(
      expect.arrayContaining(['precipitation', 'wind', 'visibility', 'severe_weather']),
    );
  });

  it('parent cares about precipitation, severe weather, air quality', () => {
    const priorities = PERSONA_CONFIG.parent.weatherPriorities;
    expect(priorities).toEqual(
      expect.arrayContaining(['precipitation', 'severe_weather', 'air_quality']),
    );
  });

  it('agriculture cares about precipitation, temperature, humidity, wind', () => {
    const priorities = PERSONA_CONFIG.agriculture.weatherPriorities;
    expect(priorities).toEqual(
      expect.arrayContaining(['precipitation', 'temperature', 'humidity', 'wind']),
    );
  });

  it('traveler cares about precipitation, wind, visibility, severe weather', () => {
    const priorities = PERSONA_CONFIG.traveler.weatherPriorities;
    expect(priorities).toEqual(
      expect.arrayContaining(['precipitation', 'wind', 'visibility', 'severe_weather']),
    );
  });

  it('health cares about temperature, feels_like, humidity, UV, air quality', () => {
    const priorities = PERSONA_CONFIG.health.weatherPriorities;
    expect(priorities).toEqual(
      expect.arrayContaining(['temperature', 'feels_like', 'humidity', 'uv', 'air_quality']),
    );
  });

  it('outdoor cares about temperature, precipitation, UV, wind', () => {
    const priorities = PERSONA_CONFIG.outdoor.weatherPriorities;
    expect(priorities).toEqual(
      expect.arrayContaining(['temperature', 'precipitation', 'uv', 'wind']),
    );
  });

  it('event_planner cares about precipitation, wind, temperature, severe weather', () => {
    const priorities = PERSONA_CONFIG.event_planner.weatherPriorities;
    expect(priorities).toEqual(
      expect.arrayContaining(['precipitation', 'wind', 'temperature', 'severe_weather']),
    );
  });
});
