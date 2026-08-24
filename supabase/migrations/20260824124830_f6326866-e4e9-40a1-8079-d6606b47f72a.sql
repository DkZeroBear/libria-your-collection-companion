REVOKE SELECT ON public.usuarios FROM anon, authenticated;

GRANT SELECT (id, username, nome_exibicao, avatar_url, bio, colecionador_desde, reputacao, perfil_publico, created_at) ON public.usuarios TO anon, authenticated;