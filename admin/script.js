/* =========================================
   CONFIGURAÇÃO
========================================= */

/*
URL DO SEU GOOGLE APPS SCRIPT
*/

const API =
  "https://script.google.com/macros/s/AKfycbzU2vLvja5lhtW8ExWfnTgdF1kluwgrNYsAxauT3k-bHfDEm4XxB_G4S9sK-7UdNxHkbQ/exec";

/* =========================================
   ELEMENTOS
========================================= */

const login = document.getElementById("login");

const painel = document.getElementById("painel");

const usuario = document.getElementById("usuario");

const senha = document.getElementById("senha");

const btnEntrar = document.getElementById("btnEntrar");

const btnAtualizar = document.getElementById("btnAtualizar");

const btnSair = document.getElementById("btnSair");

const busca = document.getElementById("busca");

const lista = document.getElementById("lista");

const carregando = document.getElementById("carregando");

const erroLogin = document.getElementById("erroLogin");

const resultado = document.getElementById("resultado");

const totalPessoas = document.getElementById("totalPessoas");

const totalTitulares = document.getElementById("totalTitulares");

const totalAcompanhantes = document.getElementById("totalAcompanhantes");

/* =========================================
   ESTADO
========================================= */

let convidados = [];

/*
Credenciais ficam somente
na memória enquanto o painel
estiver aberto.
*/

let usuarioAtual = "";

let senhaAtual = "";

/* =========================================
   LOGIN
========================================= */

btnEntrar.addEventListener("click", entrar);

usuario.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    entrar();
  }
});

senha.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    entrar();
  }
});

/* =========================================
   ENTRAR
========================================= */

async function entrar() {
  const usuarioValor = usuario.value.trim();

  const senhaValor = senha.value;

  esconderErro();

  if (!usuarioValor) {
    mostrarErro("Digite o usuário.");

    usuario.focus();

    return;
  }

  if (!senhaValor) {
    mostrarErro("Digite a senha.");

    senha.focus();

    return;
  }

  btnEntrar.disabled = true;

  btnEntrar.innerText = "Entrando...";

  try {
    const url =
      API +
      "?acao=login" +
      "&usuario=" +
      encodeURIComponent(usuarioValor) +
      "&senha=" +
      encodeURIComponent(senhaValor);

    const resposta = await fetch(url);

    if (!resposta.ok) {
      throw new Error("Não foi possível conectar ao servidor.");
    }

    const dados = await resposta.json();

    if (!dados.sucesso) {
      throw new Error(dados.mensagem || "Usuário ou senha inválidos.");
    }

    /*
        Guarda as credenciais
        somente na memória.
        */

    usuarioAtual = usuarioValor;

    senhaAtual = senhaValor;

    /*
        Carrega os convidados
        */

    await carregarDados();

    /*
        Mostra painel
        */

    login.style.display = "none";

    painel.style.display = "block";

    busca.focus();
  } catch (erro) {
    mostrarErro(erro.message);
  } finally {
    btnEntrar.disabled = false;

    btnEntrar.innerText = "Entrar";
  }
}

/* =========================================
   CARREGAR DADOS
========================================= */

async function carregarDados() {
  mostrarCarregando();

  try {
    const url =
      API +
      "?acao=listar" +
      "&usuario=" +
      encodeURIComponent(usuarioAtual) +
      "&senha=" +
      encodeURIComponent(senhaAtual);

    const resposta = await fetch(url);

    if (!resposta.ok) {
      throw new Error("Erro ao consultar os convidados.");
    }

    const dados = await resposta.json();

    console.log("Resposta da API:", dados);

    if (!dados.sucesso) {
      throw new Error(
        dados.mensagem || "Não foi possível carregar os convidados.",
      );
    }

    convidados = Array.isArray(dados.dados) ? dados.dados : [];

    atualizarEstatisticas();

    renderizar();
  } catch (erro) {
    throw erro;
  } finally {
    esconderCarregando();
  }
}

/* =========================================
   ATUALIZAR
========================================= */

btnAtualizar.addEventListener("click", async function () {
  btnAtualizar.disabled = true;

  btnAtualizar.innerText = "Atualizando...";

  try {
    await carregarDados();
  } catch (erro) {
    alert(erro.message);
  } finally {
    btnAtualizar.disabled = false;

    btnAtualizar.innerText = "↻ Atualizar";
  }
});

