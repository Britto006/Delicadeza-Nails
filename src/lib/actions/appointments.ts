"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAppointmentSchema } from "@/lib/schemas/appointment";

export async function createAppointmentAction(slotId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autorizado" };
  }

  const raw = {
    slot_id: slotId,
    client_name: formData.get("client_name") as string,
    client_contact: formData.get("client_contact") as string,
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = createAppointmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { error } = await supabase.from("appointments").insert({
    slot_id: parsed.data.slot_id,
    client_name: parsed.data.client_name,
    client_contact: parsed.data.client_contact,
    notes: parsed.data.notes,
    status: "pending",
  });

  if (error) return { error: error.message };

  await supabase
    .from("time_slots")
    .update({ status: "pending", client_name: parsed.data.client_name, client_contact: parsed.data.client_contact })
    .eq("id", slotId);

  revalidatePath("/admin/reservas");
  revalidatePath("/admin/horarios");
  return { success: true };
}

export async function confirmAppointmentAction(appointmentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  const { data: appointment } = await supabase
    .from("appointments")
    .select("slot_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { error: "Agendamento não encontrado" };

  await supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", appointmentId);

  await supabase
    .from("time_slots")
    .update({ status: "booked" })
    .eq("id", appointment.slot_id);

  revalidatePath("/admin/reservas");
  revalidatePath("/admin/horarios");
  return { success: true };
}

export async function cancelAppointmentAction(appointmentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autorizado" };

  const { data: appointment } = await supabase
    .from("appointments")
    .select("slot_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { error: "Agendamento não encontrado" };

  await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  await supabase
    .from("time_slots")
    .update({ status: "available", client_name: null, client_contact: null })
    .eq("id", appointment.slot_id);

  revalidatePath("/admin/reservas");
  revalidatePath("/admin/horarios");
  return { success: true };
}
