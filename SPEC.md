# Vaga que Volta — especificação por etapas (para o Claude Code)

Leia o `CLAUDE.md` antes. Execute **uma etapa por vez**. Ao final de cada etapa, faça commit, push e me mostre o que testar.

---

## Etapa 0 — Repositório (13/11)
1. `git init` em uma pasta `vaga-que-volta`, com `CLAUDE.md` e `SPEC.md` na raiz.
2. Criar o repo público `vaga-que-volta` no GitHub (`gh repo create`) e fazer o primeiro push.
3. Ativar o GitHub Pages (branch `main`, raiz) e me passar a URL.

## Etapa 1 — Base: 4 páginas, menu e CSS (13/11)
Use a skill **frontend-design** com a paleta do `CLAUDE.md` (creme + verde, minimalista).
- Criar as 4 páginas com o mesmo `header` e `nav` (Início · Simulação · Entrar na fila · Sobre). A página atual leva `aria-current="page"`.
- Em todas: link "Pular para o conteúdo", `main id="conteudo"`, `footer` com "Bug Hunters · FIAP 1ESOR · Global Solution 2026/2".
- Em `css/style.css`: variáveis em `:root`, layout mobile-first com Flex/Grid, media queries para 768px e 1024px, foco visível e classes para os selos de risco.
- Classe `body.alto-contraste` e variável de tamanho de fonte prontas para a Etapa 4.
- As páginas podem ter conteúdo provisório, mas já com os títulos finais.

**Início (`index.html`)**
- Hero: "Cadeira vazia no consultório é fila parada lá fora."
- Destaque do dado (45.607 consultas perdidas em 2025 em Porto Alegre, cerca de 13%), com a fonte em link.
- "O problema" em 1 parágrafo.
- "Como funciona" em 3 passos: (1) o paciente confirma ou libera a vaga no dia anterior; (2) a vaga liberada ou perdida volta para o sistema; (3) ela vai para quem está na fila e consegue chegar a tempo.
- Botão principal "Ver a simulação" e botão secundário "Entrar na fila".

**Sobre (`sobre.html`)**: seções Equipe (nomes e RMs), O que ouvimos (entrevistas), Como decidimos para quem vai a vaga, Limitações desta POC e Próximos passos. Pode ficar com placeholders `[ ]`.

---

## Etapa 2 — Dados e simulação (14/11)

