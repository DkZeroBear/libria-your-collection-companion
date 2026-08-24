REVOKE SELECT ON public.usuarios FROM authenticated;

GRANT SELECT (id, username, nome_exibicao, avatar_url, bio, colecionador_desde, reputacao, perfil_publico, created_at)
ON public.usuarios TO authenticated;

DROP POLICY IF EXISTS usuarios_select_perfis_publicos ON public.usuarios;
CREATE POLICY usuarios_select_perfis_publicos
ON public.usuarios
FOR SELECT
TO anon, authenticated
USING (perfil_publico = true);

CREATE OR REPLACE FUNCTION public.meu_codigo_telegram()
RETURNS TABLE (telegram_codigo_vinculo text, telegram_chat_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.telegram_codigo_vinculo, u.telegram_chat_id
  FROM public.usuarios u
  WHERE u.id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.meu_codigo_telegram() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.meu_codigo_telegram() TO authenticated;