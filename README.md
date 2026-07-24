# Delicadeza Nails — Agendamento

Site de agendamento para estúdio de nails: a cliente escolhe um horário no
calendário, preenche nome e WhatsApp, o horário fica **reservado (pendente)** e a
conversa continua no WhatsApp. A admin confirma ou cancela pelo painel.

**Stack**: Next.js 16 (App Router) · React 19 · Supabase (Postgres/Auth/RLS) ·
Tailwind 4 · deploy Netlify.

## Rodando localmente

```bash
npm ci
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
```

Com Docker instalado, dá para rodar o Supabase local:

```bash
npx supabase@latest start
npx supabase@latest db reset   # aplica todas as migrations + seed
```

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | Chave anônima (pública) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | não (tem fallback) | Número do estúdio, formato `55DDDNÚMERO` |
| `NEXT_PUBLIC_SITE_URL` | não (tem fallback) | URL pública do site (SEO/OpenGraph) |

O app **não usa** `SUPABASE_SERVICE_ROLE_KEY` — a reserva pública é feita pela
função Postgres `book_slot` (SECURITY DEFINER), atômica e sem PII no retorno.

## Modelo de segurança

- `time_slots` guarda nome/contato da cliente, mas o role `anon` só tem GRANT
  nas colunas não sensíveis (`id, date, start_time, end_time, status`) —
  visitantes nunca leem PII.
- Escritas exigem `profiles.role = 'admin'` (função `is_admin()` nas policies).
  Usuário novo do Auth nasce como `viewer`, sem poder algum.
- A única escrita permitida a `anon` é a RPC `book_slot`, que só muda um slot
  `available` futuro para `pending` (elimina agendamento duplo por corrida).
- O Supabase não expõe mais tabelas novas automaticamente à API — os GRANTs
  são explícitos na migration `20260725000005_explicit_table_grants.sql`.

## Checklist de produção (aplicar no projeto Supabase/Netlify)

1. **Aplicar as migrations novas em ordem** (`supabase db push` linkado ao
   projeto, ou colar cada `supabase/migrations/20260725*.sql` no SQL Editor):
   `...000001` (PII) → `...000002` (roles) → `...000003` (config singleton) →
   `...000004` (book_slot) → `...000005` (grants).
2. **Trocar a senha do usuário admin** — a antiga esteve versionada neste
   repositório em texto plano (seed.sql).
3. **Desabilitar signup público**: Dashboard → Authentication → Sign In / Up →
   desmarcar "Allow new users to sign up".
4. Conferir se só a dona tem `role='admin'`:
   `SELECT p.role, u.email FROM profiles p JOIN auth.users u ON u.id = p.id;`
5. Netlify → Environment variables: conferir `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`,
   `NEXT_PUBLIC_SITE_URL`; **remover** `SUPABASE_SERVICE_ROLE_KEY` se existir.

## Estrutura

```
src/
  app/(public)/        calendário público + reserva
  app/(auth)/login/    login do painel
  app/admin/           horários, reservas e configurações
  components/          UI pública, admin e base (Button, Dialog, Input...)
  lib/                 supabase clients, actions, schemas zod, datas (fuso SP)
supabase/migrations/   schema completo + RLS + RPC book_slot
```

## Comandos úteis

```bash
npm run dev        # dev server
npm run build      # build de produção
npm run lint       # eslint
npx tsc --noEmit   # typecheck
```
