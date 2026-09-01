import type {
  JourneyAnalysis,
  JourneyFactor,
  JourneyRecommendation,
  Persona,
  RecommendationPriority,
  RecommendationType,
} from '@cloud6/shared';

interface FactorTemplate {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  message: string;
  action: string;
}

/**
 * Persona-flavored copy per top journey factor — same pattern as Phase
 * 5's `PERSONA_FACTOR_TEMPLATES`: a missing (persona, factor) entry falls
 * back to `GENERIC_FACTOR_TEMPLATES`.
 */
const PERSONA_FACTOR_TEMPLATES: Partial<
  Record<Persona, Partial<Record<JourneyFactor, FactorTemplate>>>
> = {
  runner: {
    RAIN_DURING_JOURNEY: {
      type: 'PREPARE',
      priority: 'medium',
      title: 'Rain expected during part of your run',
      message: 'Rain is expected during part of your planned route.',
      action: 'Carry rain protection or plan an alternate window.',
    },
    HEAVY_RAIN_DURING_JOURNEY: {
      type: 'RESCHEDULE',
      priority: 'high',
      title: 'Heavy rain expected during your run',
      message: 'Heavy rain is likely during your planned run.',
      action: 'Consider rescheduling or leaving earlier.',
    },
    THUNDERSTORM_DURING_JOURNEY: {
      type: 'AVOID',
      priority: 'severe',
      title: 'Thunderstorm along your route',
      message: 'Thunderstorm conditions are expected during your run.',
      action: 'Postpone your run until conditions clear.',
    },
    FAVORABLE_JOURNEY: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Good conditions for your run',
      message: 'Conditions look favorable for your entire route.',
      action: 'Enjoy your run.',
    },
  },
  commuter: {
    RAIN_DURING_JOURNEY: {
      type: 'PREPARE',
      priority: 'medium',
      title: 'Rain may affect part of your commute',
      message: 'Rain is expected during part of your commute.',
      action: 'Allow extra travel time and bring rain gear.',
    },
    HEAVY_RAIN_DURING_JOURNEY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Heavy rain expected during your commute',
      message: 'Heavy rain is likely during your commute.',
      action: 'Consider leaving earlier and allowing extra travel time.',
    },
    THUNDERSTORM_DURING_JOURNEY: {
      type: 'ALERT',
      priority: 'severe',
      title: 'Severe weather during your commute',
      message: 'Severe weather is expected along your commute.',
      action: 'Check conditions before heading out and allow significant extra time.',
    },
    FAVORABLE_JOURNEY: {
      type: 'FAVORABLE',
      priority: 'low',
      title: 'Good commuting conditions',
      message: 'Conditions look clear along your entire commute.',
      action: 'No special precautions expected.',
    },
  },
  traveler: {
    RAIN_DURING_JOURNEY: {
      type: 'PREPARE',
      priority: 'medium',
      title: 'Wet conditions along part of your journey',
      message: 'Rain is expected during part of your journey.',
      action: 'Plan for wet conditions along that portion of the route.',
    },
    HEAVY_RAIN_DURING_JOURNEY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Heavy rain along part of your journey',
      message: 'Heavy rain is likely during part of your journey.',
      action: 'Allow extra travel time and plan for wet conditions.',
    },
    THUNDERSTORM_DURING_JOURNEY: {
      type: 'ALERT',
      priority: 'severe',
      title: 'Severe weather along your journey',
      message: 'Severe weather is expected along part of your journey.',
      action: 'Check conditions before departing.',
    },
  },
  event_planner: {
    HEAVY_RAIN_DURING_JOURNEY: {
      type: 'CAUTION',
      priority: 'high',
      title: 'Heavy rain may affect travel to your event',
      message: 'Heavy rain is likely along the route.',
      action: 'Consider an indoor backup and allow extra travel time.',
    },
    THUNDERSTORM_DURING_JOURNEY: {
      type: 'ALERT',
      priority: 'severe',
      title: 'Severe weather along the route',
      message: 'Severe weather is expected along the route.',
      action: 'Consider a contingency plan.',
    },
  },
};

const GENERIC_FACTOR_TEMPLATES: Record<JourneyFactor, FactorTemplate> = {
  RAIN_DURING_JOURNEY: {
    type: 'PREPARE',
    priority: 'medium',
    title: 'Rain expected during your journey',
    message: 'Rain is expected during part of your journey.',
    action: 'Plan for rain during that portion of the route.',
  },
  HEAVY_RAIN_DURING_JOURNEY: {
    type: 'CAUTION',
    priority: 'high',
    title: 'Heavy rain expected during your journey',
    message: 'Heavy rain is likely during part of your journey.',
    action: 'Consider leaving earlier and allowing extra time.',
  },
  THUNDERSTORM_DURING_JOURNEY: {
    type: 'ALERT',
    priority: 'severe',
    title: 'Severe weather during your journey',
    message: 'Severe weather is expected along your journey.',
    action: 'Check conditions before departing and consider changing your timing.',
  },
  HIGH_WIND_DURING_JOURNEY: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'High wind during your journey',
    message: 'Wind speed is high during part of your journey.',
    action: 'Plan accordingly for wind.',
  },
  HIGH_HEAT_DURING_JOURNEY: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'High temperature during your journey',
    message: 'Temperature is high during part of your journey.',
    action: 'Plan accordingly for the heat.',
  },
  HIGH_UV_DURING_JOURNEY: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'High UV during your journey',
    message: 'UV levels are high during part of your journey.',
    action: 'Consider sun protection.',
  },
  WEATHER_DETERIORATION: {
    type: 'CAUTION',
    priority: 'medium',
    title: 'Weather deteriorates during your journey',
    message: 'Conditions are expected to worsen as your journey progresses.',
    action: 'Monitor conditions and allow extra time.',
  },
  SEVERE_WEATHER_NEAR_DESTINATION: {
    type: 'ALERT',
    priority: 'severe',
    title: 'Severe weather near your destination',
    message: 'Severe weather is expected as you approach your destination.',
    action: 'Check conditions again before you arrive.',
  },
  FAVORABLE_JOURNEY: {
    type: 'FAVORABLE',
    priority: 'low',
    title: 'Good conditions for your journey',
    message: 'Conditions look favorable along your entire route.',
    action: 'No special precautions expected.',
  },
};

/**
 * Builds the single actionable recommendation from the journey's top
 * (highest-severity) factor. Explanation comes from the analysis's own
 * `reasons` — never invented, never from an LLM.
 */
export function buildJourneyRecommendation(
  persona: Persona,
  analysis: JourneyAnalysis,
): JourneyRecommendation {
  const topFactor =
    analysis.factors.find((f) => f !== 'FAVORABLE_JOURNEY') ??
    analysis.factors[0] ??
    'FAVORABLE_JOURNEY';

  const template =
    PERSONA_FACTOR_TEMPLATES[persona]?.[topFactor] ?? GENERIC_FACTOR_TEMPLATES[topFactor];

  return {
    ...template,
    reasons: analysis.factors,
  };
}
