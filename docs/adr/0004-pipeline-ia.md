# ADR-0004 — Pipeline de IA em etapas, com fontes, via Gemini

- **Status:** Aceito
- **Data:** 2026-11-16

## Contexto

Dados técnicos errados (volume de óleo, norma do fluido de freio ou de câmbio) podem causar dano real a um veículo. Respostas de modelos de linguagem sem fontes soam confiantes mesmo quando estão erradas. O projeto também precisa de custo de IA próximo de zero para o público atual, e a API do Gemini tem free tier.

## Decisão

- **Provedor:** Google Gemini API, com chave gerada no Google AI Studio. A assinatura do app (Google AI Pro) não cobre o uso da API.
- **Etapa 0 — Mapeamento** (apenas para versões FIPE sem perfil): descrição FIPE + ano + combustível → chave técnica normalizada ([ADR-0002](0002-perfil-tecnico.md)). Modelo rápido, schema pequeno.
- **Etapa 1 — Pesquisa:** modelo com busca no Google (grounding) levanta os dados de uma seção e devolve texto e fontes.
- **Etapa 2 — Estruturação:** o resultado da etapa 1 é convertido em JSON usando o JSON Schema gerado a partir do Zod e validado com `safeParse`. Cada valor referencia as fontes que o sustentam.
- **Abstração:** `server/services/ai/` expõe a interface `AiProvider` (`research`, `structure`); o Gemini é um adapter. Os modelos usados em cada etapa ficam no `runtimeConfig`, não fixos no código.
- **Prompts versionados** em `server/services/ai/prompts/`; a versão é gravada junto com o conteúdo ([ADR-0003](0003-conteudo-versionado.md)).
- **Entrada controlada:** prompts recebem apenas dados de catálogo já validados, nunca texto livre do usuário (prevenção de prompt injection).
- **Dados enviados:** somente dados públicos de veículos. Nenhum dado de usuário vai para a IA.

## Consequências

- Duas ou três chamadas por geração aumentam a latência, o que exige geração assíncrona ([ADR-0005](0005-geracao-assincrona.md)).
- Separar pesquisa e estruturação funciona com qualquer provedor, inclusive os que não combinam busca com fontes e saída estruturada na mesma chamada.
- Trocar de provedor exige apenas um novo adapter, sem mudar services nem schemas.
- No free tier, o Google pode usar os prompts para melhorar seus produtos; aceitável porque só trafegam dados públicos de veículos.

## Alternativas consideradas

- **Uma única chamada sem busca:** mais barata, porém sem fontes e com mais alucinação.
- **Base de dados técnica comercial:** dados melhores, custo incompatível com o projeto.
- **Outros provedores (Anthropic, OpenAI):** viáveis via adapter; não escolhidos agora por custo.
