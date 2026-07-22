"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
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
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const dates = getDatesInRange(parsed.data.dateFrom, parsed.data.dateTo);
  let created = 0;
  let skipped = 0;

  for (const date of dates) {
    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    if (!parsed.data.weekDays.includes(dayOfWeek)) continue;

    const slots = generateTimeSlots(
      date,
      parsed.data.startTime,
      parsed.data.endTime,
      parsed.data.intervalMinutes
    );

    for (const slot of slots) {
      const { data: existing } = await supabase
        .from("time_slots")
        .select("id")
        .eq("date", slot.date)
        .eq("start_time", slot.start_time)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("time_slots").insert({
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
