// ==========================================================
// Vaga que Volta — simulação
// Regra de realocação (funções puras) + renderização da agenda,
// da fila e do histórico. Depende de js/dados.js.
// ==========================================================

// ---------- Estado da demonstração ----------
// Trabalhamos com cópias dos dados iniciais para o "Reiniciar" funcionar.
let estadoAgenda = [];
let estadoFila = [];
let historico = [];
let vagasRecuperadas = 0;
let idEmDestaque = null;   // paciente que acabou de sair da fila
let idParaFocar = null;    // horário que recebe o foco depois de renderizar

const NOME_PERIODO = { manha: "manhã", tarde: "tarde" };
const ICONE_RISCO = { vermelho: "▲", amarelo: "◆", verde: "●", azul: "■" };
const ROTULO_STATUS = {
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  reaproveitado: "Vaga reaproveitada",
  encaixe: "Encaixe livre"
};

// Copia um objeto, propriedade por propriedade.
function copiarObjeto(objeto) {
  const copia = {};
  for (const chave in objeto) {
    copia[chave] = objeto[chave];
  }
  return copia;
}

// Copia uma lista de objetos, para não alterar os dados originais.
function copiarLista(lista) {
  const copia = [];
  for (let i = 0; i < lista.length; i++) {
    copia.push(copiarObjeto(lista[i]));
  }
  return copia;
}

// Monta o estado inicial: agenda + fila + cadastros feitos na página "Entrar na fila".
function iniciarEstado() {
  estadoAgenda = copiarLista(agenda);
  estadoFila = copiarLista(filaInicial);

  // Recurso extra (js/persistencia.js). Se o arquivo não existir, a fila segue só com os dados iniciais.
  if (typeof vqvLerCadastros === "function") {
    const cadastros = vqvLerCadastros();
    for (let i = 0; i < cadastros.length; i++) {
      const cadastro = copiarObjeto(cadastros[i]);
      cadastro.status = "na fila";
      estadoFila.push(cadastro);
    }
  }

  historico = [];
  vagasRecuperadas = 0;
  idEmDestaque = null;
}

// ---------- Regra de realocação (funções puras) ----------

// true quando o paciente pode ir no período ("manha" ou "tarde").
function temPeriodo(paciente, periodo) {
  for (let i = 0; i < paciente.periodos.length; i++) {
    if (paciente.periodos[i] === periodo) {
      return true;
    }
  }
  return false;
}

// Explica por que um paciente da mesma especialidade não pode receber o horário.
// Devolve "" quando ele pode.
function motivoDescarte(paciente, horario, gatilho) {
  if (!temPeriodo(paciente, horario.periodo)) {
    return "só tem " + NOME_PERIODO[paciente.periodos[0]];
  }
  if (gatilho === "liberado" && paciente.minutosAteUnidade > LIMITE_D1_MIN) {
    return "mora a " + paciente.minutosAteUnidade + " min (limite na véspera: " + LIMITE_D1_MIN + " min)";
  }
  const limiteNoDia = TOLERANCIA_ATRASO_MIN - TEMPO_RESPOSTA_MIN;
  if (gatilho === "faltou" && paciente.minutosAteUnidade + TEMPO_RESPOSTA_MIN > TOLERANCIA_ATRASO_MIN) {
    return "mora a " + paciente.minutosAteUnidade + " min (limite no dia: " + limiteNoDia + " min)";
  }
  return "";
}

// true quando o paciente pode receber o horário:
// está na fila, é da mesma especialidade, tem o período e chega a tempo.
// "liberado" (D-1): mora até LIMITE_D1_MIN.
// "faltou" (no dia): minutos + TEMPO_RESPOSTA_MIN <= TOLERANCIA_ATRASO_MIN, ou seja, até 20 min.
function elegivel(paciente, horario, gatilho) {
  if (paciente.status !== "na fila") {
    return false;
  }
  if (paciente.especialidade !== horario.especialidade) {
    return false;
  }
  return motivoDescarte(paciente, horario, gatilho) === "";
}

// Pontuação: peso do risco + 1 ponto a cada 10 dias de espera (no máximo 40).
function pontuar(paciente) {
  return PESO_RISCO[paciente.risco] + Math.min(Math.floor(paciente.diasEspera / 10), 40);
}

