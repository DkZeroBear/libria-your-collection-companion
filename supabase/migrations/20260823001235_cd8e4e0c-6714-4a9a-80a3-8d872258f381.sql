-- ============================================================
-- Libria — schema inicial
-- ============================================================

-- Papel de moderador fica em tabela separada (evita auto-promoção)
create type public.app_role as enum ('moderador');

-- ------------------------------------------------------------
-- usuarios (estende auth.users; sem duplicar email/senha)
-- ------------------------------------------------------------
create table public.usuarios (
  id uuid primary key,
  username text not null unique,
  nome_exibicao text not null,
  avatar_url text,
  bio text,
  colecionador_desde date not null default current_date,
  perfil_publico boolean not null default true,
  telegram_chat_id text,
  reputacao integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- ------------------------------------------------------------
-- tipos_midia
-- ------------------------------------------------------------
create table public.tipos_midia (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  nome_exibicao text not null,
  icone text not null default '',
  schema_campos jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- fontes (coleções/editoras, sem dono)
-- ------------------------------------------------------------
create table public.fontes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  capa_url text,
  tipo_midia_id uuid not null references public.tipos_midia(id),
  total_titulos_oficial integer,
  status_curadoria text not null default 'pendente'
    check (status_curadoria in ('pendente','aprovado','rejeitado')),
  criado_por uuid not null references public.usuarios(id),
  created_at timestamptz not null default now()
);

create index idx_fontes_tipo_midia on public.fontes(tipo_midia_id);

-- ------------------------------------------------------------
-- titulos
-- ------------------------------------------------------------
create table public.titulos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  fonte_id uuid references public.fontes(id) on delete set null,
  tipo_midia_id uuid not null references public.tipos_midia(id),
  capa_url text,
  metadados jsonb not null default '{}'::jsonb,
  fonte_validacao text not null default 'manual'
    check (fonte_validacao in ('google_books','open_library','cbl','manual')),
  identificador_externo text,
  status_curadoria text not null default 'pendente'
    check (status_curadoria in ('pendente','aprovado','rejeitado')),
  criado_por uuid not null references public.usuarios(id),
  created_at timestamptz not null default now()
);

create unique index uq_titulos_identificador_tipo
  on public.titulos(identificador_externo, tipo_midia_id)
  where identificador_externo is not null;
create index idx_titulos_fonte on public.titulos(fonte_id);
create index idx_titulos_tipo_midia on public.titulos(tipo_midia_id);

-- ------------------------------------------------------------
-- posse (dimensões independentes)
-- ------------------------------------------------------------
create table public.posse (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  titulo_id uuid not null references public.titulos(id) on delete cascade,
  tenho boolean not null default false,
  lido boolean not null default false,
  quero boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (usuario_id, titulo_id)
);

create index idx_posse_titulo on public.posse(titulo_id);

-- ------------------------------------------------------------
-- emprestimos
-- ------------------------------------------------------------
create table public.emprestimos (
  id uuid primary key default gen_random_uuid(),
  titulo_id uuid not null references public.titulos(id) on delete cascade,
  dono_id uuid not null references public.usuarios(id) on delete cascade,
  pego_por_nome text not null,
  pego_por_usuario_id uuid references public.usuarios(id) on delete set null,
  data_emprestimo date not null default current_date,
  data_devolucao_prevista date,
  devolvido boolean not null default false,
  data_devolucao_real date,
  ultima_cobranca_em timestamptz,
  canal_cobranca text check (canal_cobranca in ('app','telegram','whatsapp')),
  created_at timestamptz not null default now()
);

create index idx_emprestimos_dono on public.emprestimos(dono_id);
create index idx_emprestimos_tomador on public.emprestimos(pego_por_usuario_id);
create index idx_emprestimos_titulo on public.emprestimos(titulo_id);

-- ------------------------------------------------------------
-- sugestoes (fila de curadoria)
-- ------------------------------------------------------------
create table public.sugestoes (
  id uuid primary key default gen_random_uuid(),
  tipo_sugestao text not null check (tipo_sugestao in ('titulo','fonte')),
  payload jsonb not null default '{}'::jsonb,
  sugerido_por uuid not null references public.usuarios(id),
  status text not null default 'pendente'
    check (status in ('pendente','aprovado','rejeitado')),
  revisado_por uuid references public.usuarios(id),
  revisado_em timestamptz,
  created_at timestamptz not null default now()
);

create index idx_sugestoes_sugerido_por on public.sugestoes(sugerido_por);

-- ------------------------------------------------------------
-- denuncias
-- ------------------------------------------------------------
create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  titulo_id uuid references public.titulos(id) on delete cascade,
  fonte_id uuid references public.fontes(id) on delete cascade,
  denunciado_por uuid not null references public.usuarios(id),
  motivo text not null,
  status text not null default 'pendente'
    check (status in ('pendente','resolvido','descartado')),
  created_at timestamptz not null default now()
);

create index idx_denuncias_denunciado_por on public.denuncias(denunciado_por);

-- ============================================================
-- GRANTS (necessários para a Data API do Supabase)
-- ============================================================

