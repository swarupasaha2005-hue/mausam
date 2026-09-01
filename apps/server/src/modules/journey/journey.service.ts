import type { JourneyPlan, Route, SampleRouteOptions } from '@cloud6/shared';
import { calculateJourneyTimeline } from './journey.timeline';
import { sampleRoute } from './journey.sampler';
import { assertValidOptions, assertValidRoute, parseDepartureTime } from './journey.validation';

/**
 * Application-facing entry point. Validates input and composes the pure
 * sampler + timeline functions — never fetches weather, never calls an
 * external API. A future Journey Weather Engine will query
 * WeatherService.getWeatherAt() per checkpoint using this plan's output;
 * that lookup is intentionally not implemented here.
 */
export class JourneyService {
  planJourney(input: { route: unknown; departureTime?: unknown; options?: unknown }): JourneyPlan {
    assertValidRoute(input.route);
    assertValidOptions(input.options);
    const departureTime = parseDepartureTime(input.departureTime, new Date());

    const route = input.route as Route;
    const options = input.options as SampleRouteOptions | undefined;

    const sampled = sampleRoute(route, options);
    const totalDistanceKm = sampled[sampled.length - 1].distanceFromStartKm;
    const checkpoints = calculateJourneyTimeline(
      sampled,
      totalDistanceKm,
      route.durationMinutes,
      departureTime,
    );

    return {
      route,
      departureTime: departureTime.toISOString(),
      estimatedArrivalTime: checkpoints[checkpoints.length - 1].estimatedArrivalTime,
      durationMinutes: route.durationMinutes,
      checkpoints,
    };
  }
}

export const journeyService = new JourneyService();
