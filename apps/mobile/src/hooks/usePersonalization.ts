import { useCallback, useEffect, useState } from 'react';
import {
  PersonalizationError,
  type Activity,
  type Persona,
  type TimeOfDay,
  type UserContext,
} from '@cloud6/shared';
import { personalizationService } from '../services/personalization';

interface UsePersonalizationState {
  persona: Persona;
  preferredTimeOfDay: TimeOfDay;
  activities: Activity[] | undefined;
  context: UserContext | null;
  loading: boolean;
  error: PersonalizationError | null;
}

interface UsePersonalizationResult extends UsePersonalizationState {
  setPersona: (persona: Persona) => void;
  setPreferredTimeOfDay: (time: TimeOfDay) => void;
}

const DEFAULT_PERSONA: Persona = 'runner';
const DEFAULT_TIME: TimeOfDay = 'flexible';

/**
 * Local selection state (persona/time) plus the resulting UserContext,
 * fetched from PersonalizationService whenever the selection changes.
 * Not persisted — this is prototype-scope local state, not a storage layer.
 */
export function usePersonalization(): UsePersonalizationResult {
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA);
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<TimeOfDay>(DEFAULT_TIME);
  const [context, setContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PersonalizationError | null>(null);

  const fetchContext = useCallback(async (nextPersona: Persona, nextTime: TimeOfDay) => {
    setLoading(true);
    setError(null);
    try {
      const result = await personalizationService.createUserContext({
        persona: nextPersona,
        preferredTimeOfDay: nextTime,
      });
      setContext(result);
    } catch (cause) {
      setContext(null);
      setError(
        cause instanceof PersonalizationError ? cause : new PersonalizationError('PERSONA_INVALID'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContext(persona, preferredTimeOfDay);
  }, [persona, preferredTimeOfDay, fetchContext]);

  return {
    persona,
    preferredTimeOfDay,
    activities: context?.activities,
    context,
    loading,
    error,
    setPersona,
    setPreferredTimeOfDay,
  };
}
