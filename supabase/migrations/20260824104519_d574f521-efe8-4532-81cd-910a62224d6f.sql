ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telegram_codigo_vinculo text NOT NULL
  DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_telegram_codigo_vinculo_key
  ON public.usuarios (telegram_codigo_vinculo);