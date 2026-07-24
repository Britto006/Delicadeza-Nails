"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Aceita só caminhos internos (evita open redirect via ?redirect=).
  const rawRedirect = searchParams.get("redirect") ?? "";
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/admin";

  const translateError = (message: string): string => {
    const msg = message.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }
    if (msg.includes("email not confirmed")) {
      return "E-mail ainda não confirmado.";
    }
    if (msg.includes("failed to fetch") || msg.includes("network")) {
      return "Erro de conexão. Verifique sua internet e tente novamente.";
    }
    if (msg.includes("too many requests") || msg.includes("rate limit")) {
      return "Muitas tentativas. Aguarde um momento e tente novamente.";
    }
    return "Não foi possível entrar. Tente novamente.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(translateError(error.message));
      setPending(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="rounded-2xl bg-card p-8 shadow-medium">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-primary">Delicadeza Nails</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesso administrativo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Sua senha"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-slot-booked-bg px-3 py-2 text-sm text-slot-booked">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

// useSearchParams exige Suspense boundary em página prerenderizada (Next 16).
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