/* =========================================
   PESQUISA
========================================= */

busca.addEventListener("input", function () {
  renderizar();
});

/* =========================================
   NORMALIZAR TEXTO
========================================= */

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/* =========================================
   TITULAR
========================================= */

function ehTitular(pessoa) {
  const tipo = normalizar(pessoa.tipo);

  /*
    Formas aceitas
    */

  if (
    tipo === "titular" ||
    tipo === "titular do ingresso" ||
    tipo === "convidado" ||
    tipo === "principal"
  ) {
    return true;
  }

  /*
    Se o responsável for
    o próprio nome.
    */

  const nome = normalizar(pessoa.nome);

  const responsavel = normalizar(pessoa.responsavel);

  if (nome && responsavel && nome === responsavel) {
    return true;
  }

  /*
    Sem responsável =
    titular.
    */

  if (!responsavel) {
    return true;
  }

  return false;
}

/* =========================================
   ACOMPANHANTE
========================================= */

function ehAcompanhante(pessoa) {
  return !ehTitular(pessoa);
}

/* =========================================
   ESTATÍSTICAS
========================================= */

function atualizarEstatisticas() {
  let titulares = 0;

  let acompanhantes = 0;

  convidados.forEach(function (pessoa) {
    if (ehTitular(pessoa)) {
      titulares++;
    } else {
      acompanhantes++;
    }
  });

  totalPessoas.innerText = convidados.length;

  totalTitulares.innerText = titulares;

  totalAcompanhantes.innerText = acompanhantes;
}

/* =========================================
   AGRUPAR CONVIDADOS
========================================= */

function agruparConvidados(dados) {
  const grupos = [];

  /*
    PRIMEIRO:
    titulares
    */

  dados.forEach(function (pessoa) {
    if (ehTitular(pessoa)) {
      grupos.push({
        titular: pessoa,

        acompanhantes: [],
      });
    }
  });

  /*
    SEGUNDO:
    acompanhantes
    */

  dados.forEach(function (pessoa) {
    if (!ehAcompanhante(pessoa)) {
      return;
    }

    const responsavel = normalizar(pessoa.responsavel);

    const grupo = grupos.find(function (grupo) {
      return normalizar(grupo.titular.nome) === responsavel;
    });

    if (grupo) {
      grupo.acompanhantes.push(pessoa);
    } else {
      /*
                Caso exista algum
                registro antigo
                inconsistente.
                */

      grupos.push({
        titular: {
          nome: pessoa.responsavel || pessoa.nome,

          tipo: "Titular",

          responsavel: pessoa.responsavel || pessoa.nome,

          id: pessoa.id,
        },

        acompanhantes: pessoa.responsavel ? [pessoa] : [],
      });
    }
  });

  return grupos;
}

/* =========================================
   RENDERIZAR
========================================= */

function renderizar() {
  lista.innerHTML = "";

  const termo = normalizar(busca.value);

  if (convidados.length === 0) {
    resultado.innerText = "0 convites";

    lista.innerHTML = `

            <div class="sem-resultado">

                Nenhuma confirmação encontrada.

            </div>

        `;

    return;
  }

  let grupos = agruparConvidados(convidados);

  /*
    FILTRO
    */

  if (termo) {
    grupos = grupos.filter(function (grupo) {
      const nomeTitular = normalizar(grupo.titular.nome);

      if (nomeTitular.includes(termo)) {
        return true;
      }

      return grupo.acompanhantes.some(function (acompanhante) {
        return normalizar(acompanhante.nome).includes(termo);
      });
    });
  }

  resultado.innerText =
    grupos.length + (grupos.length === 1 ? " convite" : " convites");

  if (grupos.length === 0) {
    lista.innerHTML = `

            <div class="sem-resultado">

                Nenhuma pessoa encontrada.

            </div>

        `;

    return;
  }

  /*
    CRIA OS CARDS
    */

  grupos.forEach(function (grupo) {
    const div = document.createElement("div");

    div.className = "grupo-convidado";

    let html = `

                <div class="titular">

                    <div class="dados-titular">

                        <span
                            class="nome-titular"
                        >

                            ${escaparHTML(grupo.titular.nome)}

                        </span>


                        <span
                            class="tag-titular"
                        >

                            TITULAR

                        </span>

                    </div>


                    <button
                        type="button"
                        class="btn-excluir"
                        data-id="${escaparAtributo(grupo.titular.id)}"
                        data-nome="${escaparAtributo(grupo.titular.nome)}"
                        title="Excluir convidado"
                    >

                        🗑️

                    </button>

                </div>

            `;

    /*
            ACOMPANHANTES
            */

    if (grupo.acompanhantes.length > 0) {
      html += `

                    <div
                        class="lista-do-titular"
                    >

                `;

      grupo.acompanhantes.forEach(function (acompanhante) {
        html += `

                                <div
                                    class="acompanhante"
                                >

                                    <span
                                        class="icone-acompanhante"
                                    >
                                        ↳
                                    </span>


                                    <span
                                        class="nome-acompanhante"
                                    >

                                        ${escaparHTML(acompanhante.nome)}

                                    </span>


                                    <button
                                        type="button"
                                        class="btn-excluir"
                                        data-id="${escaparAtributo(
                                          acompanhante.id,
                                        )}"
                                        data-nome="${escaparAtributo(
                                          acompanhante.nome,
                                        )}"
                                        title="Excluir acompanhante"
                                    >

                                        🗑️

                                    </button>

                                </div>

                            `;
      });

      html += `

                    </div>

                `;
    }

    div.innerHTML = html;

    lista.appendChild(div);
  });

  ativarBotoesExcluir();
}

