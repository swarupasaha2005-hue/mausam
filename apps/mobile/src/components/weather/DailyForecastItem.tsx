import { StyleSheet, Text, View } from 'react-native';
import type { DailyWeather } from '@cloud6/shared';
import { colors, spacing, typography } from '../../theme';
import { weatherIcon } from '../home/weatherIcon';

interface DailyForecastItemProps {
  day: DailyWeather;
  label: string;
  isLast?: boolean;
}

export function DailyForecastItem({ day, label, isLast }: DailyForecastItemProps) {
  return (
    <View style={[styles.row, !isLast && styles.divider]}>
      <Text style={[typography.body, styles.day]}>{label}</Text>
      <Text style={styles.icon}>{weatherIcon(day.weatherCode)}</Text>
      {day.precipitationProbability > 0 && (
        <Text style={styles.rain}>{day.precipitationProbability}%</Text>
      )}
      <Text style={styles.range}>
        {Math.round(day.maxTemperature)}° / {Math.round(day.minTemperature)}°
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  day: {
    flex: 1,
    fontWeight: '600',
  },
  icon: {
    fontSize: 18,
    width: 32,
    textAlign: 'center',
  },
  rain: {
    ...typography.meta,
    color: colors.weather.rainStrong,
    width: 40,
    textAlign: 'right',
  },
  range: {
    ...typography.body,
    width: 80,
    textAlign: 'right',
  },
});