// Escolhe quem recebe o horário: maior pontuação; no empate, mais dias de espera.
// Devolve { paciente, pontos, descartados }, em que descartados = [{ nome, motivo }].
function escolher(horario, gatilho) {
  let escolhido = null;
  let melhoresPontos = 0;
  const descartados = [];
  const elegiveis = [];

  for (let i = 0; i < estadoFila.length; i++) {
    const paciente = estadoFila[i];
    if (paciente.status !== "na fila" || paciente.especialidade !== horario.especialidade) {
      continue;
    }
    if (!elegivel(paciente, horario, gatilho)) {
      descartados.push({ nome: paciente.nome, motivo: motivoDescarte(paciente, horario, gatilho) });
      continue;
    }

    const pontos = pontuar(paciente);
    elegiveis.push({ paciente: paciente, pontos: pontos });

    const ganhaNosPontos = pontos > melhoresPontos;
    const ganhaNoEmpate = pontos === melhoresPontos && escolhido !== null && paciente.diasEspera > escolhido.diasEspera;
    if (escolhido === null || ganhaNosPontos || ganhaNoEmpate) {
      escolhido = paciente;
      melhoresPontos = pontos;
    }
  }

  // Quem podia, mas fez menos pontos, também aparece na explicação.
  for (let i = 0; i < elegiveis.length; i++) {
    if (elegiveis[i].paciente !== escolhido) {
      descartados.push({
        nome: elegiveis[i].paciente.nome,
        motivo: elegiveis[i].pontos + " pontos, menos que os " + melhoresPontos + " do escolhido"
      });
    }
  }

  return { paciente: escolhido, pontos: melhoresPontos, descartados: descartados };
}

// ---------- Ações ----------

function buscarHorario(idHorario) {
  for (let i = 0; i < estadoAgenda.length; i++) {
    if (estadoAgenda[i].id === idHorario) {
      return estadoAgenda[i];
    }
  }
  return null;
}

function estaAberto(horario) {
  return horario.status === "aguardando" || horario.status === "confirmado";
}

function confirmar(idHorario) {
  const horario = buscarHorario(idHorario);
  if (horario === null || horario.status !== "aguardando") {
    return;
  }
  horario.status = "confirmado";
  anunciar(horario.hora + ": " + horario.paciente + " confirmou a consulta.");
  idParaFocar = idHorario;
  renderizar();
}

// Libera (D-1) ou registra a falta (no dia) e entrega o horário a alguém da fila.
function realocar(idHorario, gatilho) {
  const horario = buscarHorario(idHorario);
  if (horario === null || !estaAberto(horario)) {
    return;
  }

  horario.gatilho = gatilho;
  const resultado = escolher(horario, gatilho);
  const oQueHouve = gatilho === "faltou" ? " faltou" : " liberou a vaga na véspera";
  let texto = "";

  if (resultado.paciente !== null) {
    const p = resultado.paciente;
    horario.status = "reaproveitado";
    horario.recebidoPor = p.nome;
    horario.motivo = p.nome + " · risco " + p.risco + " · " + p.diasEspera + " dias de espera · " +
      p.minutosAteUnidade + " min da unidade · " + resultado.pontos + " pontos";
    p.status = "agendado";
    p.horaAgendada = horario.hora;
    vagasRecuperadas++;
    idEmDestaque = p.id;
    texto = horario.hora + ", " + horario.especialidade + ": " + horario.paciente + oQueHouve +
      ". A vaga foi para " + p.nome + ", risco " + p.risco + ", " + resultado.pontos + " pontos.";
  } else {
    const limite = gatilho === "faltou" ? TOLERANCIA_ATRASO_MIN - TEMPO_RESPOSTA_MIN : LIMITE_D1_MIN;
    horario.status = "encaixe";
    horario.motivo = "Ninguém da fila chega a tempo (todos a mais de " + limite + " min)";
    texto = horario.hora + ", " + horario.especialidade + ": " + horario.paciente + oQueHouve +
      ". Ninguém da fila chega a tempo. O horário fica como encaixe livre.";
  }

  historico.unshift({
    hora: horario.hora,
    especialidade: horario.especialidade,
    pacienteOriginal: horario.paciente,
    gatilho: gatilho,
    escolhido: resultado.paciente,
    pontos: resultado.pontos,
    motivo: horario.motivo,
    descartados: resultado.descartados
  });

  anunciar(texto);
  idParaFocar = idHorario;
  renderizar();

  // O paciente agendado fica destacado na fila por alguns segundos e depois sai.
  if (resultado.paciente !== null) {
    const idSaindo = resultado.paciente.id;
    setTimeout(function () {
      if (idEmDestaque === idSaindo) {
        idEmDestaque = null;
        renderizarFila();
      }
    }, 3000);
  }
}

