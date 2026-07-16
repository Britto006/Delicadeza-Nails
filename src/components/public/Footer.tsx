import { STUDIO_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <p className="font-serif text-lg text-primary">{STUDIO_NAME}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Agende seu horário de forma fácil e rápida
        </p>
      </div>
    </footer>
  );
}
