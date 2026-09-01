/** Presentation-only date formatting shared by the Journey Weather components — no weather/time logic. */
export function formatCheckpointTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)} km`;
}
