import { TESTIMONIALS } from "@/lib/constants";

// Depoimentos REAIS (array em src/lib/constants/studio.ts). Enquanto estiver
// vazio, nada é renderizado — nunca exibimos avaliações inventadas.
export function SocialProof() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl bg-card p-6 shadow-soft">
      <h2 className="mb-4 text-center font-serif text-lg text-primary">
        O que dizem as clientes
      </h2>
      <div className="space-y-3">
        {TESTIMONIALS.map((t, i) => (
          <figure key={i} className="rounded-lg bg-muted p-4">
            <blockquote className="text-sm text-foreground">“{t.text}”</blockquote>
            <figcaption className="mt-2 text-xs font-medium text-muted-foreground">
              — {t.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
