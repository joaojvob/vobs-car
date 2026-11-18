# Design system: Oficina

A identidade visual do vobs-car vem da sinalização de oficina e dos manuais de serviço: grafite, um único amarelo de segurança, tipografia condensada e números alinhados como numa tabela de torque.

A base técnica (Reka UI + Tailwind CSS v4 com tokens próprios) está em [ADR-0010](adr/0010-base-de-ui.md). Este documento é a referência viva de cores, tipografia e componentes. Se algo na interface não estiver coberto aqui, a regra entra aqui antes de entrar no código.

## Princípios

1. **Dado primeiro.** A tela existe para mostrar valores técnicos com clareza. Decoração que não ajuda a ler um valor sai.
2. **Um destaque só.** O amarelo marca a ação principal e o item ativo. Se tudo é amarelo, nada é.
3. **Cor nunca sozinha.** Gravidade, status e confiança sempre aparecem também em texto.
4. **Números alinhados.** Todo valor numérico usa algarismos tabulares.
5. **Cantos retos.** Raio máximo de 2 px. Círculos só nos marcadores numerados do Raio-X.

## Cores

### Tema claro (padrão)

| Token | Valor | Uso |
|---|---|---|
| `ground` | `#E9EBEE` | Fundo da página |
| `surface` | `#FFFFFF` | Painéis, cards, tabelas |
| `ink` | `#15181C` | Texto principal, traço do Raio-X, separadores fortes |
| `ink-muted` | `#4B535C` | Rótulos, metadados, texto secundário |
| `line` | `#CDD2D8` | Bordas de painel e divisórias |
| `line-strong` | `#8A939D` | Borda de campos e controles (contraste mínimo de 3:1) |
| `signal` | `#F5C400` | Fundo da aba ativa e da ação principal |
| `on-signal` | `#15181C` | Texto sobre `signal` |
| `severity-high` | `#B3261E` | Gravidade alta (texto branco por cima) |
| `severity-medium` | `#E39A0B` | Gravidade média (texto `ink` por cima) |
| `severity-low` | `#2F7A4F` | Gravidade baixa (texto branco por cima) |

### Tema escuro

| Token | Valor |
|---|---|
| `ground` | `#101215` |
| `surface` | `#181B20` |
| `ink` | `#E8EAED` |
| `ink-muted` | `#A3ABB5` |
| `line` | `#2C3138` |
| `line-strong` | `#66707B` |
| `signal` | `#F5C400` |
| `on-signal` | `#15181C` |
| `severity-high` | `#E5534B` |
| `severity-medium` | `#E39A0B` |
| `severity-low` | `#3FA36B` |

No tema escuro, todos os selos de gravidade usam texto `#15181C`.

### Regras de cor

- `signal` é sempre **fundo** com texto `on-signal`. No tema claro, nunca usar amarelo como linha, ícone ou texto sobre branco: o contraste fica abaixo de 3:1.
- As três cores de gravidade diferem também em luminosidade, não só em tonalidade, e sempre acompanham o rótulo (ALTA, MÉDIA, BAIXA).
- Todo texto respeita contraste AA (4,5:1; 3:1 a partir de 24 px). As combinações da tabela já foram conferidas.

## Tipografia

Duas famílias da mesma origem, do Google Fonts, baixadas no build e servidas pelo próprio app (`@nuxt/fonts`):

- **Barlow Condensed** (500, 600, 700): títulos, rótulos, abas, botões e totais.
- **Barlow** (400, 500, 600): texto corrido e valores.

| Estilo | Família e peso | Tamanho / altura de linha | Observação |
|---|---|---|---|
| `display` | Condensed 700 | 48 / 1.0 | Caixa alta. Título de página |
| `title` | Condensed 700 | 34 / 1.1 | Caixa alta. Nome do veículo |
| `heading` | Condensed 600 | 24 / 1.2 | Títulos de seção |
| `label` | Condensed 600 | 13 / 1.2 | Caixa alta, espaçamento 0.08em, cor `ink-muted` |
| `body` | Barlow 400 | 16 / 1.5 | Texto corrido |
| `body-sm` | Barlow 400 | 14 / 1.45 | Descrições em cards |
| `caption` | Barlow 400 | 12 / 1.4 | Fontes, confiança, metadados. Nunca abaixo de 12 px |
| `value` | Barlow 500 | 18 / 1.3 | Valores técnicos, sempre tabulares |
| `value-lg` | Condensed 700 | 28 / 1.1 | Totais, sempre tabulares |
| `control` | Condensed 600 | 16 / 1.0 | Caixa alta, espaçamento 0.04em. Abas e botões |

## Espaçamento, bordas e elevação

- **Escala de espaçamento:** 4, 8, 12, 16, 24, 32, 40, 48 px.
- **Raio:** 0 ou 2 px.
- **Bordas:** 1 px `line` em painéis; 2 px `ink` para separar totais e cabeçalhos.
- **Elevação:** sem sombra em cards. Sombra apenas em sobreposições (modal, popover, menu, lista do combobox), com um único token: `shadow-overlay`.
- **Área de toque:** mínimo de 44 × 44 px.

## Ícones

- Um único conjunto: **Tabler Icons**, via `@nuxt/icon` (prefixo `tabler:`).
- Traço de 1.5 a 2 px, tamanhos de 20 e 24 px.
- Ícone sozinho em botão exige `aria-label`.

## Componentes base

Ficam em `app/components/common/` e são os únicos que usam o Reka UI diretamente.

