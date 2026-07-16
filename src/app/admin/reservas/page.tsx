"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { createClient } from "@/lib/supabase/client";
import { confirmAppointmentAction, cancelAppointmentAction, createAppointmentAction } from "@/lib/actions/appointments";
import { changeSlotStatusAction, listSlotsAction } from "@/lib/actions/slots";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { CalendarCheck, X } from "lucide-react";
import type { TimeSlot } from "@/types/database";

export default function ReservasPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "booked" | "all">("pending");
  const [showForm, setShowForm] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().split("T")[0]!;
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const endDate = futureDate.toISOString().split("T")[0]!;

    const result = await listSlotsAction(today, endDate);
    if (result.error) {
      setError(result.error);
    } else {
      const filtered = (result.data ?? []).filter(
        (s) => s.status === "pending" || s.status === "booked"
      );
      setSlots(filtered);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleConfirm = async (slotId: string) => {
    if (showForm === slotId) {
      if (!clientName || !clientContact) {
        toast.error("Preencha nome e contato da cliente");
        return;
      }

      const formData = new FormData();
      formData.set("client_name", clientName);
      formData.set("client_contact", clientContact);

      const result = await createAppointmentAction(slotId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Reserva confirmada!");
      }
      setShowForm(null);
      setClientName("");
      setClientContact("");
      loadSlots();
    } else {
      setShowForm(slotId);
    }
  };

  const handleCancel = async (slotId: string) => {
    if (!confirm("Cancelar esta reserva?")) return;
    const result = await changeSlotStatusAction(slotId, "available");
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Reserva cancelada");
      loadSlots();
    }
  };

  const filteredSlots = slots.filter((s) => {
    if (filter === "pending") return s.status === "pending";
    if (filter === "booked") return s.status === "booked";
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground">Reservas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as solicitações de reserva
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        {(["pending", "booked", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "pending"
              ? "Pendentes"
              : f === "booked"
              ? "Confirmadas"
              : "Todas"}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={loadSlots} />
        </Card>
      ) : filteredSlots.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarCheck className="h-8 w-8" />}
            title="Nenhuma reserva"
            description={
              filter === "pending"
                ? "Nenhuma solicitação pendente."
                : "Nenhuma reserva encontrada."
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSlots.map((slot) => (
            <Card key={slot.id}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {formatDate(
                      new Date(slot.date + "T12:00:00"),
                      "dd 'de' MMMM"
                    )}
                    {" - "}
                    {slot.start_time.slice(0, 5)} às{" "}
                    {slot.end_time.slice(0, 5)}
                  </p>
                  <Badge status={slot.status} />
                  {slot.client_name && (
                    <p className="text-sm text-muted-foreground">
                      Cliente: {slot.client_name}
                      {slot.client_contact && ` - ${slot.client_contact}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {slot.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(slot.id)}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(slot.id)}
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  {slot.status === "booked" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(slot.id)}
                    >
                      Cancelar reserva
                    </Button>
                  )}
                </div>
              </div>

              {showForm === slot.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Nome da cliente
                      </label>
                      <input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Contato
                      </label>
                      <input
                        value={clientContact}
                        onChange={(e) => setClientContact(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        placeholder="(31) 9xxxx-xxxx"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(slot.id)}
                    >
                      Salvar e Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowForm(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
