import { createClient } from "@/lib/supabase/client";
import type { WorkingHours, BlockedDay } from "@/types/database";

export interface StudioConfigData {
  working_hours: WorkingHours;
  blocked_days: BlockedDay[];
}

// Ordem do JS: getDay() → 0=domingo ... 6=sábado.
export const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export async function fetchStudioConfig(): Promise<StudioConfigData | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("studio_config")
    .select("working_hours, blocked_days")
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    working_hours: (data.working_hours ?? {}) as WorkingHours,
    blocked_days: (data.blocked_days ?? []) as BlockedDay[],
  };
}
