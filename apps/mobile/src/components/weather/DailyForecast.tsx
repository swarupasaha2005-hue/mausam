import { StyleSheet, Text } from 'react-native';
import type { DailyWeather, WeatherError } from '@cloud6/shared';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';
import { DailyForecastItem } from './DailyForecastItem';

interface DailyForecastProps {
  days: DailyWeather[];
  loading: boolean;
  error: WeatherError | null;
}

/** Presentation-only day labeling (Today/Tomorrow/weekday) — no forecast logic. */
function dayLabel(dateString: string, index: number): string {
  if (index === 0) return 'TODAY';
  if (index === 1) return 'TOMORROW';
  return new Date(dateString).toLocaleDateString([], { weekday: 'short' }).toUpperCase();
}

export function DailyForecast({ days, loading, error }: DailyForecastProps) {
  return (
    <Card>
      <Text style={typography.sectionTitle}>THIS WEEK</Text>

      {days.length > 0 && (
        <>
          {days.map((day, index) => (
            <DailyForecastItem
              key={day.date}
              day={day}
              label={dayLabel(day.date, index)}
              isLast={index === days.length - 1}
            />
          ))}
        </>
      )}

      {days.length === 0 && loading && (
        <Text style={styles.placeholder}>Loading daily forecast…</Text>
      )}

      {days.length === 0 && !loading && error && (
        <Text style={styles.placeholder}>Daily forecast unavailable right now.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
