"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateBatchDialog } from "@/components/admin/slots/CreateBatchDialog";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatDate, todayInTimezone } from "@/lib/utils/date";
import type { TimeSlot, SlotStatus } from "@/types/database";

export default function HorariosPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    `${todayInTimezone().slice(0, 7)}-01`
  );
  const supabase = createClient();

  const [refreshKey, setRefreshKey] = useState(0);
  const loadSlots = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const month = selectedDate.slice(0, 7);
    const [y, m] = month.split("-").map(Number);
    const firstDay = `${month}-01`;
    const lastDayNum = new Date(y!, m!, 0).getDate();
    const lastDay = `${month}-${String(lastDayNum).padStart(2, "0")}`;

    supabase
      .from("time_slots")
      .select("*")
      .gte("date", firstDay)
      .lte("date", lastDay)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setSlots(data ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, selectedDate, refreshKey]);

  const handleStatusChange = async (slotId: string, newStatus: SlotStatus) => {
    const { error } = await supabase
      .from("time_slots")
      .update({ status: newStatus })
      .eq("id", slotId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Status atualizado");
      loadSlots();
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm("Excluir este horário?")) return;
    const { error } = await supabase.from("time_slots").delete().eq("id", slotId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Horário excluído");
      loadSlots();
    }
  };

  const today = todayInTimezone();

  // Botões de ação por status — reutilizados na tabela (desktop) e nos cards (mobile).
  const renderActions = (slot: TimeSlot) => (
    <>
      {slot.status === "available" && (
        <>
          <button onClick={() => handleStatusChange(slot.id, "blocked")} className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Bloquear</button>
          <button onClick={() => handleStatusChange(slot.id, "pending")} className="rounded px-2 py-1 text-xs text-slot-pending transition-colors hover:bg-slot-pending-bg">Pendente</button>
        </>
      )}
      {slot.status === "blocked" && (
        <button onClick={() => handleStatusChange(slot.id, "available")} className="rounded px-2 py-1 text-xs text-slot-available transition-colors hover:bg-slot-available-bg">Liberar</button>
      )}
      {slot.status === "pending" && (
        <>
          <button onClick={() => handleStatusChange(slot.id, "booked")} className="rounded px-2 py-1 text-xs text-slot-booked transition-colors hover:bg-slot-booked-bg">Confirmar</button>
          <button onClick={() => handleStatusChange(slot.id, "available")} className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted">Cancelar</button>
        </>
      )}
      {slot.status === "booked" && (
        <button onClick={() => handleStatusChange(slot.id, "pending")} className="rounded px-2 py-1 text-xs text-slot-pending transition-colors hover:bg-slot-pending-bg">Reabrir</button>
      )}
      {slot.status !== "booked" && slot.date >= today && (
        <button onClick={() => handleDelete(slot.id)} className="rounded px-2 py-1 text-xs text-destructive transition-colors hover:bg-slot-booked-bg">Excluir</button>
      )}
    </>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Gerenciar Horários</h1>
          <p className="text-sm text-muted-foreground">Crie, edite e gerencie os horários disponíveis</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Criar Horários
        </Button>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground">Mês:</label>
          <input
            type="month"
            value={selectedDate.slice(0, 7)}
            onChange={(e) => {
              setLoading(true);
              setSelectedDate(`${e.target.value}-01`);
            }}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </Card>
      ) : slots.length === 0 ? (
        <Card>
          <EmptyState title="Nenhum horário cadastrado" description="Use o botão acima para criar horários em lote." />
        </Card>
      ) : (
        <>
          {/* Desktop: tabela */}
          <Card className="hidden overflow-hidden p-0 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-4 py-3 text-left font-medium text-foreground">Data</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Horário</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Cliente</th>
                    <th className="px-4 py-3 text-right font-medium text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot.id} className="border-b border-border transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 text-foreground">{formatDate(new Date(slot.date + "T12:00:00"), "dd/MM")}</td>
                      <td className="px-4 py-3 text-foreground">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</td>
                      <td className="px-4 py-3"><Badge status={slot.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{slot.client_name ?? "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">{renderActions(slot)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {slots.map((slot) => (
              <Card key={slot.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {formatDate(new Date(slot.date + "T12:00:00"), "dd/MM")} · {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </span>
                  <Badge status={slot.status} />
                </div>
                {slot.client_name && (
                  <p className="mt-1 text-sm text-muted-foreground">Cliente: {slot.client_name}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {renderActions(slot)}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <CreateBatchDialog
        open={showCreate}
        onClose={() => { setShowCreate(false); loadSlots(); }}
      />
    </div>
  );
}
