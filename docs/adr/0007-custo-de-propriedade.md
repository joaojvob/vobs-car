# ADR-0007 — Custo de propriedade por cálculo determinístico

- **Status:** Aceito
- **Data:** 2026-11-16

## Contexto

Saber quanto um veículo custa por mês e por ano é útil para quem já o possui e decisivo na pré-compra. Esses valores dependem de regras e preços objetivos (alíquotas, tabelas, consumo), um terreno em que uma IA erraria contas e inventaria números.

## Decisão

- O custo é calculado por uma **função pura** em `shared/utils/`, que roda no front (simulação instantânea ao editar premissas) e no servidor.
- Componentes e fontes:

  | Componente | Cálculo | Fonte |
  |---|---|---|
  | Depreciação | Variação do preço FIPE nos últimos 12–24 meses | `fipe_prices` |
  | IPVA | Valor FIPE × alíquota, considerando isenção por idade | `ipva_rules` (curada por UF/ano) |
  | Licenciamento | Valor fixo por UF/ano | `licensing_fees` |
  | Combustível | km/mês ÷ consumo × preço | Consumo da ficha técnica ou real (Garagem); preço ANP por UF ou informado |
  | Manutenção | Itens do plano × faixa de preço | Plano de manutenção (estimativa) e histórico real |
  | Pneus | km/mês ÷ vida útil × preço | Medida da ficha técnica + preço informado ou estimado |
  | Seguro | Informado pelo usuário (opcional) | — |
  | Reserva para crônicos (opcional) | Crônicos na faixa de km × custo médio | `chronic_issues`, exibida separada do total |

- Resultado sempre em **faixa (mín–máx)**: mensal, anual e por km.
- **Premissas visíveis e editáveis:** UF, km/mês, preço do combustível, seguro, uso normal ou severo.
- Para veículos flex, indicar se compensa etanol ou gasolina com o consumo do próprio motor.
- Tabelas de preço têm cadência própria: FIPE mensal, combustível semanal ou mensal, IPVA e licenciamento anual. No início, apenas as UFs dos usuários atuais.

## Consequências

- A IA não calcula valores; no máximo estima faixas de preço de peças, sempre rotuladas como estimativa.
- O IPVA é aproximado: cada estado publica sua própria base de cálculo, então o valor é exibido como estimativa.
- Por ser uma função pura, o cálculo é fácil de testar isoladamente.

## Alternativas consideradas

- **Pedir o custo total à IA:** números não auditáveis e instáveis.
- **APIs pagas de preço de peças e seguro:** custo incompatível; o seguro fica como entrada do usuário.