function reiniciar() {
  iniciarEstado();
  renderizar();
  anunciar("Demonstração reiniciada. Todos os horários voltaram a aguardar.");
}

// Escreve na região aria-live e, se o painel de acessibilidade estiver narrando, fala o texto.
function anunciar(texto) {
  const regiao = document.querySelector("#anuncios");
  regiao.textContent = "";
  setTimeout(function () {
    regiao.textContent = texto;
  }, 50);
  if (typeof window.vqvNarrar === "function") {
    window.vqvNarrar(texto);
  }
}

// ---------- Renderização ----------

// Atalho para criar um elemento com classe e texto.
function criar(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) {
    elemento.className = classe;
  }
  if (texto !== undefined) {
    elemento.textContent = texto;
  }
  return elemento;
}

function criarSeloRisco(risco) {
  const selo = criar("span", "selo selo--" + risco);
  const icone = criar("span", "selo-icone", ICONE_RISCO[risco]);
  icone.setAttribute("aria-hidden", "true");
  selo.appendChild(icone);
  selo.appendChild(document.createTextNode(" Risco " + risco));
  return selo;
}

function criarBotao(texto, rotuloCompleto, aoClicar) {
  const botao = criar("button", "botao botao--secundario botao--pequeno", texto);
  botao.type = "button";
  botao.setAttribute("aria-label", rotuloCompleto);
  botao.addEventListener("click", aoClicar);
  return botao;
}

function criarCartaoHorario(horario) {
  const cartao = criar("article", "horario-cartao horario-cartao--" + horario.status);

  const topo = criar("div", "horario-cartao-topo");
  const hora = criar("h4", "horario-cartao-hora", horario.hora);
  hora.id = "horario-" + horario.id;
  hora.tabIndex = -1;
  topo.appendChild(hora);
  topo.appendChild(criar("span", "selo selo--" + horario.status, ROTULO_STATUS[horario.status]));
  cartao.appendChild(topo);

  cartao.appendChild(criar("p", "horario-cartao-especialidade", horario.especialidade));

  if (estaAberto(horario)) {
    cartao.appendChild(criar("p", "horario-cartao-paciente", horario.paciente));

    const acoes = criar("div", "horario-cartao-acoes");
    const descricao = horario.hora + ", " + horario.paciente;
    if (horario.status === "aguardando") {
      acoes.appendChild(criarBotao("Confirmar", "Confirmar " + descricao, function () {
        confirmar(horario.id);
      }));
    }
    acoes.appendChild(criarBotao("Liberar (D-1)", "Liberar na véspera " + descricao, function () {
      realocar(horario.id, "liberado");
    }));
    acoes.appendChild(criarBotao("Faltou", "Registrar falta " + descricao, function () {
      realocar(horario.id, "faltou");
    }));
    cartao.appendChild(acoes);
  } else {
    const original = criar("p", "horario-cartao-original");
    original.appendChild(criar("s", "", horario.paciente));
    original.appendChild(document.createTextNode(horario.gatilho === "faltou" ? " faltou" : " liberou na véspera"));
    cartao.appendChild(original);

    if (horario.status === "reaproveitado") {
      const recebido = criar("p", "horario-cartao-recebido");
      const seta = criar("span", "", "↻ ");
      seta.setAttribute("aria-hidden", "true");
      recebido.appendChild(seta);
      recebido.appendChild(document.createTextNode("Vaga foi para: "));
      recebido.appendChild(criar("strong", "", horario.recebidoPor));
      cartao.appendChild(recebido);
    }
    cartao.appendChild(criar("p", "horario-cartao-motivo", horario.motivo));
  }

  return cartao;
}

