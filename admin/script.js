const API =
  "https://script.google.com/macros/s/AKfycbzU2vLvja5lhtW8ExWfnTgdF1kluwgrNYsAxauT3k-bHfDEm4XxB_G4S9sK-7UdNxHkbQ/exec";

/*
=====================================================
ELEMENTOS
=====================================================
*/

const login = document.getElementById("login");

const painel = document.getElementById("painel");

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

/*
=====================================================
DADOS
=====================================================
*/

let convidados = [];

let senhaAtual = "";

/*
=====================================================
LOGIN
=====================================================
*/

btnEntrar.addEventListener("click", entrar);

senha.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    entrar();
  }
});

async function entrar() {
  const valor = senha.value.trim();

  if (!valor) {
    mostrarErro("Digite a senha para continuar.");

    return;
  }

  senhaAtual = valor;

  btnEntrar.disabled = true;

  btnEntrar.innerText = "Entrando...";

  esconderErro();

  try {
    await carregarDados();

    login.style.display = "none";

    painel.style.display = "block";
  } catch (erro) {
    mostrarErro(erro.message);
  } finally {
    btnEntrar.disabled = false;

    btnEntrar.innerText = "Entrar";
  }
}

/*
=====================================================
CARREGAR DADOS
=====================================================
*/

async function carregarDados() {
  mostrarCarregando();

  const url = API + "?acao=listar&senha=" + encodeURIComponent(senhaAtual);

  try {
    const resposta = await fetch(url);

    if (!resposta.ok) {
      throw new Error("Não foi possível acessar o servidor.");
    }

    const dados = await resposta.json();

    console.log("Dados recebidos:", dados);

    if (!dados.sucesso) {
      throw new Error(dados.mensagem || "Senha inválida.");
    }

    convidados = Array.isArray(dados.dados) ? dados.dados : [];

    console.log("Convidados:", convidados);

    atualizarEstatisticas();

    renderizar();
  } finally {
    esconderCarregando();
  }
}

/*
=====================================================
ATUALIZAR
=====================================================
*/

btnAtualizar.addEventListener("click", async function () {
  btnAtualizar.disabled = true;

  btnAtualizar.innerText = "Atualizando...";

  try {
    await carregarDados();
  } catch (erro) {
    alert(erro.message);
  }

  btnAtualizar.disabled = false;

  btnAtualizar.innerText = "↻ Atualizar";
});

/*
=====================================================
BUSCA
=====================================================
*/

busca.addEventListener("input", function () {
  renderizar();
});

/*
=====================================================
IDENTIFICA TIPO
=====================================================
*/

function ehTitular(pessoa) {
  const tipo = normalizar(pessoa.tipo);

  /*
    Aceita várias formas
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
    Se não tiver tipo,
    verifica o responsável.

    Se o responsável for
    a própria pessoa,
    ela é titular.
    */

  const nome = normalizar(pessoa.nome);

  const responsavel = normalizar(pessoa.responsavel);

  if (nome && responsavel && nome === responsavel) {
    return true;
  }

  /*
    Se não houver responsável,
    também consideramos titular.
    */

  if (!responsavel) {
    return true;
  }

  return false;
}

/*
=====================================================
IDENTIFICA ACOMPANHANTE
=====================================================
*/

function ehAcompanhante(pessoa) {
  return !ehTitular(pessoa);
}

/*
=====================================================
ESTATÍSTICAS
=====================================================
*/

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

/*
=====================================================
AGRUPAR
=====================================================
*/

function agruparConvidados(dados) {
  const grupos = [];

  /*
    PRIMEIRO:
    cria os titulares
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
    coloca acompanhantes
    */

  dados.forEach(function (pessoa) {
    if (!ehAcompanhante(pessoa)) {
      return;
    }

    const responsavel = normalizar(pessoa.responsavel);

    /*
            Procura o titular
            */

    const grupo = grupos.find(function (grupo) {
      return normalizar(grupo.titular.nome) === responsavel;
    });

    if (grupo) {
      grupo.acompanhantes.push(pessoa);
    } else {
      /*
                Se não encontrou o titular,
                cria um grupo próprio para
                não perder a pessoa.
                */

      grupos.push({
        titular: {
          nome: pessoa.responsavel || pessoa.nome,

          tipo: "Titular",

          responsavel: pessoa.responsavel || pessoa.nome,
        },

        acompanhantes: pessoa.responsavel ? [pessoa] : [],
      });
    }
  });

  return grupos;
}

/*
=====================================================
RENDERIZAR
=====================================================
*/

function renderizar() {
  lista.innerHTML = "";

  const termo = normalizar(busca.value);

  if (convidados.length === 0) {
    lista.innerHTML = `

            <div class="sem-resultado">

                Nenhuma confirmação encontrada.

            </div>

        `;

    resultado.innerText = "0 convites";

    return;
  }

  let grupos = agruparConvidados(convidados);

  /*
    FILTRO
    */

  if (termo) {
    grupos = grupos.filter(function (grupo) {
      /*
                    Procura no titular
                    */

      if (normalizar(grupo.titular.nome).includes(termo)) {
        return true;
      }

      /*
                    Procura nos acompanhantes
                    */

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

                    <span class="nome-titular">

                        ${escaparHTML(grupo.titular.nome)}

                    </span>

                    <span class="tag-titular">

                        TITULAR

                    </span>

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

                                    <span>

                                        ${escaparHTML(acompanhante.nome)}

                                    </span>

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
}

/*
=====================================================
NORMALIZAR
=====================================================
*/

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/*
=====================================================
SEGURANÇA HTML
=====================================================
*/

function escaparHTML(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*
=====================================================
CARREGAMENTO
=====================================================
*/

function mostrarCarregando() {
  carregando.style.display = "flex";
}

function esconderCarregando() {
  carregando.style.display = "none";
}

/*
=====================================================
ERRO
=====================================================
*/

function mostrarErro(texto) {
  erroLogin.innerText = texto;

  erroLogin.style.display = "block";
}

function esconderErro() {
  erroLogin.innerText = "";

  erroLogin.style.display = "none";
}

/*
=====================================================
SAIR
=====================================================
*/

btnSair.addEventListener("click", function () {
  convidados = [];

  senhaAtual = "";

  lista.innerHTML = "";

  busca.value = "";

  senha.value = "";

  painel.style.display = "none";

  login.style.display = "block";

  totalPessoas.innerText = "0";

  totalTitulares.innerText = "0";

  totalAcompanhantes.innerText = "0";

  resultado.innerText = "Aguardando acesso.";
});
