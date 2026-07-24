"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/admin/horarios", label: "Horários", icon: Calendar },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarCheck },
  { href: "/admin/configuracoes", label: "Config", icon: Settings },
];

// Barra de navegação inferior — só no mobile (a sidebar fica oculta em telas < md).
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
