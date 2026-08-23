insert into public.tipos_midia (nome, nome_exibicao, icone, schema_campos) values
('livro', 'Livro', 'book', '[{"chave":"isbn","label":"ISBN","tipo":"text"},{"chave":"editora","label":"Editora","tipo":"text"},{"chave":"autor","label":"Autor","tipo":"text"},{"chave":"ano","label":"Ano","tipo":"number"}]'::jsonb),
('jogo', 'Jogo', 'game-controller', '[{"chave":"plataforma","label":"Plataforma","tipo":"text"},{"chave":"desenvolvedora","label":"Desenvolvedora","tipo":"text"},{"chave":"ano","label":"Ano","tipo":"number"}]'::jsonb);

insert into public.fontes (nome, descricao, tipo_midia_id, total_titulos_oficial, status_curadoria, criado_por) values
('MBC — Educação Católica', 'Coleção de livros da MBC sobre educação católica.', (select id from public.tipos_midia where nome = 'livro'), null, 'aprovado', 'f40824f9-4164-4f1f-ab92-e250da2e805e'),
('Combo Literatura MBC', 'Combo de literatura da MBC.', (select id from public.tipos_midia where nome = 'livro'), null, 'aprovado', 'f40824f9-4164-4f1f-ab92-e250da2e805e');

insert into public.titulos (titulo, fonte_id, tipo_midia_id, metadados, fonte_validacao, status_curadoria, criado_por) values
('Introdução à Fé Católica', (select id from public.fontes where nome = 'MBC — Educação Católica'), (select id from public.tipos_midia where nome = 'livro'), '{"autor":"Autor Exemplo A","editora":"MBC","ano":2018}'::jsonb, 'manual', 'aprovado', 'f40824f9-4164-4f1f-ab92-e250da2e805e'),
('Catequese para Jovens', (select id from public.fontes where nome = 'MBC — Educação Católica'), (select id from public.tipos_midia where nome = 'livro'), '{"autor":"Autor Exemplo B","editora":"MBC","ano":2020}'::jsonb, 'manual', 'aprovado', 'f40824f9-4164-4f1f-ab92-e250da2e805e'),
('História da Igreja I', (select id from public.fontes where nome = 'MBC — Educação Católica'), (select id from public.tipos_midia where nome = 'livro'), '{"autor":"Autor Exemplo C","editora":"MBC","ano":2016}'::jsonb, 'manual', 'aprovado', 'f40824f9-4164-4f1f-ab92-e250da2e805e'),
('O Pequeno Príncipe', (select id from public.fontes where nome = 'Combo Literatura MBC'), (select id from public.tipos_midia where nome = 'livro'), '{"autor":"Antoine de Saint-Exupéry","editora":"MBC","ano":2015}'::jsonb, 'manual', 'aprovado', 'f40824f9-4164-4f1f-ab92-e250da2e805e'),
('Dom Casmurro', (select id from public.fontes where nome = 'Combo Literatura MBC'), (select id from public.tipos_midia where nome = 'livro'), '{"autor":"Machado de Assis","editora":"MBC","ano":2014}'::jsonb, 'manual', 'aprovado', 'f40824f9-4164-4f1f-ab92-e250da2e805e'),
('Memórias Póstumas de Brás Cubas', (select id from public.fontes where nome = 'Combo Literatura MBC'), (select id from public.tipos_midia where nome = 'livro'), '{"autor":"Machado de Assis","editora":"MBC","ano":2017}'::jsonb, 'manual', 'aprovado', 'f40824f9-4164-4f1f-ab92-e250da2e805e'),
('A Moreninha', (select id from public.fontes where nome = 'Combo Literatura MBC'), (select id from public.tipos_midia where nome = 'livro'), '{"autor":"Joaquim Manuel de Macedo","editora":"MBC","ano":2019}'::jsonb, 'manual', 'aprovado', 'f40824f9-4164-4f1f-ab92-e250da2e805e');

insert into public.posse (usuario_id, titulo_id, tenho, lido, quero) values
('f40824f9-4164-4f1f-ab92-e250da2e805e', (select id from public.titulos where titulo = 'Introdução à Fé Católica'), true, true, false),
('f40824f9-4164-4f1f-ab92-e250da2e805e', (select id from public.titulos where titulo = 'Dom Casmurro'), true, false, false),
('f40824f9-4164-4f1f-ab92-e250da2e805e', (select id from public.titulos where titulo = 'A Moreninha'), false, false, true);