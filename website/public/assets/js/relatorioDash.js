const dataMetricas = {
    labels: ["Críticas", "Risco", "Normal"],
    datasets: [
        {
            label: "Métricas",
            data: [],
            backgroundColor: ["#ff0000", "#ff8000", "#0071ce"],
            hoverOffset: 4
        }
    ]
};

const configMetricas = {
    type: "doughnut",
    data: dataMetricas
};

const graficoMetricas = new Chart(
    document.getElementById("chartDoughnut"),
    configMetricas
);

metricas.addEventListener("change", () => {
    mostrarInfoMedicoes();
    mostrarInfoTrendline();
    mostrarInfoChamado();
});

tempo.addEventListener("change", () => {
    if (tempo.value != "all") {
        qtdTempo.removeAttribute("disabled");
    } else {
        qtdTempo.setAttribute("disabled", "disabled");
    }
    mostrarInfoMedicoes();
    mostrarInfoTrendline();
    mostrarInfoChamado();
});

qtdTempo.addEventListener("change", () => {
    mostrarInfoMedicoes();
    mostrarInfoTrendline();
    mostrarInfoChamado();
});

const listaMetricasRelatorio = () => {
    metricas.innerHTML = "";
    axios
        .post("/maquina/lista-componentes", {
            id: Number(maquinaInfo.pk_maquina)
        })
        .then(({data: {status, msg}}) => {
            if (status === "ok") {
                option = document.createElement("option");
                option.innerText = "Todas";
                option.value = "0";
                metricas.appendChild(option);
                msg.forEach(({id_categoria_medicao, tipo}) => {
                    option = document.createElement("option");
                    option.value = id_categoria_medicao;
                    option.setAttribute("id", `medicao${id_categoria_medicao}`);
                    option.innerText = getTipo(tipo);
                    metricas.appendChild(option);
                });
            }
        });
};

const mostrarCorrelacao = () => {
    document.querySelector("#tableCorrelacao").innerHTML = "";
    axios
        .post("/analytics/correlacao", {
            maquina: Number(maquinaInfo.pk_maquina)
        })
        .then(({data: {status, msg}}) => {
            // console.log(status)
            if (status === "ok") {
                msg.forEach(corr => {
                    let tr = document.createElement("tr");
                    let tdMetrica1 = document.createElement("td");
                    let tdMetrica2 = document.createElement("td");
                    let tdCorrelacao = document.createElement("td");
                    let tdR2 = document.createElement("td");
                    tr.appendChild(tdR2);
                    tr.appendChild(tdMetrica1);
                    tr.appendChild(tdMetrica2);
                    tr.appendChild(tdCorrelacao);

                    tdMetrica1.innerHTML = getTipo(corr.x.tipo);
                    tdMetrica2.innerHTML = getTipo(corr.y.tipo);
                    tdCorrelacao.innerHTML = corr.corr.toFixed(4);
                    tdR2.innerHTML = corr.r2.toFixed(4);

                    document.querySelector("#tableCorrelacao").appendChild(tr);
                });
            } else {
                console.error(msg);
            }
        });
};

const mostrarInfoMedicoes = () => {
    let objInfoMedicoes = {};
    if (metricas.value == 0) {
        objInfoMedicoes = {maquina: maquinaInfo.pk_maquina};
    } else {
        objInfoMedicoes = {idCategoriaMedicao: metricas.value};
    }

    if (tempo.value != "all") {
        objInfoMedicoes.type = tempo.value;
        objInfoMedicoes.qtd = qtdTempo.value;
    }
    // console.log(objInfoMedicoes)
    axios
        .post("/medicao/stats", objInfoMedicoes)
        .then(({data: {status, msg}}) => {
            if (status == "ok") {
                document.querySelector("#medicoesTotais").innerHTML =
                    msg.medicoesTotais;
                document.querySelector("#medicaoCritica").innerHTML =
                    msg.medicoesCriticas;
                document.querySelector("#medicaoRisco").innerHTML =
                    msg.medicoesDeRisco;
                document.querySelector("#medicaoNormal").innerHTML =
                    msg.medicoesNormais;

                let percCrit = (
                    (msg.medicoesCriticas * 100) /
                    msg.medicoesTotais
                ).toFixed(2);
                let percRisc = (
                    (msg.medicoesDeRisco * 100) /
                    msg.medicoesTotais
                ).toFixed(2);
                let percNorm = (
                    (msg.medicoesNormais * 100) /
                    msg.medicoesTotais
                ).toFixed(2);

                graficoMetricas.data.datasets[0].data = [
                    percCrit,
                    percRisc,
                    percNorm
                ];
                graficoMetricas.update();
            } else {
                console.log(status);
            }
        });
};

const mostrarInfoTrendline = () => {
    document.querySelector("#tableTrendline").innerHTML = "";
    if (metricas.value > 0) {
        axios
            .post("/analytics/trend", {
                idCategoriaMedicao: metricas.value
            })
            .then(({data: {msg, status}}) => {
                // console.log(status)
                // console.log(msg)
                let tr = document.createElement("tr");
                let tdMetrica = document.createElement("td");
                let tdTendencia = document.createElement("td");
                tr.appendChild(tdMetrica);
                tr.appendChild(tdTendencia);

                tdMetrica.innerHTML = document.getElementById(
                    `medicao${metricas.value}`
                ).innerHTML;
                tdTendencia.innerHTML = `${msg.orientacao} ${msg.comportamento}`;
                document.querySelector("#tableTrendline").appendChild(tr);
            });
    } else {
        axios
            .post("/maquina/lista-componentes", {
                id: Number(maquinaInfo.pk_maquina)
            })
            .then(({data: {status, msg}}) => {
                if (status == "ok") {
                    msg.forEach(({id_categoria_medicao}) => {
                        let tr = document.createElement("tr");
                        let tdMetrica = document.createElement("td");
                        let tdTendencia = document.createElement("td");
                        tr.appendChild(tdMetrica);
                        tr.appendChild(tdTendencia);

                        tdMetrica.innerHTML = document.getElementById(
                            `medicao${id_categoria_medicao}`
                        )?.innerHTML;

                        axios
                            .post("/analytics/trend", {
                                idCategoriaMedicao: id_categoria_medicao
                            })
                            .then(({data: {msg, status}}) => {
                                // console.log(msg)
                                tdTendencia.innerHTML = `${msg.orientacao} ${msg.comportamento}`;
                            });

                        document
                            .querySelector("#tableTrendline")
                            .appendChild(tr);
                    });
                }
            });
    }
};

const mostrarInfoChamado = () => {
    let objInfoChamados = {maquina: maquinaInfo.pk_maquina};
    if (tempo.value != "all") {
        objInfoChamados.type = tempo.value;
        objInfoChamados.qtd = qtdTempo.value;
    }
    axios
        .post("/chamado/stats", objInfoChamados)
        .then(({data: {status, msg}}) => {
            if (status == "ok") {
                document.querySelector("#totalChamados").innerHTML =
                    msg.chamadosTotais;
                document.querySelector("#chamadosAbertos").innerHTML =
                    msg.chamadosAbertos;
                document.querySelector("#chamadosFechados").innerHTML =
                    msg.chamadosFechados;

                document.querySelector("#totalSolucoes").innerHTML =
                    msg.solucoesTotais;
                document.querySelector("#eficaciaTotal").innerHTML =
                    msg.solucoesEficazes;
                document.querySelector("#eficaciaParcial").innerHTML =
                    msg.solucoesParciais;
            } else {
                console.log(status);
            }
        });
};