const {id, nome, email} = JSON.parse(sessionStorage.getItem("usuario"));
const cargoPessoa = JSON.parse(sessionStorage.getItem("usuario")).cargo;
const maquinas = document.querySelector("#maquinas");

const data = {
    labels: ["Críticas", "Risco", "Normal"],
    datasets: [
        {
            label: "My First Dataset",
            data: [1, 0, 0],
            backgroundColor: ["#ff0000", "#ff8000", "#0071ce"],
            hoverOffset: 4
        }
    ]
};

const config = {
    type: "doughnut",
    data: data
};

const graficoMetricas = new Chart(
    document.getElementById("chartDoughnut"),
    config
);

// console.log(cargoPessoa);
axios
    .post(`/maquina/lista-dependentes/${cargoPessoa}`, {
        id
    })
    .then(({data: {status, msg}}) => {
        if (status == "ok") {
            msg.forEach(({pk_maquina, maquina}) => {
                option = document.createElement("option");
                option.value = pk_maquina;
                option.innerText = maquina;
                maquinas.appendChild(option);
            });
        } else {
            console.error(msg);
        }
        attMetricas();
        mostrarCorrelacao();
        mostrarInfoMedicoes();
        mostrarInfoChamado();
        mostrarInfoTrendline();
    });

const getTipo = tipo => {
    let metrica = tipo.split("_");
    metrica = `${metrica[0].toUpperCase()} - ${
        metrica[1].charAt(0).toUpperCase() + metrica[1].slice(1)
    }`;
    return metrica;
};

maquinas.addEventListener("change", () => {
    mostrarCorrelacao();
    attMetricas();
    mostrarInfoMedicoes();
    mostrarInfoChamado();
    mostrarInfoTrendline();
});

metricas.addEventListener("change", () => {
    mostrarInfoMedicoes();
    mostrarInfoChamado();
    mostrarInfoTrendline();
});

const rangeArray = (start, end) => {
    let array = [];
    for (let i of range(start, end)) {
        array.push(i);
    }
    return array;
};

const attMetricas = () => {
    metricas.innerHTML = "";
    if (maquinas.value) {
        axios
            .post("/maquina/lista-componentes", {
                id: Number(maquinas.value)
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
                        option.setAttribute(
                            "id",
                            `medicao${id_categoria_medicao}`
                        );
                        option.innerText = getTipo(tipo);
                        metricas.appendChild(option);
                    });
                }
            });
    } else {
        metricas.disabled = true;
    }
};

const mostrarCorrelacao = () => {
    document.querySelector("#tableCorrelacao").innerHTML = "";
    axios
        .post("/analytics/correlacao", {
            maquina: maquinas.value
        })
        .then(({data: {status, msg}}) => {
            // console.log(status)
            if (status === "ok") {
                msg.forEach(corr => {
                    let tr = document.createElement("tr");
                    let tdMetrica1 = document.createElement("td");
                    let tdMetrica2 = document.createElement("td");
                    let tdCorrelacao = document.createElement("td");
                    tr.appendChild(tdMetrica1);
                    tr.appendChild(tdMetrica2);
                    tr.appendChild(tdCorrelacao);

                    tdMetrica1.innerHTML = getTipo(corr.x.tipo);
                    tdMetrica2.innerHTML = getTipo(corr.y.tipo);
                    tdCorrelacao.innerHTML = `${corr.corrStr} \n${corr.corrSentido}`;

                    document.querySelector("#tableCorrelacao").appendChild(tr);

                    // atualizando gráfico de correlação
                    let linear = corr.coefficients.linear;
                    let angular = corr.coefficients.angular;

                    tr.onclick = () => {
                        let data = [];
                        let index = Math.floor(
                            (corr.median - linear) / angular
                        );
                        for (let i of range(index, index + 15)) {
                            data.push(linear + angular * i);
                        }

                        chartCor.data.datasets[0].data = data.map(dado =>
                            Number(dado.toFixed(3))
                        );
                        chartCor.data.labels = rangeArray(index, index + 15);
                        chartCor.update();
                    };
                });
            } else {
                console.error(msg);
            }
        });
};

const mostrarInfoMedicoes = () => {
    if (metricas.value == 0) {
        axios
            .post("/medicao/stats", {
                maquina: maquinas.value
                // idCategoriaMedicao: metricas.value
            })
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
    } else {
        axios
            .post("/medicao/stats", {
                idCategoriaMedicao: metricas.value
            })
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
    }
};

