"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";

export function HomeError() {
  const router = useRouter();

  return (
    <div className="rounded-2xl bg-card p-6 shadow-medium">
      <ErrorState
        message="Não foi possível carregar os horários. Tente novamente."
        onRetry={() => router.refresh()}
      />
    </div>
  );
}
