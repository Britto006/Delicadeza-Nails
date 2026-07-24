"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, CalendarX, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/date";

interface Booking {
  slot_date: string;
  slot_start: string;
  slot_end: string;
  slot_status: string;
  client_name: string | null;
}

export function ManageBooking({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [working, setWorking] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .rpc("get_booking_by_token", { p_token: token })
      .then(({ data }) => {
        setBooking((data?.[0] as Booking) ?? null);
        setLoading(false);
      });
  }, [token]);

  const cancel = async (reschedule: boolean) => {
    if (!reschedule && !confirm("Tem certeza que quer cancelar sua reserva?")) return;
    setWorking(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("cancel_booking_by_token", { p_token: token });
    setWorking(false);
    if (error) {
      toast.error("Não foi possível concluir. Tente novamente.");
      return;
    }
    if (reschedule) {
      router.push("/");
      return;
    }
    setCancelled(true);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl bg-card p-6 shadow-medium">
        {loading ? (
          <div className="space-y-3">
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : cancelled ? (
          <div className="space-y-4 text-center">
            <CalendarX className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">Reserva cancelada</p>
            <p className="text-sm text-muted-foreground">
              O horário foi liberado. Quando quiser, é só agendar de novo.
            </p>
            <Button className="w-full" onClick={() => router.push("/")}>
              Agendar outro horário
            </Button>
          </div>
        ) : !booking ? (
          <div className="space-y-4 text-center">
            <CalendarX className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">Reserva não encontrada</p>
            <p className="text-sm text-muted-foreground">
              Este link pode ter expirado ou a reserva já foi cancelada.
            </p>
            <Button className="w-full" onClick={() => router.push("/")}>
              Agendar um horário
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-10 w-10 text-slot-available" />
              <p className="text-lg font-medium text-foreground">Sua reserva</p>
              {booking.client_name && (
                <p className="text-sm text-muted-foreground">{booking.client_name}</p>
              )}
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium text-foreground">
                {formatDate(new Date(booking.slot_date + "T12:00:00"), "dd 'de' MMMM 'de' yyyy")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Horário</p>
              <p className="font-medium text-foreground">
                {booking.slot_start.slice(0, 5)} - {booking.slot_end.slice(0, 5)}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              loading={working}
              onClick={() => cancel(true)}
            >
              <CalendarClock className="h-4 w-4" /> Remarcar (escolher outro horário)
            </Button>
            <Button
              variant="danger"
              className="w-full"
              loading={working}
              onClick={() => cancel(false)}
            >
              Cancelar reserva
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
