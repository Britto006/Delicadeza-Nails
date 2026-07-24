"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { bookSlotSchema } from "@/lib/schemas/appointment";
import { generateWhatsAppMessage, generateWhatsAppUrl } from "@/lib/whatsapp";
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
  const [step, setStep] = useState<"list" | "form">("list");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; contact?: string }>({});
  const [submitting, setSubmitting] = useState(false);

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

    // Abre a janela antes do await para não ser barrada pelo popup blocker.
    const whatsappWindow = window.open("", "_blank");

    const supabase = createClient();
    const { error } = await supabase.rpc("book_slot", {
      p_slot_id: selectedSlot.id,
      p_client_name: parsed.data.client_name,
      p_client_contact: parsed.data.client_contact,
    });

    if (error) {
      whatsappWindow?.close();
      setSubmitting(false);
      if (error.message.includes("SLOT_UNAVAILABLE")) {
        toast.error("Esse horário acabou de ser reservado. Escolha outro.");
      } else {
        toast.error("Não foi possível reservar. Tente novamente.");
      }
      onBooked();
      handleClose();
      return;
    }

    const msg = generateWhatsAppMessage(
      date,
      `${selectedSlot.start_time.slice(0, 5)} - ${selectedSlot.end_time.slice(0, 5)}`,
      parsed.data.client_name
    );
    const url = generateWhatsAppUrl(msg);

    if (whatsappWindow) {
      whatsappWindow.location.href = url;
    } else {
      window.location.href = url;
    }

    toast.success("Horário reservado! Confirme pelo WhatsApp.");
    setSubmitting(false);
    onBooked();
    handleClose();
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
    </Dialog>
  );
}
