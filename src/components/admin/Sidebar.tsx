"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarCheck, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { STUDIO_NAME } from "@/lib/constants";
import { logoutAction } from "@/lib/actions/auth";

const links = [
  { href: "/admin/horarios", label: "Horários", icon: Calendar },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarCheck },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-60 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-active text-sm font-bold text-white">
          A
        </div>
        <span className="font-serif text-lg">{STUDIO_NAME}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-active/20 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-active/20 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
