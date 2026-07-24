"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, CheckCircle2, CalendarPlus, Download, Link2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { bookSlotSchema } from "@/lib/schemas/appointment";
import { generateWhatsAppMessage, generateWhatsAppUrl } from "@/lib/whatsapp";
import { buildGoogleCalendarUrl, buildIcsDataUri } from "@/lib/calendar";
import { SITE_URL } from "@/lib/constants";
import type { PublicTimeSlot } from "@/types/database";

interface DaySlotsModalProps {
  open: boolean;
  onClose: () => void;
  date: string | null;
  slots: PublicTimeSlot[];
  onBooked: () => void;
}

export function DaySlotsModal({ open, onClose, date, slots, onBooked }: DaySlotsModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<PublicTimeSlot | null>(null);
  const [step, setStep] = useState<"list" | "form" | "done">("list");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; contact?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");
  const [manageUrl, setManageUrl] = useState<string>("");

  if (!date) return null;

  const availableSlots = slots.filter((s) => s.status === "available");
  const [year, month, day] = date.split("-");
  const formattedDate = `${day}/${month}/${year}`;

  const handleSlotClick = (slot: PublicTimeSlot) => {
    setSelectedSlot(slot);
    setStep("form");
  };

  const resetForm = () => {
    setSelectedSlot(null);
    setStep("list");
    setClientName("");
    setClientContact("");
    setFieldErrors({});
    setWhatsappUrl("");
    setManageUrl("");
  };

  const copyManageLink = async () => {
    try {
      await navigator.clipboard.writeText(manageUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.");
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBook = async () => {
    if (!selectedSlot || submitting) return;

    const parsed = bookSlotSchema.safeParse({
      client_name: clientName,
      client_contact: clientContact,
    });

    if (!parsed.success) {
      const errors: { name?: string; contact?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "client_name") errors.name = issue.message;
        if (issue.path[0] === "client_contact") errors.contact = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("book_slot", {
      p_slot_id: selectedSlot.id,
      p_client_name: parsed.data.client_name,
      p_client_contact: parsed.data.client_contact,
    });

    setSubmitting(false);

    if (error) {
      if (error.message.includes("SLOT_UNAVAILABLE")) {
        toast.error("Esse horário acabou de ser reservado. Escolha outro.");
      } else if (error.message.includes("DAY_BLOCKED")) {
        toast.error("Esta data não está mais disponível. Escolha outra.");
      } else {
        toast.error("Não foi possível reservar. Tente novamente.");
      }
      onBooked();
      handleClose();
      return;
    }

    // Prepara o link do WhatsApp e mostra a tela de confirmação. Não abrimos a
    // aba automaticamente: window.open() é bloqueado no navegador interno do
    // Instagram. Um <a> que a cliente toca é um gesto do usuário e sempre abre.
    const token = (data as { slot_token?: string }[] | null)?.[0]?.slot_token;
    setManageUrl(token ? `${SITE_URL}/reserva/${token}` : "");

    const msg = generateWhatsAppMessage(
      date,
      `${selectedSlot.start_time.slice(0, 5)} - ${selectedSlot.end_time.slice(0, 5)}`,
      parsed.data.client_name
    );
    setWhatsappUrl(generateWhatsAppUrl(msg));
    setStep("done");
    // Atualiza o calendário ao fundo: o horário some da lista de disponíveis.
    onBooked();
  };

  return (
    <Dialog open={open} onClose={handleClose} title={formattedDate}>
      {step === "list" && (
        <div className="space-y-2">
          {availableSlots.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum horário disponível nesta data.
            </p>
          ) : (
            availableSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                className="flex w-full items-center justify-between rounded-lg border border-slot-available/30 bg-slot-available-bg px-4 py-3 text-left transition-all hover:shadow-soft"
              >
                <span className="font-medium text-foreground">
                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {step === "form" && selectedSlot && (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-medium text-foreground">{formattedDate}</p>
            <p className="mt-2 text-sm text-muted-foreground">Horário</p>
            <p className="font-medium text-foreground">
              {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}
            </p>
          </div>

          <Input
            id="client-name"
            label="Seu nome"
            placeholder="Ex: Maria Silva"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            error={fieldErrors.name}
            maxLength={100}
          />
          <Input
            id="client-contact"
            label="Seu WhatsApp"
            type="tel"
            inputMode="numeric"
            placeholder="Ex: 31999998888"
            value={clientContact}
            onChange={(e) => setClientContact(e.target.value)}
            error={fieldErrors.contact}
            maxLength={20}
          />

          <p className="text-sm text-muted-foreground">
            O horário fica reservado para você e a confirmação é feita pelo WhatsApp.
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep("list")}
              disabled={submitting}
            >
              Voltar
            </Button>
            <Button className="flex-1" onClick={handleBook} loading={submitting}>
              Reservar horário
            </Button>
          </div>
        </div>
      )}

      {step === "done" && selectedSlot && (
        <div className="space-y-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-12 w-12 text-slot-available" />
            <p className="text-lg font-medium text-foreground">Horário reservado!</p>
          </div>

          <div className="rounded-lg bg-muted p-4 text-left">
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-medium text-foreground">{formattedDate}</p>
            <p className="mt-2 text-sm text-muted-foreground">Horário</p>
            <p className="font-medium text-foreground">
              {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Falta só <span className="font-medium text-foreground">confirmar pelo WhatsApp</span>.
            Toque no botão abaixo para enviar sua mensagem.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-medium text-white shadow-soft transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <MessageCircle className="h-5 w-5" />
            Confirmar no WhatsApp
          </a>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Quer um lembrete? Salve na sua agenda:</p>
            <div className="flex gap-2">
              <a
                href={buildGoogleCalendarUrl({
                  date,
                  startTime: selectedSlot.start_time,
                  endTime: selectedSlot.end_time,
                  manageUrl: manageUrl || undefined,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <CalendarPlus className="h-4 w-4" />
                Google Agenda
              </a>
              <a
                href={buildIcsDataUri({
                  date,
                  startTime: selectedSlot.start_time,
                  endTime: selectedSlot.end_time,
                  manageUrl: manageUrl || undefined,
                })}
                download="lembrete-delicadeza-nails.ics"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                iPhone / .ics
              </a>
            </div>
          </div>

          {manageUrl && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3 text-left">
              <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Link2 className="h-3.5 w-3.5" /> Precisa cancelar ou remarcar?
              </p>
              <p className="break-all text-xs text-muted-foreground">{manageUrl}</p>
              <button
                onClick={copyManageLink}
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                Copiar link
              </button>
            </div>
          )}

          <button
            onClick={handleClose}
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Fechar
          </button>
        </div>
      )}
    </Dialog>
  );
}
