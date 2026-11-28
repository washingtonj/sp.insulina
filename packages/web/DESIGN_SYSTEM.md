# Design System — sp.insulina

Base: Human Interface Guidelines (Apple) aplicadas a web. Mobile first; desktop herda o mesmo desenho com mais área.

## 1. Princípios

1. **Conteúdo acima da moldura.** Superfícies escuras, bordas quase invisíveis; o dado (UBS, insulina, nível) é o que tem contraste.
2. **Uma decisão por cor.** Cor só aparece onde significa algo: nível de cobertura. Fora disso, preto e branco.
3. **Toque antes de densidade.** Nada clicável abaixo de 44×44px, mesmo que isso force mais espaço entre itens.
4. **Movimento curto e explicativo.** 160–260ms, só para mostrar de onde algo veio ou para onde foi. Nunca decorativo.
5. **Plataforma nativa.** Fonte do sistema, `color-scheme`, safe areas e scroll nativo respeitados.

## 2. Tokens

Definidos em `src/app.css`. Nenhum componente usa cor literal fora dos tokens.

### Cor

| token     | escuro    | claro     | uso                           |
| --------- | --------- | --------- | ----------------------------- |
| `canvas`  | `#0a0a0a` | `#f2f2f7` | fundo da página               |
| `surface` | `#141414` | `#ffffff` | cards, sheets, painéis        |
| `raised`  | `#1d1d1d` | `#f2f2f7` | linha selecionada, hover      |
| `line`    | `#2c2c2c` | `#e3e3e8` | divisores e bordas            |
| `ink`     | `#f4f4f5` | `#1d1d1f` | texto primário, CTA invertido |
| `muted`   | `#a1a1aa` | `#6e6e73` | texto secundário              |
| `faint`   | `#71717a` | `#a1a1a6` | texto terciário, metadados    |

Nível de cobertura (só nos pinos, legenda e ponto do card):
`3 completo #34d399` · `2 falta 1 #fbbf24` · `1 parcial #f87171` · `0 sem estoque #9ca3af` (contorno, sem preenchimento).

Séries de gráfico: `--series-1/2/3` trocam com o tema para manter contraste.

Exceção única de cor literal: o scrim de modal (`bg-black/50`) — precisa escurecer nos dois temas.

### Raio, sombra, espaço

- `--radius-card: 1.5rem` (cards, painéis)
- `--radius-sheet: 1.75rem` (sheet mobile, topo)
- `--radius-pill: 9999px` (todos os controles)
- `--shadow-float`: sombra única para tudo que flutua sobre o mapa.
- Espaço: múltiplos de **4**; gaps usuais 4, 8, 12, 16, 24, 32.

### Tipografia (Dynamic Type)

Mobile segue a fileira **Large (default)** do HIG; desktop (≥768px) segue a fileira
**Small** do próprio HIG — o compacto estilo shadcn New York / Linear / Vercel
(base 14–15px). Só a tipografia encolhe; alvos de toque continuam 44px.

| token           | mobile / linha    | desktop / linha   | uso                                |
| --------------- | ----------------- | ----------------- | ---------------------------------- |
| `text-title-1`  | 28 / 34           | 26 / 32           | título de página                   |
| `text-title-2`  | 22 / 28           | 20 / 25           | nome da unidade no detalhe         |
| `text-title-3`  | 20 / 25           | 18 / 23           | marca, títulos de painel           |
| `text-headline` | 17 / 22 extrabold | 15 / 20 extrabold | título do card, cabeçalho de seção |
| `text-body`     | 17 / 22           | 15 / 20           | corpo                              |
| `text-subhead`  | 15 / 20           | 13 / 18           | valores de linha                   |
| `text-footnote` | 13 / 18           | 12 / 16           | endereço, horário, rótulos         |
| `text-caption`  | 12 / 16           | 11 / 13           | disponibilidade resumida, legendas |

Fonte: `Nunito` (webfont OFL) com fallback `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto`. Títulos em extrabold arredondado.
Números sempre com `.tabular`.

## 3. Ritmo vertical (regra derivada do filtro)

