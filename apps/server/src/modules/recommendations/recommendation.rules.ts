import type {
  AirQuality,
  CurrentWeather,
  Persona,
  Recommendation,
  RecommendationFactor,
  RecommendationPriority,
  RecommendationType,
} from '@cloud6/shared';
import { SEVERE_WEATHER_CODES, THRESHOLDS } from './recommendation.thresholds';

/**
 * Weather -> triggered factors. Pure threshold checks, no persona
 * knowledge — that separation is what keeps this list easy to tune.
 */
export function evaluateFactors(
  weather: CurrentWeather,
  airQuality?: AirQuality,
): RecommendationFactor[] {
  const factors: RecommendationFactor[] = [];

  if (weather.temperature >= THRESHOLDS.HIGH_TEMPERATURE_C) factors.push('HIGH_TEMPERATURE');
  if (weather.feelsLike >= THRESHOLDS.HIGH_FEELS_LIKE_C) factors.push('HIGH_FEELS_LIKE');
  if (weather.humidity >= THRESHOLDS.HIGH_HUMIDITY_PERCENT) factors.push('HIGH_HUMIDITY');
  if (weather.uvIndex >= THRESHOLDS.HIGH_UV_INDEX) factors.push('HIGH_UV');

  if (weather.rainProbability >= THRESHOLDS.VERY_HIGH_RAIN_PROBABILITY_PERCENT) {
    factors.push('VERY_HIGH_RAIN_PROBABILITY');
  } else if (weather.rainProbability >= THRESHOLDS.HIGH_RAIN_PROBABILITY_PERCENT) {
    factors.push('HIGH_RAIN_PROBABILITY');
  }

  if (weather.windSpeed >= THRESHOLDS.HIGH_WIND_KMH) factors.push('HIGH_WIND');
  if (weather.visibility <= THRESHOLDS.LOW_VISIBILITY_KM) factors.push('LOW_VISIBILITY');
  if ((SEVERE_WEATHER_CODES as readonly string[]).includes(weather.weatherCode)) {
    factors.push('SEVERE_WEATHER');
  }
  if (airQuality && airQuality.aqi >= THRESHOLDS.HIGH_AQI) factors.push('POOR_AIR_QUALITY');

  if (factors.length === 0) {
    factors.push('FAVORABLE_CONDITIONS');
  }

  return factors;
}

interface FactorTemplate {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  message: string;
  action: string;
}

/**
 * Persona-flavored copy per factor. A missing (persona, factor) entry
 * falls back to GENERIC_FACTOR_TEMPLATES, so every persona gets a
 * reasonable recommendation even for factors without bespoke wording —
 * add an entry here to customize it further.
 */
const PERSONA_FACTOR_TEMPLATES: Partial<
  Record<Persona, Partial<Record<RecommendationFactor, FactorTemplate>>>