| Componente        | Especificação                                                                                                                                                                                                                                                                                |
|---                |---                                                                                                                                                                                                                                                                                           |
| `BaseButton`      | Variantes: `primary` (fundo `ink`, texto `surface`), `signal` (fundo `signal`, no máximo um por tela), `secondary` (borda `line-strong`) e `ghost`. Texto em estilo `control`. Altura mínima de 44 px.                                                                                       |
| `BaseTabs`        | Aba ativa com fundo `signal` e texto `on-signal`. Inativas em `ink-muted`. Linha `line` sob o grupo.                                                                                                                                                                                         |
| `SeverityBadge`   | Retângulo preenchido com a cor de gravidade, texto em `label` (ALTA, MÉDIA, BAIXA).                                                                                                                                                                                                          |
| `SpecValue`       | Rótulo (`label`), valor (`value`) e linha de metadados (`caption`): fontes, confiança e verificação.                                                                                                                                                                                         |
| `VerificationTag` | Texto em `caption`: "não verificado", "confirmado por N donos" ou "verificado", com ícone quando confirmado.                                                                                                                                                                                 |
| `DataList`        | Lista de rótulo e valor (`<dl>`), valores alinhados à direita e tabulares. Total separado por borda de 2 px `ink`.                                                                                                                                                                           |
| `BasePanel`       | Fundo `surface`, borda 1 px `line`, padding de 16 ou 24 px.                                                                                                                                                                                                                                  |
| `BaseDialog`      | Primitiva de diálogo do Reka UI, fundo `surface`, sombra de sobreposição.                                                                                                                                                                                                                    |
| `BaseField`       | Rótulo visível sempre; borda 1 px `line-strong`; mensagem de erro em texto, não só em cor.                                                                                                                                                                                                   |
| `BaseCombobox`    | Campo com busca para listas longas (marca, modelo, ano). Rótulo visível, borda 1 px `line-strong`, busca por palavras em qualquer ordem sem diferenciar acento e caixa, lista em sobreposição com `shadow-overlay` e item marcado com ícone de check. Carregamento e erro aparecem em texto. |

**Foco:** contorno de 2 px `ink` com afastamento de 2 px no tema claro e 2 px `signal` no escuro. O foco nunca é removido.

## Raio-X

- Desenho lateral esquemático por categoria de carroceria (`body_type`), em SVG embutido no HTML. Arte própria.
- Fundo quadriculado de 16 px em tom próximo de `line`, sobre `surface`.
- Carroceria com traço `ink` de 2.5 px e preenchimento `surface`. Vidros em `line`.
- Cada sistema é um grupo `data-zone` com o valor do enum `vehicle_system`:
  - sem problemas registrados: contorno tracejado `ink-muted`, sem preenchimento;
  - com problemas: contorno contínuo e preenchimento translúcido na cor da maior gravidade.
- Marcadores numerados: círculos de 22 px na cor da gravidade (ou `ink`), número em Condensed 700.
- A legenda abaixo do desenho repete número, sistema e gravidade em texto.
- No celular, a lista de sistemas também funciona como navegação, porque tocar em zonas pequenas é impreciso.

## Movimento

- Transições de 120 a 160 ms, `ease-out`, só em hover, foco e troca de aba.
- Com `prefers-reduced-motion`, nenhuma animação.

## O que evitar

Para não cair no visual padrão de kits prontos:

- gradientes decorativos, vidro fosco (glassmorphism) e brilhos;
- cards com faixa colorida na borda esquerda;
- emojis na interface;
- raios grandes e sombras em cards;
- roxo, azul-neon ou qualquer segunda cor de destaque;
- ilustrações genéricas ou imagens de banco.

## Tokens no código

Os tokens vivem em [`app/assets/css/main.css`](../app/assets/css/main.css), que é a fonte da verdade:

- a paleta, os raios e as sombras padrão do Tailwind são removidos, então só existem as cores, o raio e a sombra dos tokens;
- a cor da sombra fica numa variável fora do `@theme` (`--overlay-shadow-color`), porque o Tailwind copia os valores do tema para as classes e ela precisa mudar no tema escuro;
- cada estilo de texto vira um utilitário `type-*` (`type-label`, `type-value`, `type-control`…), que já aplica família, peso, tamanho, caixa e algarismos tabulares;
- foco visível e `prefers-reduced-motion` ficam na camada base.

Esboço de referência:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: "Barlow", system-ui, sans-serif;
  --font-display: "Barlow Condensed", "Barlow", sans-serif;

  --color-ground: #E9EBEE;
  --color-surface: #FFFFFF;
  --color-ink: #15181C;
  --color-ink-muted: #4B535C;
  --color-line: #CDD2D8;
  --color-line-strong: #8A939D;
  --color-signal: #F5C400;
  --color-on-signal: #15181C;
  --color-severity-high: #B3261E;
  --color-severity-medium: #E39A0B;
  --color-severity-low: #2F7A4F;

  --radius-sm: 2px;
}

.dark {
  --color-ground: #101215;
  --color-surface: #181B20;
  --color-ink: #E8EAED;
  --color-ink-muted: #A3ABB5;
  --color-line: #2C3138;
  --color-line-strong: #66707B;
  --color-severity-high: #E5534B;
  --color-severity-low: #3FA36B;
}
```

Nos componentes, apenas classes geradas a partir dos tokens (`bg-surface`, `text-ink-muted`, `border-line`). Cores em hexadecimal ou tamanhos avulsos fora deste arquivo não passam no code review.
