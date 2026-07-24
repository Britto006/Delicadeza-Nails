"use server";

import { createClient } from "@/lib/supabase/server";
import { studioConfigSchema } from "@/lib/schemas/config";
import { revalidatePath } from "next/cache";

export async function saveConfig(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  let raw: unknown;
  try {
    raw = {
      working_hours: JSON.parse(formData.get("working_hours") as string),
      blocked_days: JSON.parse(formData.get("blocked_days") as string),
      slot_interval_minutes: Number(formData.get("slot_interval_minutes")),
      weeks_ahead: Number(formData.get("weeks_ahead")),
    };
  } catch {
    throw new Error("Dados inválidos");
  }

  const parsed = studioConfigSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Dados inválidos");

  const { data: row, error: fetchError } = await supabase
    .from("studio_config")
    .select("id")
    .limit(1)
    .single();

  if (fetchError || !row) throw new Error("Configuração não encontrada");

  const { data: updated, error } = await supabase
    .from("studio_config")
    .update({
      working_hours: parsed.data.working_hours,
      blocked_days: parsed.data.blocked_days,
      slot_interval_minutes: parsed.data.slot_interval_minutes,
      weeks_ahead: parsed.data.weeks_ahead,
    })
    .eq("id", row.id)
    .select("id")
    .single();

  if (error || !updated) throw new Error(error?.message ?? "Nada foi salvo");

  revalidatePath("/admin/configuracoes");
  revalidatePath("/");
}