> = {
  runner: {
    HIGH_TEMPERATURE: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Hot conditions for a run',
      message: 'Temperature is high for outdoor running.',
      action: 'Consider running during a cooler window.',
    },
    HIGH_FEELS_LIKE: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Hot and humid for a run',
      message: 'Feels-like temperature is high.',
      action: 'Consider running during a cooler window and staying hydrated.',
    },
    HIGH_HUMIDITY: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Humid conditions for a run',
      message: 'Humidity is high.',
      action: 'Consider a lighter pace or a cooler time of day.',
    },
    HIGH_UV: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'High UV for outdoor running',
      message: 'UV levels are high.',
      action: 'Consider sun protection or an early-morning/evening run.',
    },
    HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Rain possible during your run',
      message: 'Rain probability is elevated.',
      action: 'Check conditions again closer to your run.',
    },
    VERY_HIGH_RAIN_PROBABILITY: {
      type: 'RESCHEDULE',
      priority: 'high',
      title: 'Rain likely during your run',
      message: 'Rain is likely during your planned activity.',
      action: 'Consider rescheduling your run.',
    },
    HIGH_WIND: {
      type: 'CAUTION',
      priority: 'low',
      title: 'Windy conditions for a run',
      message: 'Wind speed is high.',
      action: 'Plan your route with wind direction in mind.',
    },
    FAVORABLE_CONDITIONS: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Good conditions for a run',
      message: 'Conditions look comfortable for outdoor running.',
      action: 'Enjoy your run.',
    },
  },
  commuter: {
    HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Rain may affect your commute',
      message: 'Rain probability is elevated.',
      action: 'Consider leaving earlier and bringing rain gear.',
    },
    VERY_HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Rain likely during your commute',
      message: 'Rain is likely during your commute window.',
      action: 'Consider leaving earlier and bringing rain gear.',
    },
    HIGH_WIND: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Windy commute conditions',
      message: 'Wind speed is high.',
      action: 'Allow extra time, particularly if walking or cycling.',
    },
    LOW_VISIBILITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Low visibility for your commute',
      message: 'Visibility is reduced.',
      action: 'Allow extra travel time and drive/ride carefully.',
    },
    SEVERE_WEATHER: {
      type: 'ALERT',
      priority: 'severe',
      title: 'Severe weather during your commute',
      message: 'Severe weather is possible.',
      action: 'Check conditions before heading out and allow extra time.',
    },
    FAVORABLE_CONDITIONS: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Good commuting conditions',
      message: 'Conditions look clear for your commute.',
      action: 'No special precautions expected.',
    },
  },
  parent: {
    HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Rain likely around this time',
      message: 'Rain probability is elevated.',
      action: 'Consider planning outdoor activities earlier.',
    },
    VERY_HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Rain likely around this time',
      message: 'Rain is likely around this time.',
      action: 'Consider planning outdoor activities earlier or indoors.',
    },
    SEVERE_WEATHER: {
      type: 'ALERT',
      priority: 'severe',
      title: 'Severe weather expected',
      message: 'Severe weather is possible.',
      action: 'Consider keeping outdoor plans flexible.',
    },
    HIGH_UV: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'High UV today',
      message: 'UV levels are high.',
      action: 'Consider sun protection for outdoor time.',
    },
    POOR_AIR_QUALITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Air quality is a concern',
      message: 'Air quality levels are elevated.',
      action: 'Consider limiting prolonged outdoor exposure.',
    },
    FAVORABLE_CONDITIONS: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Good conditions today',
      message: 'Conditions look comfortable.',
      action: 'No special precautions expected.',
    },
  },
  agriculture: {
    HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Rain likely today',
      message: 'Rain probability is elevated.',
      action: 'Consider adjusting outdoor agricultural activities.',
    },
    VERY_HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Rain likely today',
      message: 'Rain is likely today.',
      action: 'Consider adjusting outdoor agricultural activities.',
    },
    HIGH_WIND: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Windy conditions',
      message: 'Wind speed is high.',
      action: 'Consider the effect of wind on spraying/irrigation timing.',
    },
    FAVORABLE_CONDITIONS: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Good conditions today',
      message: 'Conditions look stable.',
      action: 'No special precautions expected.',
    },
  },
  traveler: {
    HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Wet conditions are possible',
      message: 'Rain probability is elevated.',
      action: 'Plan for rain during your travel.',
    },
    VERY_HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Wet conditions are likely',
      message: 'Wet conditions are likely.',
      action: 'Plan for rain during your outdoor travel.',
    },
    LOW_VISIBILITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Low visibility while traveling',
      message: 'Visibility is reduced.',
      action: 'Allow extra travel time.',
    },
    SEVERE_WEATHER: {
      type: 'ALERT',
      priority: 'severe',
      title: 'Severe weather possible',
      message: 'Severe weather is possible along your travel.',
      action: 'Check conditions before departing.',
    },
    FAVORABLE_CONDITIONS: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Good travel conditions',
      message: 'Conditions look clear.',
      action: 'No special precautions expected.',
    },
  },
  health: {
    HIGH_TEMPERATURE: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'High temperature today',
      message: 'Temperature is high.',
      action: 'Consider limiting prolonged outdoor exposure and staying hydrated.',
    },
    HIGH_FEELS_LIKE: {
      type: 'CAUTION',
      priority: 'high',
      title: 'High heat index today',
      message: 'Feels-like temperature is high.',
      action: 'Consider limiting prolonged outdoor exposure and staying hydrated.',
    },
    HIGH_UV: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'UV levels are high',
      message: 'UV levels are high.',
      action: 'Consider limiting prolonged outdoor exposure.',
    },
    POOR_AIR_QUALITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Air quality is a concern',
      message: 'Air quality levels are elevated.',
      action: 'Consider limiting prolonged outdoor exposure.',
    },
    FAVORABLE_CONDITIONS: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Comfortable conditions',
      message: 'Conditions look comfortable.',
      action: 'No special precautions expected.',
    },
  },
  outdoor: {
    HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Rain possible for outdoor plans',
      message: 'Rain probability is elevated.',
      action: 'Keep an eye on conditions before heading out.',
    },
    VERY_HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Rain likely for outdoor plans',
      message: 'Rain is likely.',
      action: 'Consider an indoor alternative.',
    },
    HIGH_UV: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'High UV for outdoor time',
      message: 'UV levels are high.',
      action: 'Consider sun protection.',
    },
    HIGH_WIND: {
      type: 'CAUTION',
      priority: 'low',
      title: 'Windy outdoor conditions',
      message: 'Wind speed is high.',
      action: 'Plan accordingly for wind.',
    },
    FAVORABLE_CONDITIONS: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Good conditions for outdoor activity',
      message: 'Conditions look good for outdoor activity.',
      action: 'Enjoy your time outdoors.',
    },
  },
  event_planner: {
    HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Rain may affect outdoor plans',
      message: 'Rain probability is elevated.',
      action: 'Consider preparing an indoor backup.',
    },
    VERY_HIGH_RAIN_PROBABILITY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Rain likely to affect outdoor plans',
      message: 'Rain is likely.',
      action: 'Consider preparing an indoor backup.',
    },
    HIGH_WIND: {
      type: 'CAUTION',
      priority: 'medium',
      title: 'Windy conditions for your event',
      message: 'Wind speed is high.',
      action: 'Consider securing decorations/structures.',
    },
    SEVERE_WEATHER: {
      type: 'ALERT',
      priority: 'severe',
      title: 'Severe weather possible',
      message: 'Severe weather is possible.',
      action: 'Consider a contingency plan for the event.',
    },
    FAVORABLE_CONDITIONS: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Good conditions for your event',
      message: 'Conditions look favorable.',
      action: 'No special precautions expected.',
    },
  },
};

