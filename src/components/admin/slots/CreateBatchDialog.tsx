"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { parseDateString, toLocalDateString } from "@/lib/utils/date";
import { fetchStudioConfig, DAY_KEYS, type StudioConfigData } from "@/lib/config";
import { toast } from "sonner";

interface CreateBatchDialogProps {
  open: boolean;
  onClose: () => void;
}

const weekDaysOptions = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

function generateTimeSlots(date: string, startTime: string, endTime: string, intervalMinutes: number) {
  const slots: { date: string; start_time: string; end_time: string; status: string }[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  let currentMinutes = sh! * 60 + sm!;
  const endMinutes = eh! * 60 + (em ?? 0);

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
  const [config, setConfig] = useState<StudioConfigData | null>(null);
  const [checkedDays, setCheckedDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const supabase = createClient();

  // Pré-preenche dias e horários com o horário de funcionamento configurado.
  useEffect(() => {
    if (!open) return;
    fetchStudioConfig().then((data) => {
      if (!data) return;
      setConfig(data);
      const openDays = weekDaysOptions
        .map((d) => d.value)
        .filter((v) => data.working_hours[DAY_KEYS[v]!]?.open);
      if (openDays.length > 0) {
        setCheckedDays(new Set(openDays));
        const first = data.working_hours[DAY_KEYS[openDays[0]!]!]!;
        setStartTime(first.start);
        setEndTime(first.end);
      }
    });
  }, [open]);

  const toggleDay = (value: number) => {
    setCheckedDays((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const dateFrom = formData.get("dateFrom") as string;
    const dateTo = formData.get("dateTo") as string;
    const weekDays = [...checkedDays];
    const intervalMinutes = Number(formData.get("intervalMinutes"));
    const blockedDates = new Set((config?.blocked_days ?? []).map((b) => b.date));
    let skippedBlocked = 0;

    // parseDateString interpreta como data local; new Date("yyyy-MM-dd") seria
    // UTC e geraria os slots no dia anterior (e no dia da semana errado).
    const start = parseDateString(dateFrom);
    const end = parseDateString(dateTo);
    const allSlots: { date: string; start_time: string; end_time: string; status: string }[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (!weekDays.includes(d.getDay())) continue;
      const dateStr = toLocalDateString(d);
      if (blockedDates.has(dateStr)) {
        skippedBlocked++;
        continue;
      }
      allSlots.push(...generateTimeSlots(dateStr, startTime, endTime, intervalMinutes));
    }

    if (allSlots.length === 0) {
      toast.error("Selecione ao menos um dia da semana e um período válido.");
      setPending(false);
      return;
    }

    const { data, error } = await supabase
      .from("time_slots")
      .upsert(allSlots, { onConflict: "date,start_time", ignoreDuplicates: true })
      .select("id");

    if (error) {
      toast.error(error.message);
    } else {
      const created = data?.length ?? 0;
      const skipped = allSlots.length - created;
      const parts = [`${created} horários criados`];
      if (skipped > 0) parts.push(`${skipped} já existiam`);
      if (skippedBlocked > 0) parts.push(`${skippedBlocked} dia(s) bloqueado(s) pulado(s)`);
      toast.success(parts.join(", "));
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
                <input
                  type="checkbox"
                  name="weekDays"
                  value={day.value}
                  checked={checkedDays.has(day.value)}
                  onChange={() => toggleDay(day.value)}
                  className="accent-primary"
                />
                {day.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Início</label>
            <input type="time" name="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Fim</label>
            <input type="time" name="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
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
