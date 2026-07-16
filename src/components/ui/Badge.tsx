import { cn } from "@/lib/utils/cn";
import type { SlotStatus } from "@/types/database";

const statusStyles: Record<SlotStatus, string> = {
  available: "bg-slot-available-bg text-slot-available border-slot-available/30",
  pending: "bg-slot-pending-bg text-slot-pending border-slot-pending/30",
  booked: "bg-slot-booked-bg text-slot-booked border-slot-booked/30",
  blocked: "bg-slot-blocked-bg text-slot-blocked border-slot-blocked/30",
};

const statusLabels: Record<SlotStatus, string> = {
  available: "Disponível",
  pending: "Pendente",
  booked: "Reservado",
  blocked: "Bloqueado",
};

interface BadgeProps {
  status: SlotStatus;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          status === "available" && "bg-slot-available",
          status === "pending" && "bg-slot-pending",
          status === "booked" && "bg-slot-booked",
          status === "blocked" && "bg-slot-blocked"
        )}
      />
      {statusLabels[status]}
    </span>
  );
}