const mostrarInfoChamado = () => {
    axios
        .post("/chamado/stats", {
            maquina: maquinas.value
        })
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

const mostrarInfoTrendline = () => {
    document.querySelector("#tableTrendline").innerHTML = "";
    if (metricas.value > 0) {
        axios
            .post("/analytics/trend", {
                idCategoriaMedicao: metricas.value
            })
            .then(({data: {msg, status}}) => {
                console.log(status);
                console.log(msg);
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
                id: Number(maquinas.value)
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
                        ).innerHTML;

                        axios
                            .post("/analytics/trend", {
                                idCategoriaMedicao: id_categoria_medicao
                            })
                            .then(({data: {msg, status}}) => {
                                tdTendencia.innerHTML = `${msg.orientacao} ${msg.comportamento}`;
                                tr.onclick = () => {
                                    let angular = msg.coefficients.angular;
                                    let linear = msg.coefficients.linear;

                                    let data = [];
                                    let index = Math.floor(
                                        (msg.median - linear) / angular
                                    );
                                    for (let i of range(index, index + 15)) {
                                        data.push(linear + angular * i);
                                    }
                                    let indexes = rangeArray(index, index + 15);
                                    chartTrendline.data.datasets[0].data =
                                        data.map(dado =>
                                            Number(dado.toFixed(3))
                                        );
                                    chartTrendline.data.labels =
                                        Math.abs(indexes[0]) >
                                        Math.abs(indexes[1])
                                            ? indexes
                                                  .reverse()
                                                  .map(num => Math.abs(num))
                                            : indexes;

                                    chartTrendline.update();
                                };
                            });

                        document
                            .querySelector("#tableTrendline")
                            .appendChild(tr);
                    });
                }
            });
    }
};
const btnEmail = document.querySelector("#botao-email");
btnEmail.addEventListener("click", async e => {
    e.preventDefault();
    import("./modal.js").then(({abrirModal}) =>
        abrirModal("modal-email-relatorio")
    );
    let elMaquinas;
    const btnTodas = document.querySelector("#btn-todas");
    const btnMaquina = document.querySelector("#btn-maquina");
    const btnCancelar = document.querySelector(".cancelar");
    btnCancelar.addEventListener("click", () => {
        import("./modal.js").then(({fecharModal}) =>
            fecharModal("modal-email-relatorio")
        );
    });
    btnTodas.addEventListener("click", () => {
        elMaquinas = maquinas.children;
        getMaquinas(elMaquinas);
    });
    btnMaquina.addEventListener("click", () => {
        elMaquinas = maquinas.selectedOptions;
        getMaquinas(elMaquinas);
    });
});

const getMaquinas = elMaquinas => {
    let maquinasRelatorio = [...elMaquinas].map(elMaquina => ({
        pk_maquina: Number(elMaquina.value),
        nomeMaquina: elMaquina.text
    }));
    axios
        .post("/analytics/email-relatorio", {id, maquinas: maquinasRelatorio})
        .then(({data: {status, msg}}) => {
            if (status == "ok") {
                mostrarAlerta(msg, "success");
            } else if (status == "alerta") {
                mostrarAlerta(msg, "warning");
            } else {
                console.error(msg);
            }
        })
        .catch(err => {
            console.error(err);
            mostrarAlerta(
                "Algo deu errado, tente novamente mais tarde",
                "danger"
            );
        });
};

// chart correlação

const dataCor = {
    labels: [],
    datasets: [
        {
            label: "My First Dataset",
            data: [],
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1
        }
    ]
};

const configCor = {
    type: "line",
    data: dataCor
};

const ctxCor = document.getElementById("idChartCorrelacao");

const chartCor = new Chart(ctxCor, configCor);

// chart trendline

const dataTrendline = {
    labels: [],
    datasets: [
        {
            label: "My First Dataset",
            data: [],
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1
        }
    ]
};

const configTrendline = {
    type: "line",
    data: dataTrendline
};

const ctxTrendline = document.getElementById("idChartTrendline");
const chartTrendline = new Chart(ctxTrendline, configTrendline);
function* range(start, end) {
    for (let h = start; h <= end; h++) {
        yield h;
    }
}
