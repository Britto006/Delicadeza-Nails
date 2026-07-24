export type SlotStatus = "available" | "pending" | "booked" | "blocked";

export interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  client_name: string | null;
  client_contact: string | null;
  created_at: string;
  updated_at: string;
}

// Colunas de time_slots visíveis ao público (anon não tem grant nas colunas
// de PII — ver migration 20260725000001).
export type PublicTimeSlot = Pick<
  TimeSlot,
  "id" | "date" | "start_time" | "end_time" | "status"
>;

export interface Profile {
  id: string;
  name: string;
  role: "admin" | "viewer";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DayConfig {
  open: boolean;
  start: string;
  end: string;
}

export type WorkingHours = Record<string, DayConfig>;

export interface BlockedDay {
  date: string;
  reason: string;
}

export interface StudioConfig {
  id: number;
  working_hours: WorkingHours;
  blocked_days: BlockedDay[];
  updated_at: string;
}
