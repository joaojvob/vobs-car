# ADR-0010 — Base de UI: Reka UI e Tailwind CSS v4 com tokens próprios

- **Status:** Aceito
- **Data:** 2026-11-16

## Contexto

A interface precisa de componentes acessíveis (abas, modais, selects, tooltips, popovers) e de uma identidade visual própria, ligada ao assunto do produto. Kits completos como Nuxt UI, PrimeVue, Vuetify ou Bootstrap aceleram o início, mas entregam um visual padrão facilmente reconhecível, o que deixa o app com cara de "mais um painel genérico".

Um template comercial de painel administrativo foi considerado como base. Ele não pode ser publicado num repositório público (a licença proíbe redistribuir os arquivos-fonte), mistura três bibliotecas de UI e foi feito para rodar só no navegador, sem renderização no servidor.

## Decisão

- **Reka UI** para as primitivas de interação acessíveis (foco, teclado, ARIA), sem nenhum estilo pronto.
- **Tailwind CSS v4** com tokens próprios definidos no CSS (`@theme`): cores, tipografia, espaçamentos, raios e sombras. Nenhum tema pronto é usado.
- **Componentes próprios** em `app/components/common/` envolvendo as primitivas (ex.: `BaseTabs`, `BaseDialog`, `SpecValue`, `SeverityBadge`). Páginas e componentes de domínio usam esses componentes, nunca o Reka UI diretamente.
- **Um único conjunto de ícones** via Iconify (`@nuxt/icon`).
- **Identidade visual** inspirada em documentação técnica automotiva (manual de oficina, desenho técnico, laudo de vistoria). A especificação viva (paleta, tipografia, componentes) fica em `docs/DESIGN.md`, criado quando a direção visual for escolhida.
- **Regras de interface:**
  - valores técnicos sempre com algarismos tabulares;
  - a cor de gravidade nunca é o único sinal: sempre acompanha texto ou número;
  - contraste mínimo AA;
  - modo claro e escuro controlados pelos tokens;
  - templates de terceiros servem apenas como referência; nenhum arquivo deles é copiado.

## Consequências

- Mais trabalho inicial para construir os componentes base.
- Visual coerente e próprio, sem a cara de kit padrão.
- A acessibilidade vem das primitivas do Reka UI, não de implementação manual.
- Mudar a identidade visual significa mudar os tokens, não os componentes.

## Alternativas consideradas

- **Nuxt UI:** muito rápido e integrado ao Nuxt, mas o visual padrão é amplamente reconhecível e exige customização profunda para ganhar identidade.
- **PrimeVue:** excelente para telas com muitos dados, mas o tema padrão tem cara de sistema corporativo.
- **Vuetify:** completo, mas impõe a linguagem do Material Design.
- **Bootstrap 5:** próximo do template avaliado, mas exige customização pesada e integração extra com o Vue.
- **CSS puro, sem primitivas:** controle total, mas a acessibilidade de componentes complexos teria de ser feita à mão.
