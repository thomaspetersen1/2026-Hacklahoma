/**
 * ============================================================
 * lib/types.ts — Frontend-only types
 * ============================================================
 *
 * Shared types used by the frontend components.
 * These mirror the response shapes from the /server API.
 * No backend logic lives here — just type definitions.
 */

/** Travel mode options (matches server TravelMode) */
export type TravelMode = "WALK" | "DRIVE" | "TRANSIT";

/** Vibe options the user can select */
export type Vibe =
  | "Chill"
  | "Social"
  | "Active"
  | "Creative"
  | "Outdoors"
  | "Surprise";

/** Flow step for the morphing input wizard */
export type FlowStep = "time" | "transport" | "results";

/** State for the flow reducer */
export interface FlowState {
  step: FlowStep;
  timeValue: number; // 15-120 minutes
  transportMode: TravelMode;
  vibe: Vibe | undefined;
}

/** Actions for the flow reducer */
export type FlowAction =
  | { type: "SET_TIME"; value: number }
  | { type: "NEXT_STEP" }
  | { type: "SELECT_TRANSPORT"; mode: TravelMode }
  | { type: "SET_VIBE"; vibe: Vibe | undefined }
  | { type: "RESET" };

/**
 * A suggestion as returned by POST /api/suggest.
 * This is what SuggestionCard renders.
 */
export interface Suggestion {
  id: string;
  name: string;
  category: string;
  address?: string;
  location: { lat: number; lng: number };
  rating?: number;
  priceLevel?: number;
  openNow?: boolean;
  travelMinutes: number;
  dwellMinutes: number;
  bufferMinutes: number;
  totalMinutes: number;
  vibeMatch: string[];
  reason: string[];
  fitScore: number;
  mapsUrl: string;
}