### `js/dados.js`
```js
const UNIDADE = "Ambulatório de Especialidades Centro (fictício) — Porto Alegre";

const PESO_RISCO = { vermelho: 100, amarelo: 60, verde: 30, azul: 10 };
const TOLERANCIA_ATRASO_MIN = 30;   // paciente pode chegar até 30 min após o horário
const TEMPO_RESPOSTA_MIN = 10;      // tempo para receber o aviso e sair de casa
const LIMITE_D1_MIN = 60;           // no D-1, aceita quem mora até 60 min

// 12 horários. periodo: "manha" | "tarde"
// status: "aguardando" | "confirmado" | "liberado" | "faltou" | "reaproveitado" | "encaixe"
const agenda = [
  { id: 1,  hora: "08:00", periodo: "manha", especialidade: "Cardiologia",   paciente: "Valdir Gomes",      status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 2,  hora: "08:30", periodo: "manha", especialidade: "Ortopedia",     paciente: "Neusa Carvalho",    status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 3,  hora: "09:00", periodo: "manha", especialidade: "Oftalmologia",  paciente: "Ivone Teixeira",    status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 4,  hora: "09:30", periodo: "manha", especialidade: "Cardiologia",   paciente: "Osvaldo Reis",      status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 5,  hora: "10:00", periodo: "manha", especialidade: "Ortopedia",     paciente: "Marlene Barbosa",   status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 6,  hora: "10:30", periodo: "manha", especialidade: "Oftalmologia",  paciente: "Gilberto Moura",    status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 7,  hora: "14:00", periodo: "tarde", especialidade: "Cardiologia",   paciente: "Cleusa Andrade",    status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 8,  hora: "14:30", periodo: "tarde", especialidade: "Ortopedia",     paciente: "Edson Farias",      status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 9,  hora: "15:00", periodo: "tarde", especialidade: "Oftalmologia",  paciente: "Zilda Monteiro",    status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 10, hora: "15:30", periodo: "tarde", especialidade: "Cardiologia",   paciente: "Arlindo Castro",    status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 11, hora: "16:00", periodo: "tarde", especialidade: "Ortopedia",     paciente: "Dalva Pereira",     status: "aguardando", recebidoPor: null, motivo: "" },
  { id: 12, hora: "16:30", periodo: "tarde", especialidade: "Oftalmologia",  paciente: "Wilson Batista",    status: "aguardando", recebidoPor: null, motivo: "" }
];

// 15 pacientes na fila de reaproveitamento. periodos: ["manha"], ["tarde"] ou os dois
const filaInicial = [
  { id: 101, nome: "Maria Aparecida",  bairro: "Partenon",          especialidade: "Cardiologia",  risco: "amarelo",  diasEspera: 210, minutosAteUnidade: 15, periodos: ["manha","tarde"], status: "na fila" },
  { id: 102, nome: "João Batista",     bairro: "Restinga",          especialidade: "Cardiologia",  risco: "vermelho", diasEspera: 95,  minutosAteUnidade: 45, periodos: ["manha"],         status: "na fila" },
  { id: 103, nome: "Sônia Ribeiro",    bairro: "Menino Deus",       especialidade: "Cardiologia",  risco: "verde",    diasEspera: 320, minutosAteUnidade: 10, periodos: ["tarde"],         status: "na fila" },
  { id: 104, nome: "Carlos Eduardo",   bairro: "Sarandi",           especialidade: "Cardiologia",  risco: "azul",     diasEspera: 400, minutosAteUnidade: 35, periodos: ["manha","tarde"], status: "na fila" },
  { id: 105, nome: "Rosângela Pires",  bairro: "Azenha",            especialidade: "Cardiologia",  risco: "vermelho", diasEspera: 60,  minutosAteUnidade: 12, periodos: ["tarde"],         status: "na fila" },
  { id: 106, nome: "Antônio Souza",    bairro: "Cidade Baixa",      especialidade: "Ortopedia",    risco: "verde",    diasEspera: 280, minutosAteUnidade: 8,  periodos: ["manha"],         status: "na fila" },
  { id: 107, nome: "Lúcia Fernandes",  bairro: "Lomba do Pinheiro", especialidade: "Ortopedia",    risco: "amarelo",  diasEspera: 190, minutosAteUnidade: 50, periodos: ["manha","tarde"], status: "na fila" },
  { id: 108, nome: "Pedro Henrique",   bairro: "Santana",           especialidade: "Ortopedia",    risco: "amarelo",  diasEspera: 150, minutosAteUnidade: 18, periodos: ["manha","tarde"], status: "na fila" },
  { id: 109, nome: "Francisca Lima",   bairro: "Rubem Berta",       especialidade: "Ortopedia",    risco: "verde",    diasEspera: 365, minutosAteUnidade: 40, periodos: ["tarde"],         status: "na fila" },
  { id: 110, nome: "Diego Martins",    bairro: "Glória",            especialidade: "Ortopedia",    risco: "azul",     diasEspera: 120, minutosAteUnidade: 20, periodos: ["tarde"],         status: "na fila" },
  { id: 111, nome: "Terezinha Costa",  bairro: "Petrópolis",        especialidade: "Oftalmologia", risco: "amarelo",  diasEspera: 240, minutosAteUnidade: 14, periodos: ["manha"],         status: "na fila" },
  { id: 112, nome: "Jorge Almeida",    bairro: "Bom Jesus",         especialidade: "Oftalmologia", risco: "vermelho", diasEspera: 80,  minutosAteUnidade: 25, periodos: ["manha","tarde"], status: "na fila" },
  { id: 113, nome: "Ana Paula Rocha",  bairro: "Cristal",           especialidade: "Oftalmologia", risco: "verde",    diasEspera: 300, minutosAteUnidade: 30, periodos: ["tarde"],         status: "na fila" },
  { id: 114, nome: "Raimundo Nunes",   bairro: "Vila Nova",         especialidade: "Oftalmologia", risco: "azul",     diasEspera: 410, minutosAteUnidade: 45, periodos: ["tarde"],         status: "na fila" },
  { id: 115, nome: "Helena Duarte",    bairro: "Navegantes",        especialidade: "Oftalmologia", risco: "amarelo",  diasEspera: 170, minutosAteUnidade: 9,  periodos: ["manha"],         status: "na fila" }
];
```
Todos os nomes são fictícios. A página deve dizer isso.

