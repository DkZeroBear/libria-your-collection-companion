DROP FUNCTION IF EXISTS public.meu_codigo_telegram();

CREATE TABLE public.usuarios_telegram (
  usuario_id uuid PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  telegram_chat_id text,
  telegram_codigo_vinculo text NOT NULL UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.usuarios_telegram TO authenticated;
GRANT ALL ON public.usuarios_telegram TO service_role;

ALTER TABLE public.usuarios_telegram ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuarios_telegram_select_proprio ON public.usuarios_telegram
FOR SELECT TO authenticated USING (auth.uid() = usuario_id);
CREATE POLICY usuarios_telegram_insert_proprio ON public.usuarios_telegram
FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY usuarios_telegram_update_proprio ON public.usuarios_telegram
FOR UPDATE TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER usuarios_telegram_updated_at
BEFORE UPDATE ON public.usuarios_telegram
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.usuarios_telegram (usuario_id, telegram_chat_id, telegram_codigo_vinculo)
SELECT id, telegram_chat_id, telegram_codigo_vinculo FROM public.usuarios;

ALTER TABLE public.usuarios DROP COLUMN telegram_chat_id;
ALTER TABLE public.usuarios DROP COLUMN telegram_codigo_vinculo;

GRANT SELECT ON public.usuarios TO anon, authenticated;

CREATE OR REPLACE VIEW public.usuarios_publico
WITH (security_invoker = on) AS
SELECT id, username, nome_exibicao, avatar_url, bio, colecionador_desde, reputacao
FROM public.usuarios
WHERE perfil_publico = true;

GRANT SELECT ON public.usuarios_publico TO anon, authenticated;
GRANT ALL ON public.usuarios_publico TO service_role;