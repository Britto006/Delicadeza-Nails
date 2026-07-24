"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { formatDate, todayInTimezone, parseDateString, toLocalDateString } from "@/lib/utils/date";
import {
  generateWhatsAppUrl,
  generateConfirmationMessage,
  generateReminderMessage,
} from "@/lib/whatsapp";
import { toast } from "sonner";
import { CalendarCheck, X, MessageCircle } from "lucide-react";
import type { TimeSlot } from "@/types/database";

type ReservasFilter = "pending" | "booked" | "tomorrow" | "all";

export default function ReservasPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReservasFilter>("pending");
  const [showForm, setShowForm] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const supabase = createClient();

  const [refreshKey, setRefreshKey] = useState(0);
  const loadSlots = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    const today = todayInTimezone();

    let query = supabase
      .from("time_slots")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (filter === "tomorrow") {
      // Reservas de amanhã (pendentes + confirmadas): a rotina de lembrete.
      const t = parseDateString(today);
      t.setDate(t.getDate() + 1);
      query = query.eq("date", toLocalDateString(t)).in("status", ["pending", "booked"]);
    } else {
      query = query.gte("date", today);
      if (filter !== "all") {
        query = query.eq("status", filter);
      }
    }

    query.then(({ data }) => {
      if (cancelled) return;
      setSlots(data ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [supabase, filter, refreshKey]);

  const handleConfirm = async (slot: TimeSlot) => {
    // Reserva feita pelo site já vem com nome/contato: confirma direto.
    // Sem dados (slot marcado manualmente), abre o formulário.
    if (showForm !== slot.id && (!slot.client_name || !slot.client_contact)) {
      setClientName(slot.client_name ?? "");
      setClientContact(slot.client_contact ?? "");
      setShowForm(slot.id);
      return;
    }

    const name = showForm === slot.id ? clientName : slot.client_name;
    const contact = showForm === slot.id ? clientContact : slot.client_contact;

    if (!name || !contact) {
      toast.error("Preencha nome e contato da cliente");
      return;
    }

    const { error } = await supabase
      .from("time_slots")
      .update({ status: "booked", client_name: name, client_contact: contact })
      .eq("id", slot.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Reserva confirmada!");
      setShowForm(null);
      setClientName("");
      setClientContact("");
      loadSlots();
    }
  };

  // Link de WhatsApp já apontando para a CLIENTE, com a mensagem pronta.
  // Pendente → confirmação; confirmada/amanhã → lembrete.
  const waLink = (slot: TimeSlot) => {
    const time = `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`;
    const msg =
      slot.status === "pending"
        ? generateConfirmationMessage(slot.date, time, slot.client_name ?? undefined)
        : generateReminderMessage(slot.date, time, slot.client_name ?? undefined);
    return generateWhatsAppUrl(msg, slot.client_contact ?? undefined);
  };

  const handleCancel = async (slotId: string) => {
    if (!confirm("Cancelar esta reserva?")) return;
    const { error } = await supabase
      .from("time_slots")
      .update({ status: "available", client_name: null, client_contact: null })
      .eq("id", slotId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Reserva cancelada");
      loadSlots();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground">Reservas</h1>
        <p className="text-sm text-muted-foreground">Gerencie as solicitações de reserva</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["pending", "booked", "tomorrow", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setLoading(true);
              setFilter(f);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-primary text-white" : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "pending" ? "Pendentes" : f === "booked" ? "Confirmadas" : f === "tomorrow" ? "Amanhã" : "Todas"}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </Card>
      ) : slots.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarCheck className="h-8 w-8" />}
            title="Nenhuma reserva"
            description={filter === "pending" ? "Nenhuma solicitação pendente." : "Nenhuma reserva encontrada."}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <Card key={slot.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {formatDate(new Date(slot.date + "T12:00:00"), "dd 'de' MMMM")} - {slot.start_time.slice(0, 5)} às {slot.end_time.slice(0, 5)}
                  </p>
                  <Badge status={slot.status} />
                  {slot.client_name && (
                    <p className="text-sm text-muted-foreground">
                      Cliente: {slot.client_name}{slot.client_contact && ` - ${slot.client_contact}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {slot.client_contact && (
                    <a
                      href={waLink(slot)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:flex-none"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {slot.status === "pending" ? "Confirmar no Zap" : "Lembrar no Zap"}
                    </a>
                  )}
                  {slot.status === "pending" && (
                    <>
                      <Button size="sm" className="flex-1 sm:flex-none" onClick={() => handleConfirm(slot)}>Confirmar</Button>
                      <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => handleCancel(slot.id)}>
                        <X className="h-3 w-3" /> Cancelar
                      </Button>
                    </>
                  )}
                  {slot.status === "booked" && (
                    <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => handleCancel(slot.id)}>Cancelar reserva</Button>
                  )}
                </div>
              </div>

              {showForm === slot.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Nome da cliente</label>
                      <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Nome" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Contato</label>
                      <input value={clientContact} onChange={(e) => setClientContact(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="(31) 9xxxx-xxxx" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleConfirm(slot)}>Salvar e Confirmar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowForm(null)}>Cancelar</Button>
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