/* =========================================
   ATIVAR BOTÕES DE EXCLUSÃO
========================================= */

function ativarBotoesExcluir() {
  const botoes = document.querySelectorAll(".btn-excluir");

  botoes.forEach(function (botao) {
    botao.addEventListener("click", function () {
      const id = botao.dataset.id;

      const nome = botao.dataset.nome;

      excluirConvidado(id, nome, botao);
    });
  });
}

/* =========================================
   EXCLUIR CONVIDADO
========================================= */

async function excluirConvidado(id, nome, botao) {
  if (!id) {
    alert("Este convidado não possui um ID válido.");

    return;
  }

  const confirmou = confirm(
    `Deseja realmente excluir "${nome}"?\n\n` +
      `Somente esta pessoa será excluída.`,
  );

  if (!confirmou) {
    return;
  }

  /*
    Desabilita o botão
    */

  botao.disabled = true;

  botao.innerText = "…";

  try {
    const dados = new URLSearchParams();

    dados.append("acao", "excluir");

    dados.append("id", id);

    dados.append("usuario", usuarioAtual);

    dados.append("senha", senhaAtual);

    const resposta = await fetch(API, {
      method: "POST",

      body: dados,
    });

    if (!resposta.ok) {
      throw new Error("Não foi possível excluir o convidado.");
    }

    const retorno = await resposta.json();

    if (!retorno.sucesso) {
      throw new Error(retorno.mensagem || "Erro ao excluir.");
    }

    /*
        Atualiza os dados
        */

    await carregarDados();
  } catch (erro) {
    alert(erro.message);

    botao.disabled = false;

    botao.innerText = "🗑️";
  }
}

/* =========================================
   ESCAPAR HTML
========================================= */

function escaparHTML(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================
   ESCAPAR ATRIBUTO
========================================= */

function escaparAtributo(texto) {
  return escaparHTML(texto);
}

/* =========================================
   LOADING
========================================= */

function mostrarCarregando() {
  carregando.style.display = "flex";
}

function esconderCarregando() {
  carregando.style.display = "none";
}

/* =========================================
   ERROS
========================================= */

function mostrarErro(mensagem) {
  erroLogin.innerText = mensagem;

  erroLogin.style.display = "block";
}

function esconderErro() {
  erroLogin.innerText = "";

  erroLogin.style.display = "none";
}

/* =========================================
   SAIR
========================================= */

btnSair.addEventListener("click", function () {
  /*
        Limpa credenciais
        */

  usuarioAtual = "";

  senhaAtual = "";

  convidados = [];

  /*
        Limpa formulário
        */

  usuario.value = "";

  senha.value = "";

  busca.value = "";

  /*
        Limpa painel
        */

  lista.innerHTML = "";

  totalPessoas.innerText = "0";

  totalTitulares.innerText = "0";

  totalAcompanhantes.innerText = "0";

  resultado.innerText = "0 convites";

  /*
        Volta para login
        */

  painel.style.display = "none";

  login.style.display = "block";

  usuario.focus();
});