Dentro de um grupo, a distância entre itens vem da altura de toque — não de `gap`. Entre grupos, o vão precisa ser **visivelmente maior** que entre itens:

```
cabeçalho → 1º item   9px
item → item          23px   (linha de 44px com conteúdo de 20px)
grupo → grupo        35px
```

Regra: `grupo ≥ 1,5 × item` e `cabeçalho ≤ 0,5 × item`. Se dois grupos parecem um só, o gap está pequeno.

## 4. Componentes

### Mapa

- Container `isolate` (prende os z-index do Leaflet); mobile com topo `rounded-t-sheet`, desktop com margem 12px e raio 28px.
- Tiles monocromáticos via `--map-filter`; fundo `--map-bg`.
- Pin: `circleMarker` 5.5px (4px quando vazio), contorno 2px na cor do nível; selecionado 8px e contorno `ink`.
- `fitBounds` e centralização usam `paddingLeft` = largura do painel (500px desktop, 0 mobile) para não esconder pinos atrás da lista.
- Sem controle de zoom (pinça/roda); atribuição sem prefixo "Leaflet", crédito OSM mantido e discreto.

### Legenda

- Pill horizontal, canto inferior direito (mobile: acima do sheet).
- Rótulo "Cobertura" ou "Cobertura do filtro" — a cor muda de significado com filtro ativo, o rótulo avisa.

### Busca (dentro do painel, topo da lista)

- Pill de 44px em `raised` sólido (controle sobre superfície — vidro `surface/85` só flutuando sobre o mapa), sem borda em repouso; `focus-within` desenha o anel de foco do §6 (2px em `ink`) — vale a regra do §6, não 1px.
- Dentro da pill, da esquerda para a direita: busca, filtro (36px, com badge), Localizar-ícone (36px, sem anel no hover — só a cor do ícone muda).
- Sem contagem: a lista rola inteira (sem fatiar em 50); com filtro ativo aparece um "Limpar filtros" flutuante sobre o mapa.

### Estados de controle

- **Repouso:** fundo `raised` (controles sobre superfície) ou vidro `surface/85` (sobre o mapa).
- **Hover:** **anel de 1px** em `faint/40`, sem trocar o fundo — o fundo é a identidade do controle, o anel é o feedback.
- **Pressionado:** escala 0.97 por 120ms.
- **Foco:** anel de 2px em `ink` com offset 2.

Anel no hover vale para segmentos do grupo do header e qualquer botão pill fora de grupo (o gatilho de filtros e o Localizar-ícone dentro da busca mudam só a cor, sem anel).

### Header (fora do mapa)

- Barra própria sobre o canvas (`h-11`): marca `sp.insulina` à esquerda + dois ícones puros à direita (gráficos, tema, 36px, `gap-1`, sem pill — só a cor muda no hover; gráficos usa peso bold quando ativo).
- O mapa + elementos vivem num tray arredondado colado abaixo (mobile sem respiro; desktop `pt-2`).
- Anel no hover vale para os segmentos do grupo e qualquer botão pill fora de grupo.

### Lista (sidebar / bottom sheet)

- Desktop: coluna de 30rem, altura total, sem paginação — a lista inteira rola (render condicional por estado: skeletons, erro, vazio, lista).
- Mobile: bottom sheet com handle; 32dvh recolhido, 78dvh expandido; arrasta ou toca.
- Altura **fixa** por estado (não `max-height`) — evita o painel encolher no loading.
- Fade de rolagem via `mask-image` (28px), ligado só no lado que tem conteúdo escondido.
- **Sem barra de rolagem visível** (`scrollbar-width: none` + `::-webkit-scrollbar`): a fade é a única indicação de conteúdo além. Roda e teclado continuam rolando.

### Card de UBS

Anatomia, de cima para baixo:

1. ponto de cobertura (8px) + nome (`headline`) + chevron removido
2. endereço (`footnote`, `faint`)
3. horário e distância (`footnote`, `muted`, ícones de 14px)
4. melhor dia (`footnote`)
5. disponibilidade em uma linha (`caption`, `tabular`)
6. rodapé com divisor: "Atualizado há X" (`caption`, `faint`) + link "Histórico" (`caption`, 44px de área)

