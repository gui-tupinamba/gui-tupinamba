const API =
  "https://script.google.com/macros/s/AKfycbzU2vLvja5lhtW8ExWfnTgdF1kluwgrNYsAxauT3k-bHfDEm4XxB_G4S9sK-7UdNxHkbQ/exec";

let convidados = [];

const login = document.getElementById("login");

const painel = document.getElementById("painel");

const senha = document.getElementById("senha");

const btnEntrar = document.getElementById("btnEntrar");

const lista = document.getElementById("lista");

const busca = document.getElementById("busca");

const total = document.getElementById("total");

btnEntrar.addEventListener("click", entrar);

document.getElementById("btnAtualizar").addEventListener("click", carregar);

busca.addEventListener("input", renderizar);

async function entrar() {
  await carregar();
}

async function carregar() {
  const s = senha.value;

  const url = API + "?acao=listar&senha=" + encodeURIComponent(s);

  const resposta = await fetch(url);

  const dados = await resposta.json();

  if (!dados.sucesso) {
    alert("Senha inválida");

    return;
  }

  convidados = dados.dados;

  login.style.display = "none";

  painel.style.display = "block";

  renderizar();
}

function renderizar() {
  const termo = busca.value.toLowerCase();

  lista.innerHTML = "";

  total.innerText = convidados.length;

  convidados
    .filter(function (p) {
      return p.nome.toLowerCase().includes(termo);
    })
    .forEach(function (pessoa) {
      const div = document.createElement("div");

      div.className = "pessoa";

      div.innerHTML = `
                <div class="${
                  pessoa.tipo === "Titular" ? "titular" : "acompanhante"
                }">

                    ${pessoa.nome}

                </div>

                <small>

                    ${pessoa.tipo}

                    -

                    ${pessoa.responsavel}

                </small>
            `;

      lista.appendChild(div);
    });
}
