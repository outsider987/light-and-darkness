import type { LocationDef } from '../types';
export const LOCATIONS: Record<string, LocationDef> = {};
export function registerLocations(list: LocationDef[]): void {
  for (const l of list) LOCATIONS[l.id] = l;
}