function renderizarAgenda() {
  const grades = { manha: document.querySelector("#agenda-manha"), tarde: document.querySelector("#agenda-tarde") };
  grades.manha.textContent = "";
  grades.tarde.textContent = "";

  for (let i = 0; i < estadoAgenda.length; i++) {
    const horario = estadoAgenda[i];
    grades[horario.periodo].appendChild(criarCartaoHorario(horario));
  }

  if (idParaFocar !== null) {
    const alvo = document.querySelector("#horario-" + idParaFocar);
    if (alvo) {
      alvo.focus();
    }
    idParaFocar = null;
  }
}

function criarItemFila(paciente) {
  const item = criar("li", "fila-item");
  if (paciente.status === "agendado") {
    item.classList.add("fila-item--saindo");
  }

  const linhaNome = criar("p", "fila-item-nome");
  linhaNome.appendChild(criar("strong", "", paciente.nome));
  if (paciente.cadastroDoUsuario) {
    linhaNome.appendChild(criar("span", "selo selo--voce", "Você"));
  }
  item.appendChild(linhaNome);

  item.appendChild(criar("p", "fila-item-local", paciente.bairro + ", " + paciente.especialidade));

  const linhaDados = criar("p", "fila-item-dados");
  linhaDados.appendChild(criarSeloRisco(paciente.risco));
  linhaDados.appendChild(criar("span", "", paciente.diasEspera + " dias de espera"));
  linhaDados.appendChild(criar("span", "", paciente.minutosAteUnidade + " min até a unidade"));
  item.appendChild(linhaDados);

  if (paciente.status === "agendado") {
    item.appendChild(criar("p", "fila-item-agendado", "Agendado para " + paciente.horaAgendada + ". Saindo da fila."));
  } else {
    item.appendChild(criar("p", "fila-item-pontos", pontuar(paciente) + " pontos"));
  }
  return item;
}

// true quando "a" deve aparecer antes de "b": mais pontos ou, no empate, mais dias de espera.
function vemAntes(a, b) {
  const pontosA = pontuar(a);
  const pontosB = pontuar(b);
  if (pontosA !== pontosB) {
    return pontosA > pontosB;
  }
  return a.diasEspera > b.diasEspera;
}

// Ordena por pontuação com inserção: cada paciente entra no fim e
// vai trocando de lugar com o anterior enquanto tiver prioridade sobre ele.
function ordenarPorPontos(pacientes) {
  const ordenados = [];
  for (let i = 0; i < pacientes.length; i++) {
    ordenados.push(pacientes[i]);
    let j = ordenados.length - 1;
    while (j > 0 && vemAntes(ordenados[j], ordenados[j - 1])) {
      const anterior = ordenados[j - 1];
      ordenados[j - 1] = ordenados[j];
      ordenados[j] = anterior;
      j--;
    }
  }
  return ordenados;
}

function renderizarFila() {
  const lista = document.querySelector("#fila");
  const filtro = document.querySelector("#filtro-especialidade").value;
  lista.textContent = "";

  // Mostra quem está na fila e, por alguns segundos, quem acabou de ser agendado.
  const visiveis = [];
  for (let i = 0; i < estadoFila.length; i++) {
    const p = estadoFila[i];
    const naFila = p.status === "na fila" || p.id === idEmDestaque;
    const passaNoFiltro = filtro === "todas" || p.especialidade === filtro;
    if (naFila && passaNoFiltro) {
      visiveis.push(p);
    }
  }

  // Maior pontuação primeiro: é a ordem em que a regra olha a fila.
  const ordenados = ordenarPorPontos(visiveis);

  for (let i = 0; i < ordenados.length; i++) {
    lista.appendChild(criarItemFila(ordenados[i]));
  }

  let quantidade = 0;
  for (let i = 0; i < visiveis.length; i++) {
    if (visiveis[i].status === "na fila") {
      quantidade++;
    }
  }
  document.querySelector("#fila-total").textContent =
    quantidade === 1 ? "1 pessoa esperando" : quantidade + " pessoas esperando";

  if (visiveis.length === 0) {
    lista.appendChild(criar("li", "fila-vazia", "Ninguém esperando nesta especialidade."));
  }
}