/** Generic fallback wording used when a persona has no bespoke template for a factor. */
const GENERIC_FACTOR_TEMPLATES: Record<RecommendationFactor, FactorTemplate> = {
  HIGH_TEMPERATURE: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'High temperature',
    message: 'Temperature is high.',
    action: 'Plan accordingly for the heat.',
  },
  HIGH_FEELS_LIKE: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'High heat index',
    message: 'Feels-like temperature is high.',
    action: 'Plan accordingly for the heat.',
  },
  HIGH_HUMIDITY: {
    type: 'CAUTION',
    priority: 'low',
    title: 'High humidity',
    message: 'Humidity is high.',
    action: 'Plan accordingly for humid conditions.',
  },
  HIGH_UV: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'High UV',
    message: 'UV levels are high.',
    action: 'Consider sun protection.',
  },
  HIGH_RAIN_PROBABILITY: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'Rain possible',
    message: 'Rain probability is elevated.',
    action: 'Keep an eye on conditions.',
  },
  VERY_HIGH_RAIN_PROBABILITY: {
    type: 'CAUTION',
    priority: 'high',
    title: 'Rain likely',
    message: 'Rain is likely.',
    action: 'Plan accordingly for rain.',
  },
  HIGH_WIND: {
    type: 'CAUTION',
    priority: 'low',
    title: 'High wind',
    message: 'Wind speed is high.',
    action: 'Plan accordingly for wind.',
  },
  LOW_VISIBILITY: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'Low visibility',
    message: 'Visibility is reduced.',
    action: 'Take extra care.',
  },
  SEVERE_WEATHER: {
    type: 'ALERT',
    priority: 'severe',
    title: 'Severe weather possible',
    message: 'Severe weather is possible.',
    action: 'Check conditions before heading out.',
  },
  POOR_AIR_QUALITY: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'Air quality concern',
    message: 'Air quality levels are elevated.',
    action: 'Consider limiting prolonged outdoor exposure.',
  },
  FAVORABLE_CONDITIONS: {
    type: 'FAVORABLE',
    priority: 'low',
    title: 'Favorable conditions',
    message: 'Conditions look favorable.',
    action: 'No special precautions expected.',
  },
};

/** Builds a persona-flavored Recommendation for one triggered factor. */
export function buildRecommendation(
  persona: Persona,
  factor: RecommendationFactor,
): Recommendation {
  const template = PERSONA_FACTOR_TEMPLATES[persona]?.[factor] ?? GENERIC_FACTOR_TEMPLATES[factor];
  return { ...template, reasons: [factor] };
}
