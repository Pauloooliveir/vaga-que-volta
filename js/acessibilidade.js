// ==========================================================
// Vaga que Volta — painel de acessibilidade (todas as páginas)
// Alto contraste e tamanho da fonte usam só DOM e CSS.
// [extra] A voz usa speechSynthesis e as preferências usam localStorage,
// recursos nativos do navegador além do conteúdo da fase. Se não existirem,
// os itens de voz somem e o resto continua funcionando.
// ==========================================================

const NIVEIS_FONTE = [1, 1.15, 1.3];
const CHAVE_PREFERENCIAS = "vqv:prefs";
const temVoz = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

let nivelFonte = 0;
let altoContraste = false;
let lendoPagina = false;
let narrando = false;

// ---------- Preferências (localStorage, sempre com try/catch) ----------

function lerPreferencias() {
  try {
    const texto = localStorage.getItem(CHAVE_PREFERENCIAS);
    return texto ? JSON.parse(texto) : {};
  } catch (erro) {
    return {};
  }
}

function salvarPreferencias() {
  try {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ contraste: altoContraste, fonte: nivelFonte }));
  } catch (erro) {
    // Sem armazenamento: a preferência vale só até recarregar a página.
  }
}

// ---------- Voz (speechSynthesis) ----------

function escolherVoz() {
  const vozes = window.speechSynthesis.getVoices();
  let parecida = null;
  for (let i = 0; i < vozes.length; i++) {
    const idioma = vozes[i].lang.replace("_", "-");
    if (idioma === "pt-BR") {
      return vozes[i];
    }
    if (parecida === null && idioma.indexOf("pt") === 0) {
      parecida = vozes[i];
    }
  }
  return parecida;
}

function criarFala(texto) {
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.rate = 1;
  const voz = escolherVoz();
  if (voz !== null) {
    fala.voice = voz;
  }
  return fala;
}

// Fala um texto curto, interrompendo o que estiver sendo lido.
function fala(texto) {
  if (!temVoz) {
    return;
  }
  pararLeitura();
  window.speechSynthesis.speak(criarFala(texto));
}

// Junta os títulos e parágrafos visíveis do main, sem repetir trechos aninhados.
function coletarTextos() {
  const seletor = "h1, h2, h3, h4, p, li, dt, dd, legend";
  const elementos = document.querySelectorAll("main " + seletor.split(", ").join(", main "));
  const textos = [];

  for (let i = 0; i < elementos.length; i++) {
    const elemento = elementos[i];
    const pai = elemento.parentElement.closest(seletor);
    const escondido = elemento.closest("[hidden], .sr-only, [aria-hidden='true']") !== null ||
      elemento.getClientRects().length === 0;
    if (pai !== null || escondido) {
      continue;
    }
    const texto = elemento.textContent
      .replace(/[↻→▲◆●■]/g, "")
      .replace(/·/g, ",")
      .replace(/\s+/g, " ")
      .trim();
    if (texto !== "") {
      textos.push(texto);
    }
  }
  return textos;
}

function lerPagina() {
  const textos = coletarTextos();
  window.speechSynthesis.cancel();
  lendoPagina = true;
  atualizarBotaoOuvir();

  // Uma fala por trecho: textos longos em uma fala só costumam ser cortados.
  for (let i = 0; i < textos.length; i++) {
    const trecho = criarFala(textos[i]);
    if (i === textos.length - 1) {
      trecho.addEventListener("end", terminarLeitura);
    }
    trecho.addEventListener("error", terminarLeitura);
    window.speechSynthesis.speak(trecho);
  }
}

function pararLeitura() {
  window.speechSynthesis.cancel();
  terminarLeitura();
}

function terminarLeitura() {
  lendoPagina = false;
  atualizarBotaoOuvir();
}

function atualizarBotaoOuvir() {
  const botao = document.querySelector("#a11y-ouvir");
  if (botao) {
    botao.querySelector(".painel-a11y-acao").textContent = lendoPagina ? "Parar" : "Ouvir esta página";
  }
}

// ---------- Contraste e fonte ----------

