// Dados da demonstração. Todos os nomes são fictícios.

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
