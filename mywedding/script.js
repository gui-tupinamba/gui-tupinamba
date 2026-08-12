const API_URL =
  "https://script.google.com/macros/s/AKfycbzU2vLvja5lhtW8ExWfnTgdF1kluwgrNYsAxauT3k-bHfDEm4XxB_G4S9sK-7UdNxHkbQ/exec";

const MAX_ACOMPANHANTES = 3;

/* =====================================================
   ELEMENTOS
===================================================== */

const formulario = document.getElementById("formulario");

const nome = document.getElementById("nome");

const listaAcompanhantes = document.getElementById("listaAcompanhantes");

const btnAdicionar = document.getElementById("btnAdicionar");

const btnConfirmar = document.getElementById("btnConfirmar");

const carregando = document.getElementById("carregando");

const mensagem = document.getElementById("mensagem");

const contador = document.getElementById("contador");

const iframeEnvio = document.getElementById("iframeEnvio");

/* =====================================================
   CONTROLE
===================================================== */

let quantidadeAcompanhantes = 0;

let enviando = false;

/* =====================================================
   CONFIGURAÇÃO
===================================================== */

if (formulario) {
  formulario.action = API_URL;
}

/* =====================================================
   ADICIONAR ACOMPANHANTE
===================================================== */

if (btnAdicionar) {
  btnAdicionar.addEventListener("click", function () {
    if (quantidadeAcompanhantes >= MAX_ACOMPANHANTES) {
      mostrarMensagem(
        "O limite é de " + MAX_ACOMPANHANTES + " acompanhantes.",
        "erro",
      );

      return;
    }

    quantidadeAcompanhantes++;

    /* =========================================
               CONTAINER
            ========================================= */

    const div = document.createElement("div");

    div.className = "acompanhante";

    /* =========================================
               INPUT
            ========================================= */

    const input = document.createElement("input");

    input.type = "text";

    input.name = "acompanhantes";

    input.className = "campo-acompanhante";

    input.placeholder = "Nome completo do acompanhante";

    input.autocomplete = "off";

    /* =========================================
               BOTÃO REMOVER
            ========================================= */

    const botao = document.createElement("button");

    botao.type = "button";

    botao.className = "btn-remover";

    botao.innerHTML = "×";

    botao.title = "Remover acompanhante";

    /* =========================================
               REMOVER
            ========================================= */

    botao.addEventListener("click", function () {
      div.remove();

      quantidadeAcompanhantes--;

      atualizarContador();
    });

    /* =========================================
               MONTA ELEMENTO
            ========================================= */

    div.appendChild(input);

    div.appendChild(botao);

    listaAcompanhantes.appendChild(div);

    atualizarContador();

    input.focus();
  });
}

/* =====================================================
   CONTADOR
===================================================== */

function atualizarContador() {
  if (!contador) {
    return;
  }

  contador.innerText = quantidadeAcompanhantes;
}

/* =====================================================
   ENVIO DO FORMULÁRIO
===================================================== */

