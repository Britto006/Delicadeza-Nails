"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/date";
import { generateWhatsAppMessage, generateWhatsAppUrl, isDesktopDevice } from "@/lib/whatsapp";
import type { TimeSlot } from "@/types/database";

interface DaySlotsModalProps {
  open: boolean;
  onClose: () => void;
  date: string | null;
  slots: TimeSlot[];
}

export function DaySlotsModal({ open, onClose, date, slots }: DaySlotsModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [step, setStep] = useState<"list" | "confirm">("list");

  if (!date) return null;

  const availableSlots = slots.filter((s) => s.status === "available");
  const [year, month, day] = date.split("-");
  const formattedDate = `${day}/${month}/${year}`;

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("confirm");
  };

  const handleWhatsApp = () => {
    if (!selectedSlot) return;
    const msg = generateWhatsAppMessage(date, `${selectedSlot.start_time} - ${selectedSlot.end_time}`);
    const url = generateWhatsAppUrl(msg);

    if (isDesktopDevice()) {
      const webUrl = url.replace("wa.me", "web.whatsapp.com/send");
      window.open(webUrl, "_blank");
    } else {
      window.open(url, "_blank");
    }

    onClose();
    setTimeout(() => {
      setSelectedSlot(null);
      setStep("list");
    }, 500);
  };

  const handleClose = () => {
    setSelectedSlot(null);
    setStep("list");
    onClose();
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
                <Badge status="available" />
              </button>
            ))
          )}
        </div>
      )}

      {step === "confirm" && selectedSlot && (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-medium text-foreground">{formattedDate}</p>
            <p className="mt-2 text-sm text-muted-foreground">Horário</p>
            <p className="font-medium text-foreground">
              {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Você será redirecionada para o WhatsApp para confirmar o agendamento.
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep("list")}
            >
              Voltar
            </Button>
            <Button className="flex-1" onClick={handleWhatsApp}>
              Agendar via WhatsApp
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
