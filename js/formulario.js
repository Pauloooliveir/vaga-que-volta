// ==========================================================
// Vaga que Volta — formulário "Entrar na fila"
// Validação inline (sem alert), resumo de erros e cadastro.
// ==========================================================

// Usado quando js/persistencia.js não está presente.
const cadastrosEmMemoria = [];

const formulario = document.querySelector("#form-fila");
const camposTocados = {};

// ---------- Regras de validação ----------
// Cada função recebe o formulário e devolve a mensagem de erro, ou "" se estiver tudo certo.

function contarPalavras(texto) {
  const partes = texto.trim().split(" ");
  let total = 0;
  for (let i = 0; i < partes.length; i++) {
    if (partes[i] !== "") {
      total++;
    }
  }
  return total;
}

function somenteDigitos(texto) {
  let digitos = "";
  for (let i = 0; i < texto.length; i++) {
    if (texto[i] >= "0" && texto[i] <= "9") {
      digitos += texto[i];
    }
  }
  return digitos;
}

function periodosMarcados() {
  const marcados = [];
  const caixas = formulario.querySelectorAll("input[name='periodos']");
  for (let i = 0; i < caixas.length; i++) {
    if (caixas[i].checked) {
      marcados.push(caixas[i].value);
    }
  }
  return marcados;
}

const regras = [
  {
    campo: "nome",
    rotulo: "Nome completo",
    validar: function () {
      const valor = formulario.nome.value.trim();
      if (valor === "") {
        return "Escreva seu nome completo.";
      }
      if (contarPalavras(valor) < 2) {
        return "Escreva nome e sobrenome.";
      }
      return "";
    }
  },
  {
    campo: "whatsapp",
    rotulo: "WhatsApp",
    validar: function () {
      const digitos = somenteDigitos(formulario.whatsapp.value);
      if (digitos === "") {
        return "Escreva seu WhatsApp com DDD.";
      }
      if (digitos.length < 10 || digitos.length > 11) {
        return "O número precisa ter DDD e 8 ou 9 dígitos, como (51) 99999-1234.";
      }
      return "";
    }
  },
  {
    campo: "bairro",
    rotulo: "Bairro",
    validar: function () {
      return formulario.bairro.value.trim() === "" ? "Escreva o bairro onde você mora." : "";
    }
  },
  {
    campo: "tempo",
    rotulo: "Tempo até a unidade",
    validar: function () {
      return formulario.tempo.value === "" ? "Escolha quanto tempo você leva até a unidade." : "";
    }
  },
  {
    campo: "especialidade",
    rotulo: "Especialidade",
    validar: function () {
      return formulario.especialidade.value === "" ? "Escolha a especialidade do seu encaminhamento." : "";
    }
  },
  {
    campo: "periodos",
    rotulo: "Períodos",
    validar: function () {
      return periodosMarcados().length === 0 ? "Marque pelo menos um período: manhã ou tarde." : "";
    }
  },
  {
    campo: "consentimento",
    rotulo: "Aviso por WhatsApp",
    validar: function () {
      return formulario.consentimento.checked ? "" : "Para entrar na fila, aceite receber o aviso por WhatsApp.";
    }
  }
];

// Elementos que recebem aria-invalid e o foco de cada campo.
function elementosDoCampo(nomeCampo) {
  if (nomeCampo === "periodos") {
    return [document.querySelector("#periodo-manha"), document.querySelector("#periodo-tarde")];
  }
  return [document.querySelector("#" + nomeCampo)];
}

// Mostra ou limpa o erro de um campo. Devolve a mensagem.
function validarCampo(regra) {
  const mensagem = regra.validar();
  document.querySelector("#erro-" + regra.campo).textContent = mensagem;

  const elementos = elementosDoCampo(regra.campo);
  for (let i = 0; i < elementos.length; i++) {
    if (mensagem === "") {
      elementos[i].removeAttribute("aria-invalid");
    } else {
      elementos[i].setAttribute("aria-invalid", "true");
    }
  }
  return mensagem;
}

function buscarRegra(nomeCampo) {
  for (let i = 0; i < regras.length; i++) {
    if (regras[i].campo === nomeCampo) {
      return regras[i];
    }
  }
  return null;
}

// ---------- Resumo de erros ----------

function mostrarResumo(erros) {
  const resumo = document.querySelector("#resumo-erros");
  const lista = document.querySelector("#resumo-lista");
  lista.textContent = "";

  if (erros.length === 0) {
    resumo.hidden = true;
    return;
  }

  document.querySelector("#resumo-titulo").textContent =
    erros.length === 1 ? "Falta corrigir 1 campo" : "Falta corrigir " + erros.length + " campos";

  for (let i = 0; i < erros.length; i++) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const alvo = elementosDoCampo(erros[i].campo)[0];
    link.href = "#" + alvo.id;
    link.textContent = erros[i].rotulo + ": " + erros[i].mensagem;
    link.addEventListener("click", function (evento) {
      evento.preventDefault();
      alvo.focus();
    });
    item.appendChild(link);
    lista.appendChild(item);
  }
  resumo.hidden = false;
}

