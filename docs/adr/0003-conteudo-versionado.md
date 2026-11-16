# ADR-0003 — Conteúdo gerado por IA versionado e imutável

- **Status:** Aceito
- **Data:** 2026-11-16
- **Substitui:** a regra de cache com TTL de 15 dias do escopo inicial.

## Contexto

O escopo inicial previa um TTL de 15 dias: após esse prazo, a IA recalcularia a ficha do veículo. Porém, as especificações de um veículo já lançado não mudam. Regenerar periodicamente:

- gasta cota de IA sem ganho de qualidade;
- pode exibir valores diferentes para o mesmo carro de um mês para o outro, minando a confiança no produto.

## Decisão

- Conteúdo gerado (ficha técnica, problemas crônicos, plano de manutenção, checklist de pré-compra) é **imutável e versionado** em `profile_sections`.
- Cada versão registra `schema_version`, `prompt_version`, provedor e modelo de IA, fontes e datas.
- Só existe **uma versão `active`** por perfil + seção; a anterior vira `superseded` e o histórico é preservado.
- **Não há TTL.** Uma nova versão só nasce de:
  1. reporte de erro aceito;
  2. mudança de `schema_version` que exija regeneração;
  3. ação manual do admin.
- Dados de **preço** (FIPE, combustível, IPVA) não são conteúdo de IA e têm cadência própria de atualização ([ADR-0007](0007-custo-de-propriedade.md)).

## Consequências

- Custo de IA proporcional a perfis novos, não ao tempo.
- Rastreabilidade completa: é possível saber de onde veio cada dado e com qual prompt foi gerado.
- Problemas crônicos de modelos recentes podem ficar desatualizados; mitigado por regeneração manual e, na Fase 4, por confirmações da comunidade.

## Alternativas consideradas

- **TTL fixo (15 dias):** custo recorrente e instabilidade dos dados exibidos.
- **Stale-while-revalidate:** a mesma instabilidade, com mais complexidade.
