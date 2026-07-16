"use client";

"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { demoLoginAction } from "./actions";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="rounded-2xl bg-card p-8 shadow-medium">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-primary">Agenda Beleza</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso administrativo
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Sua senha"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-slot-booked-bg px-3 py-2 text-sm text-slot-booked">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <form action={demoLoginAction}>
        <Button type="submit" variant="secondary" className="w-full">
          Entrar em modo demonstração
        </Button>
      </form>
    </div>
  );
}
