import {
  WeatherError,
  type JourneyCheckpoint,
  type JourneyPlan,
  type JourneyWeatherCheckpoint,
  type JourneyWeatherPlan,
} from '@cloud6/shared';
import { weatherService } from '../weather/weather.service';
import type { WeatherService } from '../weather/weather.service';
import { summarizeJourneyWeather } from './journey.weather.summary';
import { assertValidJourneyPlan } from './journey.weather.validation';

async function enrichCheckpoint(
  checkpoint: JourneyCheckpoint,
  weather: Pick<WeatherService, 'getWeatherAt'>,
): Promise<JourneyWeatherCheckpoint> {
  try {
    const result = await weather.getWeatherAt(checkpoint.point, checkpoint.estimatedArrivalTime);
    return {
      sequence: checkpoint.sequence,
      point: checkpoint.point,
      distanceFromStartKm: checkpoint.distanceFromStartKm,
      estimatedArrivalTime: checkpoint.estimatedArrivalTime,
      weather: result,
    };
  } catch (cause) {
    const error =
      cause instanceof WeatherError ? cause : new WeatherError('WEATHER_PROVIDER_ERROR');
    return {
      sequence: checkpoint.sequence,
      point: checkpoint.point,
      distanceFromStartKm: checkpoint.distanceFromStartKm,
      estimatedArrivalTime: checkpoint.estimatedArrivalTime,
      weather: null,
      weatherError: { code: error.code, message: error.message },
    };
  }
}

/**
 * Enriches an existing JourneyPlan's checkpoints with weather at each
 * checkpoint's location and estimated arrival time — via the existing
 * WeatherService.getWeatherAt(), never Open-Meteo directly. Does not
 * resample the route or recalculate the timeline (Phase 8's job); does
 * not generate recommendations (a future phase's job). A checkpoint
 * weather failure never discards the checkpoint or the rest of the plan.
 */
export class JourneyWeatherService {
  constructor(private readonly weather: Pick<WeatherService, 'getWeatherAt'> = weatherService) {}

  async enrichJourneyWeather(input: unknown): Promise<JourneyWeatherPlan> {
    assertValidJourneyPlan(input);
    const plan = input as JourneyPlan;

    const checkpoints = await Promise.all(
      plan.checkpoints.map((checkpoint) => enrichCheckpoint(checkpoint, this.weather)),
    );

    return {
      route: plan.route,
      departureTime: plan.departureTime,
      estimatedArrivalTime: plan.estimatedArrivalTime,
      durationMinutes: plan.durationMinutes,
      checkpoints,
      summary: summarizeJourneyWeather(checkpoints),
    };
  }
}

export const journeyWeatherService = new JourneyWeatherService();
