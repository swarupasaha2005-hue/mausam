import { useCallback, useEffect, useState } from 'react';
import type { Persona, TimeOfDay } from '@cloud6/shared';
import { dashboardService, type PersonalizedWeatherResult } from '../services/dashboard';

type Status = 'idle' | 'loading' | 'success' | 'error';

const DEFAULT_PERSONA: Persona = 'runner';
const DEFAULT_TIME: TimeOfDay = 'flexible';

function emptyResult(): PersonalizedWeatherResult {
  return {
    location: null,
    locationError: null,
    weather: null,
    weatherError: null,
    userContext: null,
    personalizationError: null,
    recommendation: null,
    recommendationError: null,
  };
}

function statusMessageFor(status: Status, result: PersonalizedWeatherResult): string {
  if (status === 'loading') {
    if (!result.location) return 'Getting your location...';
    if (!result.weather && !result.weatherError) return 'Checking the weather...';
    return 'Generating your personalized recommendation...';
  }
  if (status === 'error') {
    if (result.locationError) {
      return "We couldn't access your location. Please enable location access or try again.";
    }
    if (result.weatherError) {
      return "We couldn't retrieve the weather right now. Please try again.";
    }
  }
  return '';
}

interface UsePersonalizedWeatherResult extends PersonalizedWeatherResult {
  status: Status;
  statusMessage: string;
  persona: Persona;
  preferredTimeOfDay: TimeOfDay;
  setPersona: (persona: Persona) => void;
  setPreferredTimeOfDay: (time: TimeOfDay) => void;
  refresh: () => Promise<void>;
}

/**
 * Thin UI-facing wrapper around dashboardService. Owns only local
 * selection state (persona/time) and loading/status bookkeeping — all
 * weather/personalization/recommendation logic lives in the services
 * dashboardService orchestrates.
 */
export function usePersonalizedWeather(): UsePersonalizedWeatherResult {
  const [persona, setPersonaState] = useState<Persona>(DEFAULT_PERSONA);
  const [preferredTimeOfDay, setPreferredTimeOfDayState] = useState<TimeOfDay>(DEFAULT_TIME);
  const [result, setResult] = useState<PersonalizedWeatherResult>(emptyResult());
  const [status, setStatus] = useState<Status>('idle');

  const refresh = useCallback(async () => {
    setStatus('loading');
    const next = await dashboardService.getPersonalizedWeatherExperience({
      persona,
      preferredTimeOfDay,
    });
    setResult(next);
    setStatus(next.locationError || next.weatherError ? 'error' : 'success');
  }, [persona, preferredTimeOfDay]);

  // Auto-load once on mount only — no polling. `refresh` intentionally
  // excluded from deps so persona/time changes don't trigger a full re-fetch.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, []);

  const regenerate = useCallback(
    async (nextPersona: Persona, nextTime: TimeOfDay) => {
      if (!result.weather) {
        // No weather yet (still loading, or location/weather failed) —
        // nothing to regenerate a recommendation from yet.
        return;
      }
      const partial = await dashboardService.regenerateRecommendation(result.weather, {
        persona: nextPersona,
        preferredTimeOfDay: nextTime,
      });
      setResult((prev) => ({ ...prev, ...partial }));
    },
    [result.weather],
  );

  const setPersona = useCallback(
    (nextPersona: Persona) => {
      setPersonaState(nextPersona);
      regenerate(nextPersona, preferredTimeOfDay);
    },
    [preferredTimeOfDay, regenerate],
  );

  const setPreferredTimeOfDay = useCallback(
    (nextTime: TimeOfDay) => {
      setPreferredTimeOfDayState(nextTime);
      regenerate(persona, nextTime);
    },
    [persona, regenerate],
  );

  return {
    ...result,
    status,
    statusMessage: statusMessageFor(status, result),
    persona,
    preferredTimeOfDay,
    setPersona,
    setPreferredTimeOfDay,
    refresh,
  };
}
