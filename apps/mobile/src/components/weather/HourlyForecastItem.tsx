import { StyleSheet, Text, View } from 'react-native';
import type { HourlyWeather } from '@cloud6/shared';
import { colors, spacing, typography } from '../../theme';
import { weatherIcon } from '../home/weatherIcon';

interface HourlyForecastItemProps {
  hour: HourlyWeather;
}

function formatHour(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric' });
}

export function HourlyForecastItem({ hour }: HourlyForecastItemProps) {
  return (
    <View style={styles.item}>
      <Text style={typography.meta}>{formatHour(hour.timestamp)}</Text>
      <Text style={styles.icon}>{weatherIcon(hour.weatherCode)}</Text>
      <Text style={typography.cardTitle}>{Math.round(hour.temperature)}°</Text>
      {hour.rainProbability > 0 && <Text style={styles.rain}>{hour.rainProbability}%</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 56,
  },
  icon: {
    fontSize: 22,
  },
  rain: {
    ...typography.meta,
    color: colors.weather.rainStrong,
  },
});