-- usuarios: leitura pública; update restrito por coluna (protege reputacao)
grant select on public.usuarios to anon, authenticated;
grant insert on public.usuarios to authenticated;
grant update (username, nome_exibicao, avatar_url, bio, perfil_publico, telegram_chat_id)
  on public.usuarios to authenticated;
grant all on public.usuarios to service_role;

-- user_roles: somente leitura dos próprios papéis; gestão via service_role
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- tipos_midia: leitura pública
grant select on public.tipos_midia to anon, authenticated;
grant all on public.tipos_midia to service_role;

-- fontes e titulos: leitura pública, sem escrita direta
grant select on public.fontes to anon, authenticated;
grant all on public.fontes to service_role;
grant select on public.titulos to anon, authenticated;
grant all on public.titulos to service_role;

-- posse, emprestimos: acesso total ao autenticado (RLS restringe por linha)
grant select, insert, update, delete on public.posse to authenticated;
grant all on public.posse to service_role;
grant select, insert, update, delete on public.emprestimos to authenticated;
grant all on public.emprestimos to service_role;

-- sugestoes e denuncias: inserção por autenticados; revisão por moderadores (via RLS)
grant select, insert, update on public.sugestoes to authenticated;
grant all on public.sugestoes to service_role;
grant select, insert, update on public.denuncias to authenticated;
grant all on public.denuncias to service_role;

-- ============================================================
-- RLS
-- ============================================================

alter table public.usuarios enable row level security;
alter table public.user_roles enable row level security;
alter table public.tipos_midia enable row level security;
alter table public.fontes enable row level security;
alter table public.titulos enable row level security;
alter table public.posse enable row level security;
alter table public.emprestimos enable row level security;
alter table public.sugestoes enable row level security;
alter table public.denuncias enable row level security;

-- usuarios: perfis públicos visíveis a todos; dono vê e edita o próprio
create policy "usuarios_select_publicos"
  on public.usuarios for select
  using (perfil_publico = true or auth.uid() = id);

create policy "usuarios_insert_proprio"
  on public.usuarios for insert to authenticated
  with check (auth.uid() = id);

create policy "usuarios_update_proprio"
  on public.usuarios for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- user_roles: usuário vê apenas os próprios papéis
create policy "user_roles_select_proprio"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

-- tipos_midia: leitura pública dos ativos
create policy "tipos_midia_select_ativos"
  on public.tipos_midia for select
  using (ativo = true);

-- fontes: leitura pública apenas de aprovados; sem escrita direta
create policy "fontes_select_aprovados"
  on public.fontes for select
  using (status_curadoria = 'aprovado');

-- titulos: leitura pública apenas de aprovados; sem escrita direta
create policy "titulos_select_aprovados"
  on public.titulos for select
  using (status_curadoria = 'aprovado');

-- posse: apenas o próprio usuário
create policy "posse_select_propria"
  on public.posse for select to authenticated
  using (auth.uid() = usuario_id);

create policy "posse_insert_propria"
  on public.posse for insert to authenticated
  with check (auth.uid() = usuario_id);

create policy "posse_update_propria"
  on public.posse for update to authenticated
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

create policy "posse_delete_propria"
  on public.posse for delete to authenticated
  using (auth.uid() = usuario_id);

-- emprestimos: dono ou tomador leem; dono cria/exclui; ambos atualizam
create policy "emprestimos_select_partes"
  on public.emprestimos for select to authenticated
  using (auth.uid() = dono_id or auth.uid() = pego_por_usuario_id);

create policy "emprestimos_insert_dono"
  on public.emprestimos for insert to authenticated
  with check (auth.uid() = dono_id);

create policy "emprestimos_update_partes"
  on public.emprestimos for update to authenticated
  using (auth.uid() = dono_id or auth.uid() = pego_por_usuario_id)
  with check (auth.uid() = dono_id or auth.uid() = pego_por_usuario_id);

create policy "emprestimos_delete_dono"
  on public.emprestimos for delete to authenticated
  using (auth.uid() = dono_id);

-- sugestoes: qualquer autenticado sugere; moderadores leem e revisam
create policy "sugestoes_insert_autenticado"
  on public.sugestoes for insert to authenticated
  with check (auth.uid() = sugerido_por);

create policy "sugestoes_select_moderador"
  on public.sugestoes for select to authenticated
  using (public.has_role(auth.uid(), 'moderador'));

create policy "sugestoes_update_moderador"
  on public.sugestoes for update to authenticated
  using (public.has_role(auth.uid(), 'moderador'))
  with check (public.has_role(auth.uid(), 'moderador'));

-- denuncias: qualquer autenticado denuncia; moderadores leem e resolvem
create policy "denuncias_insert_autenticado"
  on public.denuncias for insert to authenticated
  with check (auth.uid() = denunciado_por);

create policy "denuncias_select_moderador"
  on public.denuncias for select to authenticated
  using (public.has_role(auth.uid(), 'moderador'));

create policy "denuncias_update_moderador"
  on public.denuncias for update to authenticated
  using (public.has_role(auth.uid(), 'moderador'))
  with check (public.has_role(auth.uid(), 'moderador'));