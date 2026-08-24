CREATE OR REPLACE VIEW public.usuarios_publico
WITH (security_invoker = on) AS
SELECT id, username, nome_exibicao, avatar_url, bio, colecionador_desde, reputacao
FROM public.usuarios
WHERE perfil_publico = true;

GRANT SELECT (id, username, nome_exibicao, avatar_url, bio, colecionador_desde, reputacao)
ON public.usuarios TO anon, authenticated;

DROP POLICY IF EXISTS usuarios_select_perfis_publicos ON public.usuarios;
CREATE POLICY usuarios_select_perfis_publicos
ON public.usuarios
FOR SELECT
TO anon, authenticated
USING (perfil_publico = true);

GRANT SELECT ON public.usuarios_publico TO anon, authenticated;
GRANT ALL ON public.usuarios_publico TO service_role;