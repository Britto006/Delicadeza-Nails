"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { STUDIO_NAME, WHATSAPP_NUMBER } from "@/lib/constants";

export default function ConfiguracoesPage() {
  const [workingHours, setWorkingHours] = useState({
    monday: { open: true, start: "09:00", end: "18:00" },
    tuesday: { open: true, start: "09:00", end: "18:00" },
    wednesday: { open: true, start: "09:00", end: "18:00" },
    thursday: { open: true, start: "09:00", end: "18:00" },
    friday: { open: true, start: "09:00", end: "18:00" },
    saturday: { open: true, start: "09:00", end: "13:00" },
    sunday: { open: false, start: "09:00", end: "13:00" },
  });

  const [blockedDays, setBlockedDays] = useState<
    { date: string; reason: string }[]
  >([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");

  const dayLabels: Record<string, string> = {
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  const handleAddBlockedDay = () => {
    if (!newBlockedDate || !newBlockedReason) return;
    setBlockedDays([
      ...blockedDays,
      { date: newBlockedDate, reason: newBlockedReason },
    ]);
    setNewBlockedDate("");
    setNewBlockedReason("");
  };

  const handleRemoveBlockedDay = (index: number) => {
    setBlockedDays(blockedDays.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Configure o horário de funcionamento e dias bloqueados
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 font-serif text-lg text-foreground">
            Horário de Funcionamento
          </h2>
          <div className="space-y-3">
            {Object.entries(workingHours).map(([day, config]) => (
              <div
                key={day}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.open}
                    onChange={() =>
                      setWorkingHours((prev) => ({
                        ...prev,
                        [day]: {
                          ...prev[day as keyof typeof prev],
                          open: !prev[day as keyof typeof prev].open,
                        },
                      }))
                    }
                    className="accent-primary"
                  />
                  <span className="min-w-20 text-sm font-medium text-foreground">
                    {dayLabels[day]}
                  </span>
                </label>
                {config.open && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={config.start}
                      onChange={(e) =>
                        setWorkingHours((prev) => ({
                          ...prev,
                          [day]: {
                            ...prev[day as keyof typeof prev],
                            start: e.target.value,
                          },
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
                          [day]: {
                            ...prev[day as keyof typeof prev],
                            end: e.target.value,
                          },
                        }))
                      }
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                )}
                {!config.open && (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                )}
              </div>
            ))}
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
                    <span className="text-sm font-medium text-foreground">
                      {day.date}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      - {day.reason}
                    </span>
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

          <div className="flex items-end gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Data
              </label>
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Motivo
              </label>
              <input
                type="text"
                value={newBlockedReason}
                onChange={(e) => setNewBlockedReason(e.target.value)}
                placeholder="Ex: Feriado"
                className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button size="sm" onClick={handleAddBlockedDay}>
              Adicionar
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-serif text-lg text-foreground">
            Informações do Estúdio
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Nome do Estúdio
              </label>
              <p className="text-sm font-medium text-foreground">
                {STUDIO_NAME}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                WhatsApp
              </label>
              <p className="text-sm font-medium text-foreground">
                +{WHATSAPP_NUMBER}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
