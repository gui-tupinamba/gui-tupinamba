const API_URL =
  "https://script.google.com/macros/s/AKfycbzU2vLvja5lhtW8ExWfnTgdF1kluwgrNYsAxauT3k-bHfDEm4XxB_G4S9sK-7UdNxHkbQ/exec";

const MAX_ACOMPANHANTES = 3;

/*
=====================================================
ELEMENTOS
=====================================================
*/

const formulario = document.getElementById("formulario");

const nome = document.getElementById("nome");

const listaAcompanhantes = document.getElementById("listaAcompanhantes");

const btnAdicionar = document.getElementById("btnAdicionar");

const btnConfirmar = document.getElementById("btnConfirmar");

const carregando = document.getElementById("carregando");

const mensagem = document.getElementById("mensagem");

const contador = document.getElementById("contador");

const iframeEnvio = document.getElementById("iframeEnvio");

/*
=====================================================
CONTROLE
=====================================================
*/

let quantidadeAcompanhantes = 0;

let enviando = false;

/*
=====================================================
CONFIGURA FORMULÁRIO
=====================================================
*/

formulario.action = API_URL;

/*
=====================================================
ADICIONAR ACOMPANHANTE
=====================================================
*/

btnAdicionar.addEventListener("click", function () {
  if (quantidadeAcompanhantes >= MAX_ACOMPANHANTES) {
    mostrarMensagem(
      "O limite é de " + MAX_ACOMPANHANTES + " acompanhantes.",
      "erro",
    );

    return;
  }

  quantidadeAcompanhantes++;

  /*
        Cria container
        */

  const div = document.createElement("div");

  div.className = "acompanhante";

  /*
        Cria campo
        */

  const input = document.createElement("input");

  input.type = "text";

  input.name = "acompanhantes";

  input.className = "campo-acompanhante";

  input.placeholder = "Nome completo do acompanhante";

  input.autocomplete = "off";

  /*
        Botão remover
        */

  const botao = document.createElement("button");

  botao.type = "button";

  botao.className = "btn-remover";

  botao.innerHTML = "×";

  botao.title = "Remover acompanhante";

  /*
        Remover acompanhante
        */

  botao.addEventListener("click", function () {
    div.remove();

    quantidadeAcompanhantes--;

    atualizarContador();
  });

  div.appendChild(input);

  div.appendChild(botao);

  listaAcompanhantes.appendChild(div);

  atualizarContador();

  input.focus();
});

/*
=====================================================
CONTADOR
=====================================================
*/

function atualizarContador() {
  contador.innerText = quantidadeAcompanhantes;
}

/*
=====================================================
ENVIO DO FORMULÁRIO
=====================================================
*/

formulario.addEventListener("submit", function (event) {
  event.preventDefault();

  if (enviando) {
    return;
  }

  /*
        Nome
        */

  const nomeTitular = nome.value.trim();

  if (!nomeTitular) {
    mostrarMensagem("Digite seu nome.", "erro");

    nome.focus();

    return;
  }

  /*
        Verifica acompanhantes vazios
        */

  const campos = document.querySelectorAll(".campo-acompanhante");

  let acompanhanteVazio = false;

  campos.forEach(function (campo) {
    if (campo.value.trim() === "") {
      acompanhanteVazio = true;
    }
  });

  if (acompanhanteVazio) {
    mostrarMensagem("Preencha ou remova todos os acompanhantes.", "erro");

    return;
  }

  /*
        Começa envio
        */

  enviando = true;

  btnConfirmar.disabled = true;

  btnAdicionar.disabled = true;

  carregando.style.display = "flex";

  esconderMensagem();

  /*
        Envia para o Google Apps Script
        */

  formulario.submit();
});

/*
=====================================================
QUANDO O IFRAME TERMINAR DE CARREGAR
=====================================================
*/

iframeEnvio.addEventListener("load", function () {
  /*
        Ignora carregamentos que acontecerem
        antes do envio.
        */

  if (!enviando) {
    return;
  }

  /*
        Dá um pequeno tempo para garantir
        que o Apps Script terminou o processamento.
        */

  setTimeout(function () {
    finalizarEnvio();
  }, 500);
});

/*
=====================================================
FINALIZA ENVIO
=====================================================
*/

function finalizarEnvio() {
  carregando.style.display = "none";

  mostrarMensagem("Presença confirmada com sucesso!", "sucesso");

  /*
    Limpa formulário
    */

  formulario.reset();

  listaAcompanhantes.innerHTML = "";

  quantidadeAcompanhantes = 0;

  atualizarContador();

  /*
    Libera botões
    */

  btnConfirmar.disabled = false;

  btnAdicionar.disabled = false;

  enviando = false;
}

/*
=====================================================
MENSAGENS
=====================================================
*/

function mostrarMensagem(texto, tipo) {
  mensagem.innerText = texto;

  mensagem.className = "mensagem " + tipo;
}

function esconderMensagem() {
  mensagem.innerText = "";

  mensagem.className = "mensagem";
}

/*
=====================================================
INICIALIZAÇÃO
=====================================================
*/

atualizarContador();