// Atualiza o resumo (se já estiver visível) depois de corrigir um campo.
function atualizarResumoSeVisivel() {
  if (document.querySelector("#resumo-erros").hidden) {
    return;
  }
  const erros = [];
  for (let i = 0; i < regras.length; i++) {
    const mensagem = regras[i].validar();
    if (mensagem !== "") {
      erros.push({ campo: regras[i].campo, rotulo: regras[i].rotulo, mensagem: mensagem });
    }
  }
  mostrarResumo(erros);
}

// ---------- Máscara do WhatsApp: (51) 99999-1234 ----------

function formatarWhatsapp(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) {
    return d.length === 0 ? "" : "(" + d;
  }
  const ddd = "(" + d.slice(0, 2) + ") ";
  const resto = d.slice(2);
  const divisao = resto.length > 8 ? 5 : 4;
  if (resto.length <= divisao) {
    return ddd + resto;
  }
  return ddd + resto.slice(0, divisao) + "-" + resto.slice(divisao);
}

// ---------- Cadastro ----------

function sortear(minimo, maximo) {
  return minimo + Math.floor(Math.random() * (maximo - minimo + 1));
}

function montarPaciente() {
  return {
    id: Date.now(),
    nome: formulario.nome.value.trim(),
    bairro: formulario.bairro.value.trim(),
    especialidade: formulario.especialidade.value,
    risco: Math.random() < 0.5 ? "amarelo" : "verde",
    diasEspera: sortear(60, 300),
    minutosAteUnidade: Number(formulario.tempo.value),
    periodos: periodosMarcados(),
    status: "na fila",
    cadastroDoUsuario: true
  };
}

function salvar(paciente) {
  if (typeof vqvSalvarCadastro === "function") {
    return vqvSalvarCadastro(paciente);
  }
  cadastrosEmMemoria.push(paciente);
  return false;
}

function mostrarConfirmacao(paciente, salvouNoNavegador) {
  document.querySelector("#titulo-confirmacao").textContent =
    "Você entrou na fila de reaproveitamento de " + paciente.especialidade;

  const risco = document.querySelector("#confirmacao-risco");
  risco.textContent = "";
  const selo = document.createElement("span");
  selo.className = "selo selo--" + paciente.risco;
  const icone = document.createElement("span");
  icone.className = "selo-icone";
  icone.setAttribute("aria-hidden", "true");
  icone.textContent = paciente.risco === "amarelo" ? "◆" : "●";
  selo.appendChild(icone);
  selo.appendChild(document.createTextNode(" Risco " + paciente.risco));
  risco.appendChild(selo);

  document.querySelector("#confirmacao-espera").textContent = paciente.diasEspera + " dias";

  document.querySelector("#confirmacao-aviso").textContent = salvouNoNavegador
    ? "Seu cadastro ficou salvo só neste navegador. Na simulação, você aparece na fila com o selo \"Você\"."
    : "Nesta demonstração, o cadastro fica guardado só enquanto esta página estiver aberta.";

  document.querySelector("#secao-formulario").hidden = true;
  const secao = document.querySelector("#confirmacao");
  secao.hidden = false;
  document.querySelector("#titulo-confirmacao").focus();
}

function novoCadastro() {
  formulario.reset();
  for (let i = 0; i < regras.length; i++) {
    camposTocados[regras[i].campo] = false;
    const elementos = elementosDoCampo(regras[i].campo);
    for (let j = 0; j < elementos.length; j++) {
      elementos[j].removeAttribute("aria-invalid");
    }
    document.querySelector("#erro-" + regras[i].campo).textContent = "";
  }
  mostrarResumo([]);
  document.querySelector("#confirmacao").hidden = true;
  document.querySelector("#secao-formulario").hidden = false;
  formulario.nome.focus();
}

// ---------- Eventos ----------

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const erros = [];
  for (let i = 0; i < regras.length; i++) {
    camposTocados[regras[i].campo] = true;
    const mensagem = validarCampo(regras[i]);
    if (mensagem !== "") {
      erros.push({ campo: regras[i].campo, rotulo: regras[i].rotulo, mensagem: mensagem });
    }
  }

  mostrarResumo(erros);

  if (erros.length > 0) {
    // O foco vai para o primeiro campo com erro.
    elementosDoCampo(erros[0].campo)[0].focus();
    return;
  }

  const paciente = montarPaciente();
  const salvou = salvar(paciente);
  mostrarConfirmacao(paciente, salvou);
});

// Valida ao sair de cada campo (depois que a pessoa já mexeu nele).
for (let i = 0; i < regras.length; i++) {
  const regra = regras[i];
  const elementos = elementosDoCampo(regra.campo);

  for (let j = 0; j < elementos.length; j++) {
    const elemento = elementos[j];

    elemento.addEventListener("input", function () {
      camposTocados[regra.campo] = true;
    });

    elemento.addEventListener("change", function () {
      camposTocados[regra.campo] = true;
      // Caixas de seleção e listas: valida na hora da escolha.
      if (elemento.type === "checkbox" || elemento.tagName === "SELECT") {
        validarCampo(regra);
        atualizarResumoSeVisivel();
      }
    });

    elemento.addEventListener("blur", function () {
      if (camposTocados[regra.campo]) {
        validarCampo(regra);
        atualizarResumoSeVisivel();
      }
    });
  }
}

formulario.whatsapp.addEventListener("input", function () {
  formulario.whatsapp.value = formatarWhatsapp(formulario.whatsapp.value);
});

document.querySelector("#novo-cadastro").addEventListener("click", novoCadastro);
