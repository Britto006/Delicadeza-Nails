import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

interface AdminHeaderProps {
  userName: string;
}

export function AdminHeader({ userName }: AdminHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Olá,</span>
        <span className="text-sm font-medium text-foreground">{userName}</span>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </form>
    </header>
  );
}
