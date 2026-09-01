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
  setActivities: (activities: Activity[]) => void;
}

const DEFAULT_PERSONA: Persona = 'runner';
const DEFAULT_TIME: TimeOfDay = 'flexible';

/**
 * Local selection state (persona/time/activities) plus the resulting
 * UserContext, fetched from PersonalizationService whenever the selection
 * changes. Not persisted — this is prototype-scope local state, not a
 * storage layer.
 */
export function usePersonalization(): UsePersonalizationResult {
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA);
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<TimeOfDay>(DEFAULT_TIME);
  const [selectedActivities, setActivities] = useState<Activity[]>([]);
  const [context, setContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PersonalizationError | null>(null);

  const fetchContext = useCallback(
    async (nextPersona: Persona, nextTime: TimeOfDay, nextActivities: Activity[]) => {
      setLoading(true);
      setError(null);
      try {
        const result = await personalizationService.createUserContext({
          persona: nextPersona,
          preferredTimeOfDay: nextTime,
          ...(nextActivities.length > 0 ? { activities: nextActivities } : {}),
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
    },
    [],
  );

  useEffect(() => {
    fetchContext(persona, preferredTimeOfDay, selectedActivities);
  }, [persona, preferredTimeOfDay, selectedActivities, fetchContext]);

  return {
    persona,
    preferredTimeOfDay,
    activities: context?.activities,
    context,
    loading,
    error,
    setPersona,
    setPreferredTimeOfDay,
    setActivities,
  };
}
