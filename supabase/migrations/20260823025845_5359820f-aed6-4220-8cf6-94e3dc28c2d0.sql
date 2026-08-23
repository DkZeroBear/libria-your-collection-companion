CREATE TABLE IF NOT EXISTS public.feedback_produto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('bug', 'sugestao', 'ideia')),
  titulo text NOT NULL,
  descricao text NOT NULL,
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_analise', 'resolvido', 'arquivado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.feedback_produto TO authenticated;
GRANT SELECT, UPDATE ON public.feedback_produto TO authenticated;
GRANT ALL ON public.feedback_produto TO service_role;

ALTER TABLE public.feedback_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_produto_insert_autenticado"
  ON public.feedback_produto
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "feedback_produto_select_moderador"
  ON public.feedback_produto
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'moderador'::app_role));

CREATE POLICY "feedback_produto_update_moderador"
  ON public.feedback_produto
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'moderador'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'moderador'::app_role));

CREATE INDEX IF NOT EXISTS feedback_produto_created_at_idx
  ON public.feedback_produto (created_at DESC);