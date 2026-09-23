# Athos Indique e Ganhe — Neon + Netlify

## Arquitetura

- Next.js
- Neon PostgreSQL
- Netlify
- GitHub como fonte do projeto
- Sessão própria via cookie HTTP-only

## Variáveis obrigatórias

Configure localmente em `.env.local` e no Netlify em **Site configuration → Environment variables**:

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=uma-chave-longa-e-aleatoria-com-24-ou-mais-caracteres
ADMIN_SETUP_KEY=uma-chave-secreta-para-o-primeiro-administrador
```

Nunca envie esses valores reais para o GitHub.

## Inicializar o banco

Depois de configurar `DATABASE_URL`:

```bash
pnpm install
pnpm db:migrate
```

O comando aplica `migrations/0001_neon_postgres.sql` e cria:

- `people`
- `leads`
- `settings`
- `events`

## Primeiro administrador

1. Abra `/?mode=setup`.
2. Preencha os dados do administrador.
3. Informe o mesmo valor configurado em `ADMIN_SETUP_KEY`.
4. Depois do primeiro administrador criado, novas contas entram apenas por link de convite.

## Netlify

Conecte o repositório `Shin11k/Athosindique`.

O arquivo `netlify.toml` já define:

- Node 22
- pnpm 11.25.0
- build com `pnpm build`

Depois adicione as três variáveis de ambiente e publique.

## Teste rápido

Com o deploy no ar, abra:

```
/api/health
```

Quando o Neon estiver acessível, a resposta deve conter `"ok": true`.
