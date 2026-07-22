"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CreateBatchDialogProps {
  open: boolean;
  onClose: () => void;
}

const weekDaysOptions = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
];

function generateTimeSlots(date: string, startTime: string, endTime: string, intervalMinutes: number) {
  const slots: { date: string; start_time: string; end_time: string; status: string }[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh] = endTime.split(":").map(Number);

  let currentMinutes = sh! * 60 + sm!;
  const endMinutes = eh! * 60;

  while (currentMinutes + intervalMinutes <= endMinutes) {
    const startH = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
    const startM = (currentMinutes % 60).toString().padStart(2, "0");
    const endTotal = currentMinutes + intervalMinutes;
    const endH = Math.floor(endTotal / 60).toString().padStart(2, "0");
    const endM = (endTotal % 60).toString().padStart(2, "0");

    slots.push({
      date,
      start_time: `${startH}:${startM}:00`,
      end_time: `${endH}:${endM}:00`,
      status: "available",
    });

    currentMinutes += intervalMinutes;
  }

  return slots;
}

export function CreateBatchDialog({ open, onClose }: CreateBatchDialogProps) {
  const [pending, setPending] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const dateFrom = formData.get("dateFrom") as string;
    const dateTo = formData.get("dateTo") as string;
    const weekDays = formData.getAll("weekDays").map(Number);
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const intervalMinutes = Number(formData.get("intervalMinutes"));

    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const allSlots: { date: string; start_time: string; end_time: string; status: string }[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (!weekDays.includes(d.getDay())) continue;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      allSlots.push(...generateTimeSlots(dateStr, startTime, endTime, intervalMinutes));
    }

    if (allSlots.length === 0) {
      toast.error("Nenhum horário para criar");
      setPending(false);
      return;
    }

    const { error } = await supabase.from("time_slots").insert(allSlots);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${allSlots.length} horários criados`);
      onClose();
    }
    setPending(false);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Criar Horários em Lote">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Data início</label>
            <input type="date" name="dateFrom" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Data fim</label>
            <input type="date" name="dateTo" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Dias da semana</label>
          <div className="flex flex-wrap gap-2">
            {weekDaysOptions.map((day) => (
              <label key={day.value} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/10">
                <input type="checkbox" name="weekDays" value={day.value} className="accent-primary" />
                {day.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Início</label>
            <input type="time" name="startTime" defaultValue="09:00" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Fim</label>
            <input type="time" name="endTime" defaultValue="18:00" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Intervalo</label>
            <select name="intervalMinutes" defaultValue="60" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1" disabled={pending}>{pending ? "Criando..." : "Criar Horários"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
