import Link from "next/link";
import { STUDIO_NAME, WHATSAPP_NUMBER } from "@/lib/constants";

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="font-serif text-xl text-primary">
          {STUDIO_NAME}
        </Link>
        <nav className="flex items-center gap-4">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            WhatsApp
          </a>
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
