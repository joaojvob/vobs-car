# ADR-0002 — Perfil técnico como unidade de dados e cache

- **Status:** Aceito
- **Data:** 2026-11-16

## Contexto

O catálogo FIPE é organizado para **preço**, não para engenharia. Um mesmo conjunto mecânico aparece em dezenas de entradas: "Gol 1.0 2p" e "Gol 1.0 4p", versões de acabamento, anos-modelo seguidos. Se o conteúdo fosse gerado por código FIPE:

- a IA seria chamada várias vezes para produzir os mesmos dados (custo);
- versões idênticas poderiam receber respostas diferentes (inconsistência).

## Decisão

- Criar o **perfil técnico** (`tech_profiles`): marca + família + geração + motor + câmbio, com o tipo de carroceria.
- Motores (`engines`) e câmbios (`transmissions`) são entidades próprias, reaproveitadas entre perfis.
- Cada versão FIPE (`fipe_model_years`) aponta para um perfil. Todo conteúdo técnico pertence ao perfil.
- O **mapeamento** FIPE → perfil é feito na etapa 0 do pipeline de IA ([ADR-0004](0004-pipeline-ia.md)): a descrição FIPE vira uma chave técnica normalizada (`normalized_key`); se o perfil já existe, é reaproveitado sem nova pesquisa.
- Motores e câmbios são casados por `slug`; duplicatas detectadas podem ser unificadas manualmente pelo admin.

## Consequências

- O custo de IA passa a ser proporcional ao número de **perfis técnicos**, que é muito menor que o número de entradas FIPE.
- Dados consistentes entre versões que compartilham a mecânica.
- Problemas de um motor ou câmbio podem ser consultados entre modelos diferentes.
- **Risco:** mapeamento errado aplica a ficha de outro motor. Mitigações: a página exibe o motor e o câmbio considerados, o usuário pode reportar "este não é o meu motor" e o admin pode remapear.

## Alternativas consideradas

- **Código FIPE como chave:** simples, mas caro e inconsistente (ver contexto).
- **Base de motores curada manualmente desde o início:** mais precisa, mas inviável para começar; a tabela de motores é refinada aos poucos.
