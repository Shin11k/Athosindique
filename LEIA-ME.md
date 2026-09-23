# Escola Athos — Indique e ganhe

Sistema de indicação de pais/responsáveis, com desconto de 50% na próxima mensalidade de quem indica.

## Regra atual

- Cada indicação pertence ao CPF do novo pai/responsável. A mesma pessoa não gera nova indicação ao cadastrar outro filho.
- A escola confirma a matrícula do indicado e informa a mensalidade DE QUEM INDICOU e o mês da próxima cobrança.
- O desconto é 50% dessa base. Exemplo: quem indica paga R$ 580; ganha R$ 290 de desconto e a mensalidade beneficiada fica em R$ 290.
- A escola aplica o abatimento na cobrança e registra “Desconto aplicado” no painel. O sistema não envia pagamentos nem altera boletos automaticamente.
- Várias indicações são benefícios separados. Não existe cálculo automático de acúmulo em um boleto; a regra de acumulação deve ser definida pela escola antes de aplicá-los juntos.
- Registros anteriores à regra de desconto não são convertidos silenciosamente. Uma matrícula antiga em aberto exige informar a mensalidade correta do indicador e confirmar o desconto. Registros já concluídos são preservados.

## Acesso

- Administrador e participantes: autenticação pela conta ChatGPT, fornecida pela hospedagem Sites.
- Formulário do pai/responsável indicado: acesso público por link; sem login.
- A administração é vinculada ao e-mail configurado no segredo `ADMIN_OWNER_EMAIL`, validado no servidor.
- Cada participante consulta apenas suas indicações. A administração vê os dados completos e a relação entre participantes.
- Painel atualizado a cada 10 segundos.

## Conteúdo do ZIP

Código completo da aplicação, componentes, logotipo, estilos, arquivos de configuração, lockfile de dependências, esquema do banco, migrações SQL e teste funcional.

Não inclui senhas, tokens, node_modules, histórico Git, banco local de testes nem registros do banco de produção. Os registros reais continuam no banco D1 da versão online; este ZIP é uma cópia completa do código, não um backup de dados pessoais.

## Instalação para desenvolvimento

1. Instale Node.js 22.13 ou superior e pnpm (versão indicada em package.json).
2. Abra o terminal na pasta extraída.
3. Execute `pnpm install --frozen-lockfile`.
4. Execute `pnpm dev` para inspecionar a interface.
5. Execute `pnpm exec tsc --noEmit` para conferir os tipos.
6. Execute `node tests/programa.cjs` para testar a API com banco isolado em memória e identidades fictícias. O teste não toca no banco real.
7. Execute `pnpm build` para gerar a versão Cloudflare Workers.

O acesso completo autenticado depende do serviço de identidade do Sites. O servidor local, isoladamente, não autentica usuários ChatGPT. Não exponha um servidor de desenvolvimento que confie em cabeçalhos de identidade enviados diretamente pelo visitante.

## Banco de dados

- Binding D1: `DB`.
- Esquema: `db/schema.ts`.
- Migrações, em ordem: `drizzle/0000_awesome_starjammers.sql`, `0001_daily_radioactive_man.sql`, `0002_charming_stephen_strange.sql`.
- As migrações existentes são históricas: nunca devem ser reaplicadas em banco já migrado.
- Em nova base local, após o build, execute para CADA arquivo em ordem:

  `pnpm exec wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/NOME_DO_ARQUIVO.sql`

A hospedagem Sites aplica as migrações de produção no processo de publicação. A variável ADMIN_OWNER_EMAIL deve ser configurada no ambiente do servidor e não no código-fonte.

## Hospedagem e portabilidade

Esta é a versão atual do Sites, usando Vinext/React, Cloudflare Workers, D1 e autenticação ChatGPT. O arquivo `.openai/hosting.json` identifica o projeto original.

O ZIP não é um site estático para arrastar diretamente para o Netlify. Para migrar a aplicação completa para outro provedor, será necessário adaptar a API, a autenticação e o acesso ao banco e migrar os registros separadamente. Nenhuma migração para Netlify está incluída nesta entrega.

Para referências técnicas adicionais, consulte README.md e os scripts incluídos. Não copie tokens ou segredos de produção para repositórios públicos.
