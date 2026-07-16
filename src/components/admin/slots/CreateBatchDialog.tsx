"use client";

import { useActionState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { createSlotsBatchAction } from "@/lib/actions/slots";

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

export function CreateBatchDialog({ open, onClose }: CreateBatchDialogProps) {
  const [state, formAction, pending] = useActionState(
    createSlotsBatchAction,
    undefined
  );

  return (
    <Dialog open={open} onClose={onClose} title="Criar Horários em Lote">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Data início
            </label>
            <input
              type="date"
              name="dateFrom"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Data fim
            </label>
            <input
              type="date"
              name="dateTo"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Dias da semana
          </label>
          <div className="flex flex-wrap gap-2">
            {weekDaysOptions.map((day) => (
              <label
                key={day.value}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors has-checked:border-primary has-checked:bg-primary/10"
              >
                <input
                  type="checkbox"
                  name="weekDays"
                  value={day.value}
                  className="accent-primary"
                />
                {day.label}
              </label>
            ))}
          </div>

        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Início
            </label>
            <input
              type="time"
              name="startTime"
              defaultValue="09:00"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Fim
            </label>
            <input
              type="time"
              name="endTime"
              defaultValue="18:00"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Intervalo
            </label>
            <select
              name="intervalMinutes"
              defaultValue="60"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
            </select>
          </div>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-slot-booked-bg px-3 py-2 text-sm text-slot-booked">
            {state.error}
          </p>
        )}

        {state?.success && (
          <p className="rounded-lg bg-slot-available-bg px-3 py-2 text-sm text-slot-available">
            {state.created} horários criados
            {state.skipped ? ` (${state.skipped} ignorados)` : ""}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? "Criando..." : "Criar Horários"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
