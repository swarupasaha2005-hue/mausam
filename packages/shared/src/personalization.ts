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

/** Display-only persona copy for UI pickers (icon/name/description). Not a second source of truth for weatherPriorities/activities — those still come from the backend UserContext. */
export interface PersonaDisplay {
  icon: string;
  displayName: string;
  description: string;
}

export const PERSONA_DISPLAY: Record<Persona, PersonaDisplay> = {
  runner: {
    icon: '🏃',
    displayName: 'Runner',
    description: 'Get insights about heat, rain, UV, and conditions that may affect your run.',
  },
  commuter: {
    icon: '🚗',
    displayName: 'Commuter',
    description: 'Stay ahead of rain, wind, and visibility on your way to and from work.',
  },
  parent: {
    icon: '👨‍👩‍👧',
    displayName: 'Parent',
    description: 'Know what conditions to expect for school runs and time outside with kids.',
  },
  agriculture: {
    icon: '🌱',
    displayName: 'Agriculture',
    description: 'Track rain, humidity, and conditions that matter for crops and fieldwork.',
  },
  traveler: {
    icon: '✈️',
    displayName: 'Traveler',
    description: 'See the conditions that could affect your trip, from departure to arrival.',
  },
  health: {
    icon: '❤️',
    displayName: 'Health',
    description: 'Watch for heat, air quality, and UV that can affect how you feel outdoors.',
  },
  outdoor: {
    icon: '🌤️',
    displayName: 'Outdoor',
    description: 'Plan hikes, walks, and time outside around the conditions that matter most.',
  },
  event_planner: {
    icon: '🎉',
    displayName: 'Event Planner',
    description: 'Keep an eye on rain and wind so your outdoor event goes smoothly.',
  },
};

/** Display-only copy for the preferred-time-of-day picker. */
export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
  flexible: 'Flexible',
};

/** Display-only copy for the activity picker. */
export const ACTIVITY_LABELS: Record<Activity, string> = {
  running: 'Running',
  commuting: 'Commuting',
  school: 'School',
  travel: 'Travel',
  gardening: 'Gardening',
  outdoor: 'Outdoor',
  event: 'Event',
};

/** Display-only copy for the read-only "CLOUD6 will watch for" weather priority preview. */
export const WEATHER_PRIORITY_DISPLAY: Record<WeatherPriority, { icon: string; label: string }> = {
  temperature: { icon: '🌡️', label: 'Temperature' },
  feels_like: { icon: '🌡️', label: 'Feels Like' },
  humidity: { icon: '💧', label: 'Humidity' },
  precipitation: { icon: '🌧️', label: 'Precipitation' },
  rain_probability: { icon: '🌧️', label: 'Rain' },
  wind: { icon: '💨', label: 'Wind' },
  uv: { icon: '☀️', label: 'UV' },
  visibility: { icon: '👁️', label: 'Visibility' },
  severe_weather: { icon: '⛈️', label: 'Severe Weather' },
  air_quality: { icon: '🌫️', label: 'Air Quality' },
};
