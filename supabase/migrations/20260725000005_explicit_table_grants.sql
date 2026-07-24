-- O Supabase deixou de expor automaticamente tabelas novas do schema public
-- aos roles da Data API (anon/authenticated) — agora é preciso GRANT explícito
-- (ver comentário auto_expose_new_tables no config.toml). Sem estes grants,
-- toda query do app falha com "permission denied", mesmo com RLS correta.
-- Princípio do menor privilégio: cada role recebe só o que o app usa.

-- time_slots: anon já tem SELECT em colunas não sensíveis (migration
-- 20260725000001); admin (authenticated + RLS is_admin) gerencia tudo.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_slots TO authenticated;

-- appointments: apenas admin (authenticated + RLS is_admin).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

-- profiles: usuário lê/edita o próprio perfil (RLS restringe à própria linha).
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- studio_config: leitura pública (calendário consome blocked_days);
-- escrita apenas admin via RLS.
GRANT SELECT ON public.studio_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_config TO authenticated;