### Regra de realocação (`js/simulacao.js`)
Funções puras, cada uma com comentário:
1. `elegivel(paciente, horario, gatilho)` devolve true quando:
   - `paciente.status === "na fila"`;
   - a especialidade é igual;
   - `paciente.periodos` inclui `horario.periodo`;
   - **chega a tempo:**
     - gatilho `"liberado"` (D-1): `minutosAteUnidade <= LIMITE_D1_MIN`;
     - gatilho `"faltou"` (no dia): `minutosAteUnidade + TEMPO_RESPOSTA_MIN <= TOLERANCIA_ATRASO_MIN`, ou seja, até 20 min.
2. `pontuar(paciente)` = `PESO_RISCO[risco] + Math.min(Math.floor(diasEspera / 10), 40)`.
3. `escolher(horario, gatilho)` filtra os elegíveis com um laço `for`, pega a maior pontuação e desempata por mais dias de espera. Devolve `{ paciente, pontos, descartados }`, em que `descartados` lista quem foi eliminado e por quê ("mora a 45 min", "só tem tarde").
4. `realocar(idHorario, gatilho)`:
   - **com escolhido:** horário fica `reaproveitado`, `recebidoPor` recebe o nome, o paciente fica com status `agendado` e `motivo` = "Maria Aparecida · risco amarelo · 210 dias de espera · 15 min da unidade · 81 pontos";
   - **sem escolhido:** horário fica `encaixe`, com motivo "Ninguém da fila chega a tempo (todos a mais de 20 min)";
   - em seguida: incrementa o contador, adiciona ao histórico, anuncia (ver abaixo) e renderiza de novo.

### Interface da simulação (`simulacao.html`)
- Topo: nome da unidade, data "Hoje", contador **"Vagas recuperadas hoje: N"** e botão **"Reiniciar demonstração"**.
- **Agenda** (grid de cartões, 12 itens): hora, especialidade, paciente, selo de status e três botões: `Confirmar` · `Liberar (D-1)` · `Faltou`. Os botões somem quando o status deixa de ser aguardando ou confirmado. Um cartão reaproveitado mostra "↻ Vaga foi para: Maria Aparecida" com o motivo.
- **Fila** (lista lateral; abaixo no celular): nome, bairro, especialidade, selo de risco (texto + ícone), dias de espera e minutos até a unidade. Filtro por especialidade com `select`. Quem já foi agendado sai da fila com destaque breve.
- **Histórico** ("Por que essa pessoa?"): a cada realocação, um item com o escolhido, a pontuação e um `<details>` "Ver quem foi descartado e por quê".
- Região `<div id="anuncios" aria-live="polite" class="sr-only">`. A cada realocação, o texto é escrito ali e, **se existir**, chama `window.vqvNarrar(texto)`.
- Reiniciar recarrega a agenda e a fila a partir dos dados iniciais (mais os cadastros, ver Etapa 3).

### Cenários que precisam funcionar (teste antes do commit)
| Ação | Resultado esperado |
|---|---|
| Faltou às 08:00 (Cardiologia, manhã) | Maria Aparecida (amarelo, 15 min) — João Batista é vermelho, mas mora a 45 min |
| Liberar D-1 às 08:00 | João Batista (vermelho, 45 min ≤ 60) |
| Faltou às 09:00 (Oftalmo, manhã) | Terezinha Costa (84 pts) vence Helena Duarte (77 pts) |
| Faltou às 15:00 (Oftalmo, tarde) | **Encaixe livre**: todos a mais de 20 min |
| Liberar D-1 às 15:00 | Jorge Almeida (vermelho) |

---

## Etapa 3 — Formulário e cadastro (15/11)

### `fila.html` + `js/formulario.js`
Campos (todos com `label`; erros em `<p class="erro" id="...">` ligados por `aria-describedby`, **sem `alert()`**):
- Nome completo: obrigatório, mínimo de 2 palavras.
- WhatsApp: obrigatório, apenas dígitos após limpar a máscara, 10 ou 11 dígitos.
- Bairro: obrigatório.
- Tempo até a unidade (`select`): Até 15 min → 15 · Até 30 min → 30 · Até 60 min → 60.
- Especialidade (`select`): Cardiologia, Ortopedia ou Oftalmologia.
- Períodos disponíveis (checkboxes Manhã/Tarde): pelo menos 1.
- Consentimento (checkbox obrigatório): "Aceito ser avisado(a) por WhatsApp quando uma vaga abrir".

