-- E-mail que recebe as notificações de nova reserva. Editável no painel
-- (Configurações). DEVE ser igual ao e-mail da conta Resend enquanto não houver
-- domínio verificado (o Resend só entrega ao próprio e-mail da conta nesse caso).

ALTER TABLE public.studio_config
  ADD COLUMN IF NOT EXISTS admin_email text NOT NULL
    DEFAULT 'carolinebizarri1@gmail.com';

NOTIFY pgrst, 'reload schema';
