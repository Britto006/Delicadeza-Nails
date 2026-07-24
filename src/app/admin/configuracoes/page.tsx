"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { STUDIO_NAME, WHATSAPP_NUMBER } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { saveConfig } from "@/app/admin/actions";
import { toast } from "sonner";
import type { WorkingHours, BlockedDay } from "@/types/database";

const DEFAULT_HOURS: WorkingHours = {
  monday: { open: true, start: "09:00", end: "18:00" },
  tuesday: { open: true, start: "09:00", end: "18:00" },
  wednesday: { open: true, start: "09:00", end: "18:00" },
  thursday: { open: true, start: "09:00", end: "18:00" },
  friday: { open: true, start: "09:00", end: "18:00" },
  saturday: { open: true, start: "09:00", end: "13:00" },
  sunday: { open: false, start: "09:00", end: "13:00" },
};

const DAY_LABELS: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

// Ordem de exibição fixa (Object.entries de jsonb não preserva ordem).
const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function ConfiguracoesPage() {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_HOURS);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");
  const [slotInterval, setSlotInterval] = useState(90);
  const [weeksAhead, setWeeksAhead] = useState(6);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("studio_config")
      .select("*")
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const hours = data.working_hours as WorkingHours;
          // Config vazia (linha recém-criada) mantém os defaults da UI.
          if (hours && Object.keys(hours).length > 0) {
            setWorkingHours(hours);
          }
          setBlockedDays((data.blocked_days ?? []) as BlockedDay[]);
          if (data.slot_interval_minutes) setSlotInterval(data.slot_interval_minutes);
          if (data.weeks_ahead) setWeeksAhead(data.weeks_ahead);
        }
        setLoading(false);
      });
  }, []);

  const handleAddBlockedDay = () => {
    if (!newBlockedDate || !newBlockedReason) return;
    setBlockedDays([...blockedDays, { date: newBlockedDate, reason: newBlockedReason }]);
    setNewBlockedDate("");
    setNewBlockedReason("");
  };

  const handleRemoveBlockedDay = (index: number) => {
    setBlockedDays(blockedDays.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("working_hours", JSON.stringify(workingHours));
      formData.set("blocked_days", JSON.stringify(blockedDays));
      formData.set("slot_interval_minutes", String(slotInterval));
      formData.set("weeks_ahead", String(weeksAhead));
      await saveConfig(formData);
      toast.success("Configurações salvas");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Horário de funcionamento e dias bloqueados
          </p>
        </div>
        {!loading && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-card shadow-medium" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-serif text-lg text-foreground">Horário de Funcionamento</h2>
            <div className="space-y-3">
              {DAY_ORDER.filter((day) => workingHours[day]).map((day) => {
                const config = workingHours[day]!;
                return (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.open}
                      onChange={() =>
                        setWorkingHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day]!, open: !prev[day]!.open },
                        }))
                      }
                      className="accent-primary"
                    />
                    <span className="min-w-20 text-sm font-medium text-foreground">
                      {DAY_LABELS[day]}
                    </span>
                  </label>
                  {config.open ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={config.start}
                        onChange={(e) =>
                          setWorkingHours((prev) => ({
                            ...prev,
                            [day]: { ...prev[day]!, start: e.target.value },
                          }))
                        }
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                      />
                      <span className="text-muted-foreground">às</span>
                      <input
                        type="time"
                        value={config.end}
                        onChange={(e) =>
                          setWorkingHours((prev) => ({
                            ...prev,
                            [day]: { ...prev[day]!, end: e.target.value },
                          }))
                        }
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Fechado</span>
                  )}
                </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-serif text-lg text-foreground">
              Dias Bloqueados
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Dias em que o estúdio estará fechado (feriados, férias, etc.)
            </p>

            {blockedDays.length > 0 && (
              <div className="mb-4 space-y-2">
                {blockedDays.map((day, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border bg-slot-blocked-bg px-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">{day.date}</span>
                      <span className="ml-2 text-sm text-muted-foreground">- {day.reason}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveBlockedDay(i)}
                      className="text-sm text-destructive hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
              <div className="sm:w-40">
                <label className="text-xs font-medium text-muted-foreground">Data</label>
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:flex-1">
                <label className="text-xs font-medium text-muted-foreground">Motivo</label>
                <input
                  type="text"
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  placeholder="Ex: Feriado"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <Button size="sm" className="w-full sm:w-auto" onClick={handleAddBlockedDay}>
                Adicionar
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-serif text-lg text-foreground">Geração automática de horários</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              O sistema cria horários sozinho conforme seu funcionamento. Ajuste a duração de cada
              horário e com quantas semanas de antecedência mantê-los.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Duração de cada horário</label>
                <select
                  value={slotInterval}
                  onChange={(e) => setSlotInterval(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>120 min</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Antecedência (semanas)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={weeksAhead}
                  onChange={(e) => setWeeksAhead(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              A duração vale para novos dias criados; dias que já têm horários não são alterados.
            </p>
          </Card>

          <Card>
            <h2 className="mb-4 font-serif text-lg text-foreground">Informações do Estúdio</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome do Estúdio</label>
                <p className="text-sm font-medium text-foreground">{STUDIO_NAME}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
                <p className="text-sm font-medium text-foreground">+{WHATSAPP_NUMBER}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