Comportamento:
- Valida ao enviar e ao sair de cada campo (`blur`). O foco vai para o primeiro campo com erro e um resumo de erros aparece no topo.
- Aviso fixo: "Na vida real, sua classificação de risco vem do encaminhamento da sua UBS. Nesta demonstração, ela é sorteada."
- Ao enviar com sucesso: monta o objeto no mesmo formato da fila (`id` = `Date.now()`, risco sorteado entre amarelo e verde, `diasEspera` sorteado entre 60 e 300, `minutosAteUnidade` da faixa, `status` "na fila" e `cadastroDoUsuario: true`).
- Se `vqvSalvarCadastro` existir, chama essa função. Senão, guarda em um array em memória.
- Mostra a confirmação na própria página: "Você entrou na fila de reaproveitamento de Cardiologia" + o risco e a espera sorteados + o link "Ver você na simulação →".

### `js/persistencia.js` [extra]
```js
// Recurso nativo do navegador (localStorage), além do conteúdo da fase.
// O site funciona sem este arquivo.
function vqvSalvarCadastro(p) { /* lê 'vqv:cadastros', faz push e salva com try/catch */ }
function vqvLerCadastros()   { /* devolve um array (vazio em caso de erro) */ }
function vqvLimparCadastros(){ /* remove a chave */ }
```
Na simulação, `filaInicial` + `vqvLerCadastros()` (se existir) formam a fila. Os cadastros do usuário aparecem com o selo **"Você"**. O Reiniciar mantém os cadastros. Um link pequeno "Apagar meus cadastros" chama `vqvLimparCadastros`.

---

## Etapa 4 — Painel de acessibilidade e voz (16/11)

### `js/acessibilidade.js` (carregado em todas as páginas)
- Botão fixo no canto inferior direito ("Acessibilidade", ícone + texto, `aria-expanded`, `aria-controls`) que abre um painel com:
  1. **Ouvir esta página**: lê os títulos e parágrafos do `main` com `speechSynthesis`, voz `pt-BR`. O botão alterna para "Parar".
  2. **Narrar realocações** (só aparece se existir `#anuncios`): liga ou desliga. Quando ligado, `window.vqvNarrar = texto => fala(texto)`.
  3. **Alto contraste**: alterna `body.alto-contraste`.
  4. **Fonte A− / A+**: 3 níveis (100%, 115%, 130%).
- O painel fecha com `Esc` e devolve o foco ao botão.
- Se `speechSynthesis` não existir, os itens de voz somem e os outros continuam.
- As preferências de contraste e fonte ficam em localStorage (`vqv:prefs`), sempre com try/catch.

---

## Etapa 5 — Conteúdo final, README e publicação (16/11)
- Inserir os textos finais (Início e Sobre) que o grupo enviar. Conferir o link da fonte do dado.
- `README.md` com: nome e frase do produto; problema + dado + fonte; integrantes e RMs; link do site (GitHub Pages); link do pitch; como rodar (abrir o `index.html`); estrutura de pastas; regra de decisão; tecnologias (HTML, CSS e JS puros); seção **"Recursos nativos além do conteúdo da fase"** (localStorage e speechSynthesis, isolados e opcionais); e acessibilidade.
- Rodar o checklist do edital (tabela abaixo) e me listar o que está faltando.
- Validar o HTML (sem erros no validator do W3C) e testar em largura de 360px.

### Checklist do edital (site, 15 pts)
| Requisito | Pts | Onde |
|---|---|---|
| Simulação interativa (array de 10+ objetos via DOM) | 4 | simulacao.html |
| Página inicial com problema, dado e fonte | 2 | index.html |
| Navegação: 4 páginas, menu igual | 2 | todas |
| Formulário validado sem alert() | 2 | fila.html |
| Responsividade | 2 | style.css |
| Acessibilidade | 2 | todas + painel |
| Código e README | 1 | repo |
