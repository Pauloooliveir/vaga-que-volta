# Vaga que Volta

**Cadeira vazia no consultório é fila parada lá fora.**

Quando um paciente do SUS libera ou falta a uma consulta com especialista, a vaga não se perde: ela vai automaticamente para quem está na fila **e consegue chegar a tempo**, e a tela explica o porquê da escolha.

Prova de conceito (POC) do grupo **Bug Hunters** para a Global Solution 2026/2 (CitizenTech) da FIAP, turma 1ESOR.

- **Site:** https://pauloooliveir.github.io/vaga-que-volta/
- **Pitch (vídeo):** `[link do pitch]`

## O problema

Quem precisa de um especialista no SUS espera meses na fila. Enquanto isso, parte das consultas marcadas fica vazia: o paciente esquece, não consegue ir ou desiste e não avisa. Em 2025, Porto Alegre perdeu **45.607 consultas com especialista** por falta, cerca de **13% das vagas**.

Fonte: `[link oficial conferido]`

São Paulo já confirma consultas pelo WhatsApp, mas a vaga liberada não é reaproveitada. O Vaga que Volta fecha esse ciclo.

## Integrantes

| Nome | RM |
|---|---|
| `[Nome]` | `[RM]` |
| `[Nome]` | `[RM]` |
| `[Nome]` | `[RM]` |
| `[Nome]` | `[RM]` |
| `[Nome]` | `[RM]` |

## Como rodar

Não precisa instalar nada. Baixe ou clone o repositório e abra o arquivo `index.html` no navegador.

Ou acesse a versão publicada: https://pauloooliveir.github.io/vaga-que-volta/

## Páginas

| Página | O que tem |
|---|---|
| `index.html` (Início) | O problema, o dado com a fonte e como funciona em 3 passos |
| `simulacao.html` (Simulação) | Agenda de um dia (visão de quem trabalha na regulação): marque uma falta ou uma liberação e veja para quem a vaga vai, e por quê |
| `fila.html` (Entrar na fila) | Formulário do paciente, com validação na própria página |
| `sobre.html` (Sobre) | Equipe, o que ouvimos nas entrevistas, regra de decisão, limitações e próximos passos |

## Estrutura de pastas

```
index.html           Início
simulacao.html       Simulação
fila.html            Entrar na fila
sobre.html           Sobre
css/style.css        Estilos (mobile-first, Flex/Grid, media queries 768px e 1024px)
js/dados.js          Agenda (12 horários) e fila (15 pacientes): arrays de objetos
js/simulacao.js      Regra de realocação e renderização via DOM
js/formulario.js     Validação inline e cadastro
js/persistencia.js   [extra] Salva os cadastros no navegador (localStorage)
js/acessibilidade.js Painel: alto contraste, tamanho do texto e [extra] voz
```

## Como decidimos para quem vai a vaga

Quando um horário é liberado ou o paciente falta, o sistema olha a fila da **mesma especialidade** e descarta quem não pode ir:

1. **Período:** a pessoa precisa ter disponibilidade de manhã ou de tarde, conforme o horário.
2. **Chega a tempo:**
   - **Liberou na véspera (D-1):** aceita quem mora a até 60 min da unidade.
   - **Faltou no dia:** o paciente pode chegar até 30 min depois do horário e precisa de 10 min para receber o aviso e sair de casa. Então só entra quem mora a até 20 min.

Entre quem sobra, cada pessoa recebe pontos:

```
pontos = peso do risco + 1 ponto a cada 10 dias de espera (máximo de 40)
peso do risco: vermelho 100 · amarelo 60 · verde 30 · azul 10
```

Ganha quem tiver mais pontos. No empate, ganha quem espera há mais dias. Se ninguém chegar a tempo, o horário vira **encaixe livre**.

A tela mostra o motivo da escolha e, em "Ver quem foi descartado e por quê", cada pessoa que ficou de fora com o motivo.

**Exemplo:** às 08:00 (Cardiologia), o paciente faltou. João Batista tem risco vermelho, mas mora a 45 min e não chegaria a tempo. A vaga vai para Maria Aparecida: risco amarelo, 210 dias de espera, 15 min da unidade, 81 pontos.

## Tecnologias

Somente **HTML, CSS e JavaScript puros**. Sem framework, biblioteca ou etapa de build. As fontes (Atkinson Hyperlegible e Bricolage Grotesque) vêm do Google Fonts via `<link>`.

## Recursos nativos além do conteúdo da fase

Dois recursos do próprio navegador foram usados fora do conteúdo visto até a Fase 4. Eles ficam isolados e são opcionais: **o site funciona 100% sem eles**. Os outros scripts testam se as funções existem antes de chamar (por exemplo, `if (typeof vqvLerCadastros === "function")`).

| Recurso | Onde | Para quê | Sem ele |
|---|---|---|---|
| `localStorage` | `js/persistencia.js` e preferências em `js/acessibilidade.js` | Guardar os cadastros do formulário e as preferências de contraste e fonte entre as páginas | O cadastro fica só na memória da página e as preferências valem até recarregar |
| `speechSynthesis` (texto para voz) | `js/acessibilidade.js` | "Ouvir esta página" e "Narrar realocações" | Os itens de voz não aparecem no painel; o resto continua |

## Acessibilidade

- Link "Pular para o conteúdo" em todas as páginas.
- HTML semântico (`header`, `nav`, `main`, `section`, `footer`) e um `h1` por página. O menu marca a página atual com `aria-current="page"`.
- Toda a agenda funciona pelo teclado, com foco visível. Depois de cada ação, o foco vai para o horário que mudou.
- Cada realocação é anunciada para leitores de tela (`aria-live="polite"`).
- O risco aparece sempre em texto e com um ícone de forma diferente (▲ vermelho, ◆ amarelo, ● verde, ■ azul), nunca só pela cor.
- Formulário com `label` em todos os campos, erros na própria página ligados por `aria-describedby`, resumo de erros no topo e foco no primeiro campo com erro. Sem `alert()`.
- Painel de acessibilidade (botão no canto inferior direito):
  - Ouvir esta página
  - Narrar realocações (na simulação)
  - Alto contraste
  - Tamanho do texto: 100%, 115% e 130%
- Contraste mínimo de 4.5:1 nas cores do site.
- Quem configurou o sistema para reduzir animações não vê a animação do Início.

## Limitações desta POC

- Os dados são fictícios e ficam no próprio navegador. Não há servidor, login nem envio real de WhatsApp.
- A classificação de risco de quem se cadastra é sorteada. Na vida real, ela vem do encaminhamento da UBS.
- O tempo até a unidade é informado pela própria pessoa, em faixas.
