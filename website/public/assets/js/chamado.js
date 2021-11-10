const urlParams = new URLSearchParams(window.location.search);
const idChamado = urlParams.get("idChamado");

axios.post("/chamado/dados", {idChamado}).then(({data: {status, msg}}) => {
    // limpando conteúdo atual do conteiner
    const container = document.querySelectorAll(".container-site")[1];

    if (status === "ok") {
        // renderizando chamado
        // console.log(msg);
        renderChamado(msg);
        if (msg.solucao) {
            // renderizando solução
            document.querySelector("#responder-btn").style.display = "none";
            renderSolucao(msg.solucao);
        }
    } else {
        console.warn(msg);
        renderChamadoNaoEncontrado(container);
    }
});

const getTipo = tipo => {
    let metrica = tipo.split("_");
    metrica = `${metrica[0].toUpperCase()} - ${
        metrica[1].charAt(0).toUpperCase() + metrica[1].slice(1)
    }`;
    return metrica;
};
// renderiza chamado
const renderChamado = msg => {
    // criando box chamado
    const divTitulo = document.querySelector("#titulo");
    const divPrioridade = document.querySelector("#prioridade");
    const nomeMaquina = document.querySelector("#nomeMaquina");
    const medicao = document.querySelector("#medicao");
    const dataChamado = document.querySelector("#dataChamado");
    const statusChamado = document.querySelector("#statusChamado");
    const nomeResp = document.querySelector("#nomeResp");
    const emailResp = document.querySelector("#emailResp");
    const divDescricao = document.querySelector(".descricao");
    const divDataAbertura = document.querySelector(".data-abertura");

    // adicionando corpo das divs
    divTitulo.innerHTML = msg.titulo;
    divPrioridade.innerHTML = `${msg.prioridade.toUpperCase()}`;
    if (msg.prioridade == "baixa") {
        statusChamado.classList = "status baixa";
    } else if (msg.prioridade == "media") {
        statusChamado.classList = "status media";
    } else if (msg.prioridade == "alta") {
        statusChamado.classList = "status alta";
    } else if (msg.prioridade == "emergencia") {
        statusChamado.classList = "status emergencia";
    }
    nomeMaquina.innerHTML = msg.maquina;
    medicao.innerHTML = getTipo(msg.tipo); //Alterar para o nome do componente
    divDescricao.innerHTML = msg.descricao;
    nomeResp.innerHTML = msg.nome;
    emailResp.innerHTML = msg.email;
    dataChamado.innerHTML = new Date(msg.data_abertura)
        .toLocaleString("pt-BR")
        .slice(0, -3);
    const data = new Date(msg.data_abertura).toLocaleString("pt-BR");
    if (msg.automatico == "n") {
        nomeResp.innerHTML = msg.nome;
        emailResp.innerHTML = msg.email;
    } else {
        nomeResp.innerHTML = "Monitoramento automático";
        emailResp.innerHTML = "";
    }
};

// renderiza solução
const renderSolucao = solucao => {
    // criando divs
    document.querySelector(".card-solucao").style.display = "block";
    const divTitulo = document.querySelector("#solucao-titulo");
    const divEficacia = document.querySelector("#solucao-eficacia");
    const statusSolucao = document.querySelector("#statusSolucao");
    const divDescricao = document.querySelector("#solucao-descricao");
    const divData = document.querySelector("#solucao-data");
    const divResponsavelNome = document.querySelector(
        "#solucao-responsavel-nome"
    );
    const divResponsavelEmail = document.querySelector(
        "#solucao-responsavel-email"
    );

    // adicionando corpo das divs
    divTitulo.innerHTML = solucao.titulo;
    divEficacia.innerHTML = solucao.eficacia.toUpperCase();
    divDescricao.innerHTML = solucao.descricao;
    const data = new Date(solucao.data_solucao);
    divData.innerHTML = data.toLocaleString("pt-BR").slice(0, -3);
    divResponsavelNome.innerHTML = solucao.nome;
    divResponsavelEmail.innerHTML = solucao.email;

    // adicionando classes
    statusSolucao.classList = `status eficacia-${solucao.eficacia}`;
};

const renderChamadoNaoEncontrado = container => {
    // criando elemento
    const warnBox = document.createElement("div");
    warnBox.innerHTML =
        "Chamado não encontrado! Você será redirecionado para a lista de chamados";

    warnBox.classList.add("warn-box");

    container.appendChild(warnBox);

    setTimeout(() => {
        document.location.href = "/chamados";
    }, 2000);
};
