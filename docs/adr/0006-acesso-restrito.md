# ADR-0006 — Acesso restrito por convite no MVP

- **Status:** Aceito
- **Data:** 2026-11-16
- **Substitui:** o limite de 2 buscas anônimas com controle por IP do escopo inicial.

## Contexto

O escopo inicial previa 2 buscas gratuitas para visitantes anônimos, controladas no front (LocalStorage) e validadas no back por IP. Porém:

- o público atual é apenas o autor e amigos;
- controle por IP é frágil no Brasil: com CGNAT, muitos usuários de internet móvel compartilham o mesmo IP;
- IP é dado pessoal pela LGPD, o que exigiria política de retenção.

## Decisão

- Login obrigatório (Google via Supabase Auth).
- **Allowlist:** só e-mails cadastrados em `allowed_emails` se tornam membros. O servidor cria o registro em `profiles` no primeiro login, depois de checar a lista.
- Todas as rotas do servidor exigem membro autenticado; as políticas RLS usam `is_member()`.
- O limite diário de gerações por usuário ([ADR-0005](0005-geracao-assincrona.md)) protege a cota de IA.
- Não há acesso anônimo nem registro de IP.

## Consequências

- Saem do MVP: contador de buscas anônimas, controle por IP e o modal de limite atingido.
- LGPD simplificada: dados mínimos (sem placa, CPF ou IP) e exclusão de conta em cascata.
- URLs limpas e SSR são mantidos, para facilitar uma futura abertura ao público.

## Alternativas consideradas

- **Limite anônimo por IP (proposta original):** ver contexto.
- **Login anônimo do Supabase + Cloudflare Turnstile:** melhor caminho se o site for aberto ao público; fica para um ADR futuro, junto com SEO e páginas públicas.
