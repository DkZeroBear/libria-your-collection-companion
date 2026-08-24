# Libria: Your Collection Companion

Quero criar o Libria, um app PWA mobile-first de controle de coleção colecionável (livros, jogos e outras mídias), com posse (tenho/não tenho), leitura (lido/não lido), empréstimos entre usuários e camada social (ranking de completude por coleção, contadores de "têm/querem" por título).

Este projeto vai usar um projeto Supabase próprio, não o backend integrado do Lovable Cloud — não crie nem ative o Lovable Cloud. Vou conectar meu Supabase manualmente logo em seguida.

Por enquanto, crie apenas a estrutura inicial do projeto em React + Tailwind + shadcn/ui, com uma tela simples de boas-vindas ("Libria — em construção"). Não crie tabelas, autenticação nem lógica de dados ainda — isso vai vir depois, em prompts separados, assim que eu conectar o Supabase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4cb34bfd-3268-41f4-9c57-df12fdf6d9b5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Environment variables

Copy `.env.example` to `.env` and fill in your Supabase project values. The
keys present in `.env` are all **public/anon** values (safe to commit). The
client-side keys are prefixed with `VITE_`.

The following are **server-side secrets** and must NEVER be placed in the
committed `.env` file. Configure them through **Lovable → Project Settings →
Secrets** (or the Supabase dashboard, where applicable); they are injected
into the server runtime and never exposed to the browser:

| Secret | Purpose |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses Row-Level Security; privileged database access (server functions only). |
| `TELEGRAM_API_KEY` | Bot token for the Telegram connector (sending charge reminders, verifying webhook). |
| `LOVABLE_API_KEY` | Authenticates calls to the Lovable connector gateway. |
