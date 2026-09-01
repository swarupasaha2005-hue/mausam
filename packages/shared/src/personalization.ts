/** Who the user is, for the purpose of deciding what weather info matters to them. */
export type Persona =
  | 'runner'
  | 'commuter'
  | 'parent'
  | 'agriculture'
  | 'traveler'
  | 'health'
  | 'outdoor'
  | 'event_planner';

/** What the user is doing. Kept separate from Persona since one could map to several. */
export type Activity =
  'running' | 'commuting' | 'school' | 'travel' | 'gardening' | 'outdoor' | 'event';

/** Contextual only — not a calendar/scheduling concept. */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';

/**
 * Weather factors a persona cares about. Deliberately mirrors fields
 * already present on CurrentWeather/HourlyWeather/DailyWeather so a
 * future Recommendation Engine can look these up directly.
 */
export type WeatherPriority =
  | 'temperature'
  | 'feels_like'
  | 'humidity'
  | 'precipitation'
  | 'rain_probability'
  | 'wind'
  | 'uv'
  | 'visibility'
  | 'severe_weather'
  | 'air_quality';

/** Static, editable definition of what a persona cares about. */
export interface PersonaConfig {
  displayName: string;
  description: string;
  weatherPriorities: WeatherPriority[];
  activities: Activity[];
  concerns: string[];
}

/**
 * A user's personalization context — persona + activity + time preference
 * + the weather priorities that follow from the persona. This is what a
 * future Recommendation Engine will combine with a WeatherSnapshot.
 */
export interface UserContext {
  persona: Persona;
  activities: Activity[];
  preferredTimeOfDay: TimeOfDay;
  weatherPriorities: WeatherPriority[];
}

/** Input for creating a UserContext — only persona is required. */
export interface UserContextInput {
  persona: Persona;
  preferredTimeOfDay?: TimeOfDay;
  activities?: Activity[];
}

/** Enumerations shared by backend validation and mobile UI pickers. */
export const PERSONAS: Persona[] = [
  'runner',
  'commuter',
  'parent',
  'agriculture',
  'traveler',
  'health',
  'outdoor',
  'event_planner',
];

export const TIME_OF_DAY_OPTIONS: TimeOfDay[] = [
  'morning',
  'afternoon',
  'evening',
  'night',
  'flexible',
];

export const ACTIVITIES: Activity[] = [
  'running',
  'commuting',
  'school',
  'travel',
  'gardening',
  'outdoor',
  'event',
];
