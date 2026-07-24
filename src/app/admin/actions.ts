"use server";

import { createClient } from "@/lib/supabase/server";
import type { WorkingHours, BlockedDay } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function loadConfig() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("studio_config")
    .select("*")
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function saveConfig(formData: FormData) {
  const supabase = await createClient();

  const workingHoursRaw = formData.get("working_hours") as string;
  const blockedDaysRaw = formData.get("blocked_days") as string;

  const working_hours: WorkingHours = JSON.parse(workingHoursRaw);
  const blocked_days: BlockedDay[] = JSON.parse(blockedDaysRaw);

  const { error } = await supabase
    .from("studio_config")
    .update({ working_hours, blocked_days })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracoes");
}
