DROP POLICY IF EXISTS usuarios_select_publicos ON public.usuarios;

CREATE POLICY usuarios_select_proprio
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

REVOKE SELECT ON public.usuarios FROM anon;

CREATE OR REPLACE VIEW public.usuarios_publico
WITH (security_invoker = off) AS
SELECT id, username, nome_exibicao, avatar_url, bio, colecionador_desde, reputacao
FROM public.usuarios
WHERE perfil_publico = true;

ALTER VIEW public.usuarios_publico OWNER TO postgres;

GRANT SELECT ON public.usuarios_publico TO anon, authenticated;
GRANT ALL ON public.usuarios_publico TO service_role;