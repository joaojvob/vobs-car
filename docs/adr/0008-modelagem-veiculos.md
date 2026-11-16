# ADR-0008 — Modelagem por tipo de veículo e motorização

- **Status:** Aceito
- **Data:** 2026-11-16

## Contexto

Carros e motos têm dados diferentes. Motos têm transmissão final (corrente, correia ou cardã), óleo com norma JASO MA/MA2 e folga de válvulas. Carros têm fluido de câmbio e capacidade de cárter. Dentro de cada tipo, a motorização também muda tudo: elétricos não têm óleo de motor, mas têm bateria de tração e fluido de redutor; híbridos combinam os dois mundos.

Um schema único com dezenas de campos opcionais aceitaria combinações inválidas e quebraria a UI silenciosamente.

## Decisão

- Dois eixos discriminantes: `vehicleType` (`car` | `motorcycle`) e `powertrain` (`ice` | `hybrid` | `phev` | `ev`).
- Schemas Zod em `shared/schemas/` usam `z.discriminatedUnion`, compondo blocos comuns (freios, pneus, bateria 12 V) com blocos específicos (óleo de motor, transmissão final, bateria de tração).
- Motos: `finalDrive` (`chain` | `belt` | `shaft` | `gear`), norma JASO, relação coroa/pinhão e intervalo de folga de válvulas.
- O `body_type` do perfil técnico define o template SVG do Raio-X.
- Todo valor técnico usa o mesmo envelope: valor, unidade, fontes, confiança e status de verificação.
- Componentes Vue escolhem o bloco a renderizar pelo discriminante, nunca por checagem de campo opcional.

## Consequências

- O TypeScript estreita os tipos automaticamente em componentes e services.
- Uma nova motorização é um novo membro da união, sem afetar os existentes.
- Cada geração usa apenas o schema da variante do perfil, mantendo o prompt enxuto.

## Alternativas consideradas

- **Schema único com campos opcionais:** simples no começo, frágil depois.
- **Uma coluna relacional por campo técnico:** rígido demais para conteúdo que evolui com o schema; o conteúdo vive em `jsonb` versionado ([ADR-0003](0003-conteudo-versionado.md)).
