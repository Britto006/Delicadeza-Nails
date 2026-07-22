import type { TimeSlot } from "@/types/database";

export function generateDemoSlots(
  dateFrom: string,
  dateTo: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  const times = ["09:00", "10:30", "13:00", "15:00", "17:00"];
  const statuses: ("available" | "pending" | "booked" | "blocked")[] = [
    "available",
    "available",
    "booked",
    "available",
    "pending",
  ];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;

    times.forEach((t, i) => {
      const [h, min] = t.split(":").map(Number);
      const endH = (h! + 1).toString().padStart(2, "0");
      slots.push({
        id: `${dateStr}-${i}`,
        date: dateStr,
        start_time: `${t}:00`,
        end_time: `${endH}:${min!.toString().padStart(2, "0")}:00`,
        status: statuses[i % statuses.length]!,
        client_name:
          statuses[i % statuses.length] === "booked" ? "Maria Silva" : null,
        client_contact:
          statuses[i % statuses.length] === "pending"
            ? "(31) 99999-0001"
            : null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  return slots;
}

export function generateDemoSlotsGrouped(
  dateFrom: string,
  dateTo: string
): Record<string, TimeSlot[]> {
  const slots = generateDemoSlots(dateFrom, dateTo);
  const grouped: Record<string, TimeSlot[]> = {};
  for (const slot of slots) {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date]!.push(slot);
  }
  return grouped;
}
