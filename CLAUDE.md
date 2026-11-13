# Vaga que Volta — contexto do projeto

POC do grupo **Bug Hunters** para a **Global Solution 2026/2 (CitizenTech)** da FIAP, turma 1ESOR.
Entrega: **19/11/2026, 23h55** (meta interna: enviar em 18/11).

## O produto em uma frase
Quando um paciente do SUS libera ou falta a uma consulta com especialista, a vaga não se perde: ela vai automaticamente para quem está na fila **e consegue chegar a tempo**, e a tela explica o porquê da escolha.

- Frase-assinatura: "Cadeira vazia no consultório é fila parada lá fora."
- Dado do Início: Porto Alegre perdeu **45.607 consultas de especialista em 2025** por falta, cerca de **13%** das vagas. `[FONTE: inserir link oficial conferido]`
- Diferencial: SP já manda confirmação por WhatsApp, mas a vaga liberada não é reaproveitada. Nós fechamos esse ciclo.

## Regras do edital (obrigatórias)
- **Somente HTML, CSS e JavaScript puros.** Sem framework, biblioteca, Bootstrap, Tailwind, jQuery, Node ou build. Google Fonts via `<link>` é permitido.
- Só conteúdo visto até a Fase 4 na parte que pontua: arrays de objetos, laços (`for`, `while`), funções, condicionais, DOM (`querySelector`, `addEventListener`, `createElement`, `textContent`), formulários, Flex/Grid e media queries.
- **4 páginas** com o **mesmo menu** em todas.
- A simulação interativa usa um **array com 10 ou mais objetos**, manipulado via DOM (vale 4 pontos).
- O formulário é validado **sem `alert()`**, com mensagens inline.
- Site responsivo e acessível. O pacote final é um .zip com o código e um .pdf com os RMs e o link do pitch.

## Recursos extras (camada opcional)
`js/persistencia.js` (localStorage) e o texto para voz em `js/acessibilidade.js` (`speechSynthesis`) **não fazem parte do conteúdo da fase**. Por isso:
- ficam isolados nesses arquivos;
- o site funciona 100% se eles forem removidos. Os outros scripts testam se as funções existem antes de chamar (`if (typeof vqvLerCadastros === "function")`);
- o README declara isso explicitamente.

## Estrutura
```
index.html        Início
simulacao.html    Simulação (visão do operador da regulação)
fila.html         Entrar na fila (visão do paciente)
sobre.html        Sobre (equipe, validação, regra, limitações)
css/style.css
js/dados.js       agenda (12) + fila (15) — arrays de objetos
js/simulacao.js   regra de realocação e renderização
js/formulario.js  validação inline e cadastro
js/persistencia.js   [extra] localStorage
js/acessibilidade.js [extra parcial] painel: contraste, fonte, voz
img/
README.md
```

## Convenções
- Código em português (nomes de variáveis e funções), indentação de 2 espaços, `const`/`let` e nada de `var`.
- HTML semântico (`header`, `nav`, `main`, `section`, `footer`), um `h1` por página.
- Nada de CSS inline nem `onclick` no HTML: os eventos vão no JS.
- Commits pequenos em português ("feat: simulação de falta no dia").

## Visual
Minimalista. Fundo creme `#F3F0E8`, **verde `#1F6F6B` como única cor de destaque** e texto quase preto `#14201F`. As únicas outras cores são os **selos de risco do SUS** (vermelho, amarelo, verde e azul), sempre com texto e ícone, nunca só a cor. Use a skill **frontend-design** para tipografia, espaçamento e componentes, respeitando essa paleta.

## Acessibilidade (critério de desempate)
- Link "Pular para o conteúdo" em todas as páginas.
- Toda a agenda operável por teclado, com foco visível.
- `aria-live="polite"` anunciando cada realocação.
- Risco sempre em texto, nunca só pela cor.
- Botão fixo de acessibilidade que abre um painel com: Ouvir esta página, Narrar realocações (só na simulação), Alto contraste e Fonte A−/A+.
- Contraste mínimo de 4.5:1.

A especificação detalhada, por etapas, está em `SPEC.md`.