function aplicarContraste() {
  document.body.classList.toggle("alto-contraste", altoContraste);
  marcarAlternancia("#a11y-contraste", altoContraste);
}

function aplicarFonte() {
  document.documentElement.style.setProperty("--escala-fonte", NIVEIS_FONTE[nivelFonte]);
  document.querySelector("#a11y-fonte-valor").textContent = Math.round(NIVEIS_FONTE[nivelFonte] * 100) + "%";
  document.querySelector("#a11y-diminuir").disabled = nivelFonte === 0;
  document.querySelector("#a11y-aumentar").disabled = nivelFonte === NIVEIS_FONTE.length - 1;
}

function marcarAlternancia(seletor, ligado) {
  const botao = document.querySelector(seletor);
  if (botao) {
    botao.setAttribute("aria-pressed", ligado ? "true" : "false");
    botao.querySelector(".painel-a11y-estado").textContent = ligado ? "Ligado" : "Desligado";
  }
}

function alternarNarracao() {
  narrando = !narrando;
  if (narrando) {
    window.vqvNarrar = function (texto) {
      fala(texto);
    };
    fala("Narração ligada. Cada vaga que voltar será falada em voz alta.");
  } else {
    window.vqvNarrar = undefined;
    pararLeitura();
  }
  marcarAlternancia("#a11y-narrar", narrando);
}

// ---------- Montagem do painel ----------

function criarNoPainel(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) {
    elemento.className = classe;
  }
  if (texto !== undefined) {
    elemento.textContent = texto;
  }
  return elemento;
}

function criarBotaoPainel(id, acao, detalhe, alternavel) {
  const botao = criarNoPainel("button", "painel-a11y-botao");
  botao.type = "button";
  botao.id = id;
  botao.appendChild(criarNoPainel("span", "painel-a11y-acao", acao));
  if (detalhe) {
    botao.appendChild(criarNoPainel("span", "painel-a11y-detalhe", detalhe));
  }
  if (alternavel) {
    botao.setAttribute("aria-pressed", "false");
    botao.appendChild(criarNoPainel("span", "painel-a11y-estado", "Desligado"));
  }
  return botao;
}

function criarIcone() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const cabeca = document.createElementNS(ns, "circle");
  cabeca.setAttribute("cx", "12");
  cabeca.setAttribute("cy", "4.5");
  cabeca.setAttribute("r", "2.2");
  const corpo = document.createElementNS(ns, "path");
  corpo.setAttribute("d", "M4 8.5l8 1.5 8-1.5M12 10v5m0 0l-3.5 6.5M12 15l3.5 6.5");
  svg.appendChild(cabeca);
  svg.appendChild(corpo);
  return svg;
}