### Skeletons

Mesma anatomia do card, com shimmer de 1.8s; desligado em `prefers-reduced-motion`.

### Filtros

- Desktop: popover de 22rem ancorado no ícone. Mobile: sheet de até 85dvh.
- Estrutura: título → grupos (rótulo + checkboxes) → distância (slider + valor abaixo) → CTA pill.
- Aplicação em rascunho: "Aplicar filtros" confirma.

### Gráficos

- Painel lateral à direita (desktop) / tela cheia (mobile), aberto por botão.
- Duas séries por variante (Carpule, Ampola), eixo X `dd/mm`, tooltip `dd/mm/aaaa`.
- Variação diária: barras divergentes (verde acima, vermelho abaixo).
- Controles segmentados (métrica, período, série): botões `h-9` em container pill com `p-1` e `gap-1`. Exceção justificada aos 44px: operam como um widget composto único (padrão `UISegmentedControl`, ~32px; WCAG 2.2 pede mínimo de 24px), texto em `footnote` segue legível, e a altura menor elimina o "círculo gigante" devolvendo a hierarquia ao gráfico.
- Estados: skeleton com a forma do card, erro, vazio.

## 5. Movimento

| momento                        | duração            | curva                    |
| ------------------------------ | ------------------ | ------------------------ |
| linhas da lista (cascata 24ms) | 220ms, 12px        | `cubicOut`               |
| painel de gráficos             | 260ms, 40px        | `cubicOut`               |
| saída do painel                | 170ms, 40px        | `cubicOut`               |
| popover                        | 160ms              | `cubic-bezier(.2,0,0,1)` |
| sheet                          | 220ms              | `cubic-bezier(.2,0,0,1)` |
| troca skeleton → conteúdo      | 160–180ms fade     | —                        |
| toque em botão                 | 120ms, escala 0.97 | `ease-out`               |
| navegação de rota              | 240ms              | `cubic-bezier(.2,0,0,1)` |

Tudo passa por `motion()` (`$lib/motion.ts`) e pelo bloco `prefers-reduced-motion` do CSS: com redução ligada, nada anima.

## 6. Acessibilidade

- 44px mínimo em qualquer alvo: "Localizar", "Histórico" do card, gatilhos do bits-ui e checkboxes. Ícones em conjunto denso (barra, busca) e segmentados: 36px — mesma exceção do §Gráficos (widget composto, piso WCAG 24px).
- `:focus-visible` com anel de 2px na cor `ink` e offset 2.
- Nome acessível em todo botão de ícone (`aria-label` + `title`).
- Cor nunca é o único canal: a legenda nomeia os estados e o card traz as quantidades.
- Dialogs (sheet de filtros, painel) têm título e fechamento declarados.

## 7. Estados e edge cases

| caso             | comportamento                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| carregando       | skeletons com a anatomia final; painel mantém a altura                                                     |
| erro de API      | mensagem no corpo da lista, painel mantém a altura                                                         |
| sem resultados   | "Nenhum local encontrado" + sugestão de ajustar filtros                                                    |
| sem localização  | "Localizar" (ícone na busca, sempre visível); filtro de distância desabilitado com "Ative sua localização" |
| filtro ativo     | badge no funil, legenda muda para "Cobertura do filtro", "Limpar" aparece                                  |
| unidade sem item | pino vazado, nunca verde                                                                                   |
| histórico vazio  | texto explicando que os dados começam após a primeira coleta                                               |
| tema             | claro/escuro persistidos, primeira visita segue o sistema, sem flash                                       |

## 8. Não fazer

- Não usar `max-height` para painéis que precisam de altura estável.
- Não animar mais de 260ms nem usar bounce.
- Não introduzir cor fora dos tokens e do mapa.
- Não duplicar formatação de data: tudo por `$lib/utils/date.ts`.
- Não usar `space-y` para ritmo de itens com alvo de toque — a própria altura já define o ritmo.
- Não cruzar divisor reto junto a quinas arredondadas: barras de cabeçalho/rodapé não usam `border-b/t` full-bleed (a separação vem do espaço); divisores full-bleed vivem só no tramo reto, entre cards.
