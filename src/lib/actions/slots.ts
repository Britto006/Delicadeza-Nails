"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSlotsBatchSchema,
  updateSlotSchema,
} from "@/lib/schemas/slot";

function generateTimeSlots(
  date: string,
  startTime: string,
  endTime: string,
  intervalMinutes: number
) {
  const slots: { date: string; start_time: string; end_time: string }[] = [];
  const startParts = startTime.split(":").map(Number);
  const endParts = endTime.split(":").map(Number);
  const startH = startParts[0] ?? 0;
  const startM = startParts[1] ?? 0;
  const endH = endParts[0] ?? 0;
  const endM = endParts[1] ?? 0;

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + intervalMinutes <= end) {
    const next = current + intervalMinutes;
    const sh = Math.floor(current / 60).toString().padStart(2, "0");
    const sm = (current % 60).toString().padStart(2, "0");
    const eh = Math.floor(next / 60).toString().padStart(2, "0");
    const em = (next % 60).toString().padStart(2, "0");

    slots.push({
      date,
      start_time: `${sh}:${sm}`,
      end_time: `${eh}:${em}`,
    });

    current = next;
  }

  return slots;
}

function getDatesInRange(dateFrom: string, dateTo: string) {
  const dates: string[] = [];
  const current = new Date(dateFrom);
  const end = new Date(dateTo);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]!);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

type BatchState =
  | { error: string; success?: never; created?: never; skipped?: never }
  | { success: true; created: number; skipped: number; error?: never }
  | undefined;

export async function createSlotsBatchAction(
  prevState: BatchState,
  formData: FormData
): Promise<BatchState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autorizado" };
  }

  const raw = {
    dateFrom: formData.get("dateFrom") as string,
    dateTo: formData.get("dateTo") as string,
    weekDays: (formData.getAll("weekDays") as string[]).map(Number),
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    intervalMinutes: Number(formData.get("intervalMinutes")),
  };

  const parsed = createSlotsBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const adminClient = createAdminClient();
  const dates = getDatesInRange(parsed.data.dateFrom, parsed.data.dateTo);
  let created = 0;
  let skipped = 0;

  for (const date of dates) {
    const dayOfWeek = new Date(date).getDay();

    if (!parsed.data.weekDays.includes(dayOfWeek)) continue;

    const slots = generateTimeSlots(
      date,
      parsed.data.startTime,
      parsed.data.endTime,
      parsed.data.intervalMinutes
    );

    for (const slot of slots) {
      const { data: existing } = await adminClient
        .from("time_slots")
        .select("id")
        .eq("date", slot.date)
        .eq("start_time", slot.start_time)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await adminClient.from("time_slots").insert({
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "available",
      });

      if (error) {
        skipped++;
      } else {
        created++;
      }
    }
  }

  revalidatePath("/admin/horarios");
  return { success: true, created, skipped };
}

function generateDemoSlots(dateFrom: string, dateTo: string) {
  const slots: Array<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    client_name: string | null;
    client_contact: string | null;
    notes: null;
    created_at: string;
    updated_at: string;
  }> = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  const times = ["09:00", "10:30", "13:00", "15:00", "17:00"];
  const statuses: ("available" | "pending" | "booked" | "blocked")[] = [
    "available", "available", "booked", "available", "pending",
  ];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;

    times.forEach((t, i) => {
      const [h, m] = t.split(":").map(Number);
      const endH = (h! + 1).toString().padStart(2, "0");
      slots.push({
        id: `${dateStr}-${i}`,
        date: dateStr,
        start_time: `${t}:00`,
        end_time: `${endH}:${m!.toString().padStart(2, "0")}:00`,
        status: statuses[i % statuses.length]!,
        client_name: statuses[i % statuses.length] === "booked" ? "Maria Silva" : null,
        client_contact: statuses[i % statuses.length] === "pending" ? "(31) 99999-0001" : null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  return slots;
}

export async function listSlotsAction(dateFrom: string, dateTo: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    const data = generateDemoSlots(dateFrom, dateTo);
    return { data };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

export async function getPublicSlotsAction(date: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .eq("date", date)
    .eq("status", "available")
    .order("start_time", { ascending: true });

  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function updateSlotAction(slotId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autorizado" };
  }

  const raw: Record<string, unknown> = {};
  const status = formData.get("status");
  if (status) raw.status = status;
  const clientName = formData.get("client_name");
  if (clientName !== null) raw.client_name = clientName || null;
  const clientContact = formData.get("client_contact");
  if (clientContact !== null) raw.client_contact = clientContact || null;
  const notes = formData.get("notes");
  if (notes !== null) raw.notes = notes || null;

  const parsed = updateSlotSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { error } = await supabase
    .from("time_slots")
    .update(parsed.data)
    .eq("id", slotId);

  if (error) return { error: error.message };

  revalidatePath("/admin/horarios");
  revalidatePath("/");
  return { success: true };
}

export async function deleteSlotAction(slotId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autorizado" };
  }

  const { data: slot } = await supabase
    .from("time_slots")
    .select("status")
    .eq("id", slotId)
    .single();

  if (slot?.status === "booked") {
    return { error: "Não é possível excluir um horário reservado" };
  }

  const { error } = await supabase
    .from("time_slots")
    .delete()
    .eq("id", slotId);

  if (error) return { error: error.message };

  revalidatePath("/admin/horarios");
  revalidatePath("/");
  return { success: true };
}

export async function getMonthSlotsAction(year: number, month: number) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    const firstDay = `${monthStr}-01`;
    const lastDay = `${monthStr}-31`;
    const slots = generateDemoSlots(firstDay, lastDay);
    const grouped: Record<string, typeof slots> = {};
    for (const slot of slots) {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date]!.push(slot);
    }
    return { data: grouped };
  }

  const supabase = await createClient();

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .gte("date", `${monthStr}-01`)
    .lte("date", `${monthStr}-31`)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) return { error: error.message };

  const grouped: Record<string, typeof data> = {};

  for (const slot of data ?? []) {
    if (!grouped[slot.date]) {
      grouped[slot.date] = [];
    }
    grouped[slot.date]!.push(slot);
  }

  return { data: grouped };
}

export async function changeSlotStatusAction(
  slotId: string,
  status: "pending" | "booked" | "available" | "blocked"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autorizado" };
  }

  const { data: slot } = await supabase
    .from("time_slots")
    .select("status")
    .eq("id", slotId)
    .single();

  if (!slot) return { error: "Horário não encontrado" };

  const allowed: Record<string, string[]> = {
    available: ["pending", "blocked"],
    pending: ["booked", "available"],
    booked: ["pending"],
    blocked: ["available"],
  };

  if (!allowed[slot.status]?.includes(status)) {
    return {
      error: `Não é possível alterar de "${slot.status}" para "${status}"`,
    };
  }

  const { error } = await supabase
    .from("time_slots")
    .update({ status })
    .eq("id", slotId);

  if (error) return { error: error.message };

  revalidatePath("/admin/horarios");
  revalidatePath("/admin/reservas");
  revalidatePath("/");
  return { success: true };
}