function renderizarHistorico() {
  const lista = document.querySelector("#historico");
  lista.textContent = "";

  if (historico.length === 0) {
    lista.appendChild(criar("li", "historico-vazio",
      "Nenhuma vaga voltou ainda. Marque uma falta ou uma liberação na agenda para ver a escolha explicada aqui."));
    return;
  }

  for (let i = 0; i < historico.length; i++) {
    const registro = historico[i];
    const item = criar("li", "historico-item");
    const oQueHouve = registro.gatilho === "faltou" ? " faltou" : " liberou na véspera";

    item.appendChild(criar("p", "historico-contexto",
      registro.hora + ", " + registro.especialidade + ": " + registro.pacienteOriginal + oQueHouve));

    const resultado = criar("p", "historico-resultado");
    if (registro.escolhido !== null) {
      resultado.appendChild(document.createTextNode("A vaga foi para "));
      resultado.appendChild(criar("strong", "", registro.escolhido.nome));
      resultado.appendChild(document.createTextNode(", com " + registro.pontos + " pontos."));
    } else {
      resultado.appendChild(document.createTextNode("Encaixe livre. " + registro.motivo + "."));
    }
    item.appendChild(resultado);

    if (registro.escolhido !== null) {
      item.appendChild(criar("p", "historico-motivo", registro.motivo));
    }

    const detalhes = criar("details", "historico-detalhes");
    detalhes.appendChild(criar("summary", "", "Ver quem foi descartado e por quê"));
    const descartes = criar("ul", "historico-descartes");
    if (registro.descartados.length === 0) {
      descartes.appendChild(criar("li", "", "Ninguém mais esperava por esta especialidade."));
    }
    for (let j = 0; j < registro.descartados.length; j++) {
      const linha = criar("li", "");
      linha.appendChild(criar("strong", "", registro.descartados[j].nome));
      linha.appendChild(document.createTextNode(": " + registro.descartados[j].motivo));
      descartes.appendChild(linha);
    }
    detalhes.appendChild(descartes);
    item.appendChild(detalhes);

    lista.appendChild(item);
  }
}

function renderizarResumo() {
  document.querySelector("#contador").textContent = vagasRecuperadas;
}

// O link "Apagar meus cadastros" só aparece se houver cadastros salvos (recurso extra).
function renderizarApagar() {
  const botao = document.querySelector("#apagar-cadastros");
  let temCadastros = false;
  if (typeof vqvLerCadastros === "function") {
    temCadastros = vqvLerCadastros().length > 0;
  }
  botao.hidden = !temCadastros;
}

function renderizar() {
  renderizarResumo();
  renderizarAgenda();
  renderizarFila();
  renderizarHistorico();
  renderizarApagar();
}

// Apaga os cadastros salvos e tira da fila quem ainda estava esperando.
function apagarCadastros() {
  if (typeof vqvLimparCadastros !== "function") {
    return;
  }
  vqvLimparCadastros();
  const filaRestante = [];
  for (let i = 0; i < estadoFila.length; i++) {
    const p = estadoFila[i];
    if (!(p.cadastroDoUsuario && p.status === "na fila")) {
      filaRestante.push(p);
    }
  }
  estadoFila = filaRestante;
  renderizar();
  anunciar("Seus cadastros foram apagados deste navegador.");
  document.querySelector("#filtro-especialidade").focus();
}

// ---------- Início ----------
function iniciarSimulacao() {
  document.querySelector("#unidade").textContent = UNIDADE;
  document.querySelector("#data-hoje").textContent = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  document.querySelector("#reiniciar").addEventListener("click", reiniciar);
  document.querySelector("#filtro-especialidade").addEventListener("change", renderizarFila);
  document.querySelector("#apagar-cadastros").addEventListener("click", apagarCadastros);

  iniciarEstado();
  renderizar();
}

iniciarSimulacao();