function montarPainel() {
  const raiz = criarNoPainel("div", "a11y");

  const alternar = criarNoPainel("button", "a11y-alternar");
  alternar.type = "button";
  alternar.id = "a11y-alternar";
  alternar.setAttribute("aria-expanded", "false");
  alternar.setAttribute("aria-controls", "painel-acessibilidade");
  alternar.appendChild(criarIcone());
  alternar.appendChild(criarNoPainel("span", "", "Acessibilidade"));

  const painel = criarNoPainel("div", "painel-a11y");
  painel.id = "painel-acessibilidade";
  painel.hidden = true;
  painel.setAttribute("role", "group");
  painel.setAttribute("aria-labelledby", "painel-a11y-titulo");

  const titulo = criarNoPainel("p", "painel-a11y-titulo", "Acessibilidade");
  titulo.id = "painel-a11y-titulo";
  painel.appendChild(titulo);

  if (temVoz) {
    const ouvir = criarBotaoPainel("a11y-ouvir", "Ouvir esta página", "Lê os títulos e textos em voz alta", false);
    ouvir.addEventListener("click", function () {
      if (lendoPagina) {
        pararLeitura();
      } else {
        lerPagina();
      }
    });
    painel.appendChild(ouvir);

    if (document.querySelector("#anuncios")) {
      const narrar = criarBotaoPainel("a11y-narrar", "Narrar realocações", "Fala para quem cada vaga foi", true);
      narrar.addEventListener("click", alternarNarracao);
      painel.appendChild(narrar);
    }
  }

  const contraste = criarBotaoPainel("a11y-contraste", "Alto contraste", "Fundo preto e texto branco", true);
  contraste.addEventListener("click", function () {
    altoContraste = !altoContraste;
    aplicarContraste();
    salvarPreferencias();
  });
  painel.appendChild(contraste);

  const fonte = criarNoPainel("div", "painel-a11y-fonte");
  const rotulo = criarNoPainel("span", "painel-a11y-acao", "Tamanho do texto");
  rotulo.id = "a11y-fonte-rotulo";
  fonte.appendChild(rotulo);

  const controles = criarNoPainel("div", "painel-a11y-fonte-controles");
  controles.setAttribute("role", "group");
  controles.setAttribute("aria-labelledby", "a11y-fonte-rotulo");

  const diminuir = criarNoPainel("button", "painel-a11y-fonte-botao", "A−");
  diminuir.type = "button";
  diminuir.id = "a11y-diminuir";
  diminuir.setAttribute("aria-label", "Diminuir texto");

  const valor = criarNoPainel("output", "painel-a11y-fonte-valor", "100%");
  valor.id = "a11y-fonte-valor";
  valor.setAttribute("aria-live", "polite");

  const aumentar = criarNoPainel("button", "painel-a11y-fonte-botao", "A+");
  aumentar.type = "button";
  aumentar.id = "a11y-aumentar";
  aumentar.setAttribute("aria-label", "Aumentar texto");

  diminuir.addEventListener("click", function () {
    if (nivelFonte > 0) {
      nivelFonte--;
      aplicarFonte();
      salvarPreferencias();
    }
  });
  aumentar.addEventListener("click", function () {
    if (nivelFonte < NIVEIS_FONTE.length - 1) {
      nivelFonte++;
      aplicarFonte();
      salvarPreferencias();
    }
  });

  controles.appendChild(diminuir);
  controles.appendChild(valor);
  controles.appendChild(aumentar);
  fonte.appendChild(controles);
  painel.appendChild(fonte);

  raiz.appendChild(painel);
  raiz.appendChild(alternar);
  document.body.appendChild(raiz);

  // Abrir e fechar
  alternar.addEventListener("click", function () {
    if (painel.hidden) {
      abrirPainel();
    } else {
      fecharPainel(true);
    }
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && !painel.hidden) {
      fecharPainel(true);
    }
  });

  // Clique fora do painel fecha sem roubar o foco.
  document.addEventListener("click", function (evento) {
    if (!painel.hidden && !raiz.contains(evento.target)) {
      fecharPainel(false);
    }
  });
}

function abrirPainel() {
  const painel = document.querySelector("#painel-acessibilidade");
  painel.hidden = false;
  document.querySelector("#a11y-alternar").setAttribute("aria-expanded", "true");
  painel.querySelector("button").focus();
}

function fecharPainel(devolverFoco) {
  document.querySelector("#painel-acessibilidade").hidden = true;
  const alternar = document.querySelector("#a11y-alternar");
  alternar.setAttribute("aria-expanded", "false");
  if (devolverFoco) {
    alternar.focus();
  }
}

// ---------- Início ----------

function iniciarAcessibilidade() {
  const preferencias = lerPreferencias();
  altoContraste = preferencias.contraste === true;
  if (typeof preferencias.fonte === "number" && preferencias.fonte >= 0 && preferencias.fonte < NIVEIS_FONTE.length) {
    nivelFonte = preferencias.fonte;
  }

  montarPainel();
  aplicarContraste();
  aplicarFonte();

  if (temVoz) {
    // Algumas vozes só ficam disponíveis depois deste evento.
    window.speechSynthesis.addEventListener("voiceschanged", escolherVoz);
    // Para a leitura ao sair da página.
    window.addEventListener("pagehide", function () {
      window.speechSynthesis.cancel();
    });
  }
}

iniciarAcessibilidade();