if (formulario) {
  formulario.addEventListener("submit", function (event) {
    event.preventDefault();

    /* =========================================
               EVITA DUPLO ENVIO
            ========================================= */

    if (enviando) {
      return;
    }

    /* =========================================
               NOME DO TITULAR
            ========================================= */

    const nomeTitular = nome.value.trim();

    if (!nomeTitular) {
      mostrarMensagem("Digite seu nome.", "erro");

      nome.focus();

      return;
    }

    /* =========================================
               PEGA ACOMPANHANTES
            ========================================= */

    const campos = document.querySelectorAll(".campo-acompanhante");

    const acompanhantes = [];

    let acompanhanteVazio = false;

    campos.forEach(function (campo) {
      const valor = campo.value.trim();

      if (!valor) {
        acompanhanteVazio = true;
      } else {
        acompanhantes.push(valor);
      }
    });

    /* =========================================
               VERIFICA CAMPOS VAZIOS
            ========================================= */

    if (acompanhanteVazio) {
      mostrarMensagem("Preencha ou remova todos os acompanhantes.", "erro");

      return;
    }

    /* =========================================
               LIMITE
            ========================================= */

    if (acompanhantes.length > MAX_ACOMPANHANTES) {
      mostrarMensagem(
        "O limite é de " + MAX_ACOMPANHANTES + " acompanhantes.",
        "erro",
      );

      return;
    }

    /* =========================================
               COMEÇA ENVIO
            ========================================= */

    enviando = true;

    btnConfirmar.disabled = true;

    btnAdicionar.disabled = true;

    carregando.style.display = "flex";

    esconderMensagem();

    /* =========================================
               CRIA FORMULÁRIO TEMPORÁRIO
            ========================================= */

    const formEnvio = document.createElement("form");

    formEnvio.method = "POST";

    formEnvio.action = API_URL;

    formEnvio.target = "iframeEnvio";

    /*
             Importante:

             O formulário original não é enviado.

             Criamos outro formulário apenas
             para enviar os dados para o Apps Script.
            */

    /* =========================================
               AÇÃO
            ========================================= */

    adicionarCampoHidden(formEnvio, "acao", "confirmar");

    /* =========================================
               NOME DO TITULAR
            ========================================= */

    adicionarCampoHidden(formEnvio, "nome", nomeTitular);

    /* =========================================
               ACOMPANHANTES
            ========================================= */

    acompanhantes.forEach(function (acompanhante) {
      adicionarCampoHidden(formEnvio, "acompanhantes", acompanhante);
    });

    /* =========================================
               ADICIONA FORM AO BODY
            ========================================= */

    document.body.appendChild(formEnvio);

    /* =========================================
               DEBUG
            ========================================= */

    console.log("Enviando confirmação:");

    console.log({
      acao: "confirmar",

      nome: nomeTitular,

      acompanhantes: acompanhantes,
    });

    /* =========================================
               ENVIA
            ========================================= */

    formEnvio.submit();

    /* =========================================
               REMOVE FORM TEMPORÁRIO
            ========================================= */

    setTimeout(function () {
      if (formEnvio && formEnvio.parentNode) {
        formEnvio.remove();
      }
    }, 1000);

    /*
             Não finalizamos imediatamente.

             Esperamos o iframe carregar.
            */

    setTimeout(function () {
      if (!enviando) {
        return;
      }

      /*
                     Caso o iframe não dispare
                     corretamente, não deixa a
                     tela presa infinitamente.
                    */

      finalizarEnvio();
    }, 5000);
  });
}

/* =====================================================
   ADICIONAR CAMPO HIDDEN
===================================================== */

function adicionarCampoHidden(formulario, nomeCampo, valor) {
  const input = document.createElement("input");

  input.type = "hidden";

  input.name = nomeCampo;

  input.value = valor;

  formulario.appendChild(input);
}

/* =====================================================
   IFRAME
===================================================== */

if (iframeEnvio) {
  iframeEnvio.addEventListener("load", function () {
    if (!enviando) {
      return;
    }

    /*
             O Google Apps Script pode levar
             alguns milissegundos para concluir.

             Pequena espera antes de finalizar.
            */

    setTimeout(function () {
      if (enviando) {
        finalizarEnvio();
      }
    }, 700);
  });
}

/* =====================================================
   FINALIZAR ENVIO
===================================================== */

function finalizarEnvio() {
  if (!enviando) {
    return;
  }

  /* =========================================
       PARA CARREGAMENTO
    ========================================= */

  if (carregando) {
    carregando.style.display = "none";
  }

  /* =========================================
       MENSAGEM
    ========================================= */

  mostrarMensagem("Presença confirmada com sucesso!", "sucesso");

  /* =========================================
       LIMPA FORMULÁRIO
    ========================================= */

  if (formulario) {
    formulario.reset();
  }

  /* =========================================
       REMOVE ACOMPANHANTES
    ========================================= */

  if (listaAcompanhantes) {
    listaAcompanhantes.innerHTML = "";
  }

  quantidadeAcompanhantes = 0;

  atualizarContador();

  /* =========================================
       LIBERA BOTÕES
    ========================================= */

  if (btnConfirmar) {
    btnConfirmar.disabled = false;
  }

  if (btnAdicionar) {
    btnAdicionar.disabled = false;
  }

  enviando = false;
}

/* =====================================================
   MENSAGEM
===================================================== */

function mostrarMensagem(texto, tipo) {
  if (!mensagem) {
    return;
  }

  mensagem.innerText = texto;

  mensagem.className = "mensagem " + tipo;

  mensagem.style.display = "block";
}

/* =====================================================
   ESCONDER MENSAGEM
===================================================== */

function esconderMensagem() {
  if (!mensagem) {
    return;
  }

  mensagem.innerText = "";

  mensagem.className = "mensagem";

  mensagem.style.display = "none";
}

/* =====================================================
   LINK PARA ADMIN
===================================================== */

function configurarLinkAdmin() {
  /*
     Procura um elemento com:

     id="linkAdmin"

     Caso exista, configura o endereço.
    */

  const linkAdmin = document.getElementById("linkAdmin");

  if (!linkAdmin) {
    return;
  }

  linkAdmin.href = "../admin/";
}

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

atualizarContador();

configurarLinkAdmin();
