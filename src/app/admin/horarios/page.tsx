"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CreateBatchDialog } from "@/components/admin/slots/CreateBatchDialog";
import { toast } from "sonner";
import { listSlotsAction, updateSlotAction, deleteSlotAction, changeSlotStatusAction } from "@/lib/actions/slots";
import { formatDate } from "@/lib/utils/date";
import type { TimeSlot, SlotStatus } from "@/types/database";

export default function HorariosPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]!
  );

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    const firstDay = `${selectedDate.slice(0, 7)}-01`;
    const lastDay = `${selectedDate.slice(0, 7)}-31`;

    const result = await listSlotsAction(firstDay, lastDay);
    if (result.error) {
      setError(result.error);
    } else {
      setSlots(result.data ?? []);
    }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleStatusChange = async (slotId: string, newStatus: SlotStatus) => {
    const result = await changeSlotStatusAction(slotId, newStatus);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Status atualizado");
      loadSlots();
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm("Excluir este horário?")) return;
    const result = await deleteSlotAction(slotId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Horário excluído");
      loadSlots();
    }
  };

  const today = new Date().toISOString().split("T")[0]!;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">
            Gerenciar Horários
          </h1>
          <p className="text-sm text-muted-foreground">
            Crie, edite e gerencie os horários disponíveis
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Criar Horários
        </Button>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground">Mês:</label>
          <input
            type="month"
            value={selectedDate.slice(0, 7)}
            onChange={(e) =>
              setSelectedDate(`${e.target.value}-01`)
            }
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={loadSlots} />
        </Card>
      ) : slots.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhum horário cadastrado"
            description="Use o botão acima para criar horários em lote."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Horário
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr
                    key={slot.id}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {formatDate(new Date(slot.date + "T12:00:00"), "dd/MM")}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {slot.start_time.slice(0, 5)} -{" "}
                      {slot.end_time.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={slot.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {slot.client_name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {slot.status === "available" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(slot.id, "blocked")
                              }
                              className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Bloquear"
                            >
                              Bloquear
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(slot.id, "pending")
                              }
                              className="rounded px-2 py-1 text-xs text-slot-pending transition-colors hover:bg-slot-pending-bg"
                              title="Marcar como pendente"
                            >
                              Pendente
                            </button>
                          </>
                        )}
                        {slot.status === "blocked" && (
                          <button
                            onClick={() =>
                              handleStatusChange(slot.id, "available")
                            }
                            className="rounded px-2 py-1 text-xs text-slot-available transition-colors hover:bg-slot-available-bg"
                            title="Liberar"
                          >
                            Liberar
                          </button>
                        )}
                        {slot.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleStatusChange(slot.id, "booked")
                              }
                              className="rounded px-2 py-1 text-xs text-slot-booked transition-colors hover:bg-slot-booked-bg"
                              title="Confirmar"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(slot.id, "available")
                              }
                              className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                              title="Cancelar"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {slot.status === "booked" && (
                          <button
                            onClick={() =>
                              handleStatusChange(slot.id, "pending")
                            }
                            className="rounded px-2 py-1 text-xs text-slot-pending transition-colors hover:bg-slot-pending-bg"
                            title="Reabrir"
                          >
                            Reabrir
                          </button>
                        )}
                        {slot.status !== "booked" &&
                          slot.date >= today && (
                            <button
                              onClick={() => handleDelete(slot.id)}
                              className="rounded px-2 py-1 text-xs text-destructive transition-colors hover:bg-slot-booked-bg"
                              title="Excluir"
                            >
                              Excluir
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateBatchDialog
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          loadSlots();
        }}
      />
    </div>
  );
}
