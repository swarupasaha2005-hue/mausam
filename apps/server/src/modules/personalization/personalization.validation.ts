import { ACTIVITIES, TIME_OF_DAY_OPTIONS, type Activity, type TimeOfDay } from '@cloud6/shared';

export function isValidTimeOfDay(value: unknown): value is TimeOfDay {
  return typeof value === 'string' && (TIME_OF_DAY_OPTIONS as string[]).includes(value);
}

export function isValidActivity(value: unknown): value is Activity {
  return typeof value === 'string' && (ACTIVITIES as string[]).includes(value);
}
