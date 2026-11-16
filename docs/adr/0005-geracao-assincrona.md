# ADR-0005 — Geração assíncrona com jobs e trava

- **Status:** Aceito
- **Data:** 2026-11-16

## Contexto

Uma geração completa (mapeamento + pesquisa + estruturação) pode levar dezenas de segundos, perto ou acima do limite de duração das funções serverless no plano gratuito. Além disso, dois usuários abrindo ao mesmo tempo um veículo ainda não gerado provocariam duas chamadas de IA para o mesmo resultado.

## Decisão

- Toda geração é um registro em `generation_jobs` com ciclo `pending → running → succeeded | failed`.
- **Trava:** índice único parcial garante no máximo um job ativo por perfil + seção (e por versão FIPE no mapeamento). Quem chega depois recebe o job já existente.
- A rota cria o job, responde `202` com o `jobId` e continua o processamento com `event.waitUntil` (Nitro/Vercel).
- O front acompanha o job via **Supabase Realtime**, com polling como fallback.
- **Geração por seção e sob demanda:** cada aba (ficha, crônicos, manutenção, pré-compra) só é gerada quando aberta pela primeira vez.
- **Limite diário de gerações por usuário**, contado a partir de `generation_jobs`.
- Até 2 tentativas por job; um job em `running` além do tempo máximo é tratado como `failed` na leitura seguinte.
- O consumo de tokens de cada etapa é gravado no job.

## Consequências

- A UI precisa de estados explícitos de "gerando", "falhou" e "tentar novamente".
- A tabela de jobs serve também de auditoria e de painel de consumo da IA.
- Se `waitUntil` não couber no limite de duração do plano, o worker migra para uma Supabase Edge Function acionada por webhook do banco, mantendo a mesma tabela e o mesmo contrato.

## Alternativas consideradas

- **Requisição síncrona:** risco de timeout e de geração duplicada.
- **Fila externa (QStash, Inngest):** robusta, mas adiciona dependência e conta extra sem necessidade no volume atual.
