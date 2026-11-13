// Recurso nativo do navegador (localStorage), além do conteúdo da fase.
// O site funciona sem este arquivo: os outros scripts testam se estas funções existem.

const VQV_CHAVE_CADASTROS = "vqv:cadastros";

// Lê os cadastros salvos. Devolve sempre um array (vazio em caso de erro).
function vqvLerCadastros() {
  try {
    const texto = localStorage.getItem(VQV_CHAVE_CADASTROS);
    if (!texto) {
      return [];
    }
    const lista = JSON.parse(texto);
    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    return [];
  }
}

// Acrescenta um cadastro e salva. Devolve true se conseguiu salvar.
function vqvSalvarCadastro(paciente) {
  try {
    const lista = vqvLerCadastros();
    lista.push(paciente);
    localStorage.setItem(VQV_CHAVE_CADASTROS, JSON.stringify(lista));
    return true;
  } catch (erro) {
    return false;
  }
}

// Apaga todos os cadastros feitos neste navegador.
function vqvLimparCadastros() {
  try {
    localStorage.removeItem(VQV_CHAVE_CADASTROS);
  } catch (erro) {
    // Sem acesso ao armazenamento: não há o que apagar.
  }
}
