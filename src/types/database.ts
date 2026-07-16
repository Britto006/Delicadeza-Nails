export type SlotStatus = "available" | "pending" | "booked" | "blocked";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  client_name: string | null;
  client_contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  slot_id: string;
  client_name: string;
  client_contact: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  role: "admin";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
