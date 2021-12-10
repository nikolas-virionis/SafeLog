// dependencias
let express = require("express");
let router = express.Router();
let {sequelize, sequelizeAzure} = require("../models");
const {mandarEmail} = require("../util/email/email");
const {
    edicaoMaquina,
    emailUsuarios
} = require("../util/machine-edit/infoEdit");
const {
    maquinasDependentes
} = require("../util/machine-access/dependentMachines");
const {msg} = require("../util/notification/notification");
const {enviarNotificacao} = require("../util/notification/notify");

router.post("/cadastro", async (req, res, next) => {
    let {id, id_maquina, nome, senha, empresa} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });
    id_maquina = id_maquina.replace(/-/g, ":").toLowerCase();
    let maquinaExiste = `SELECT * FROM maquina WHERE id_maquina = '${id_maquina}';`;
    let insertMaquina = `INSERT INTO maquina(id_maquina, nome, senha, fk_empresa) VALUES ('${id_maquina}', '${nome}', MD5('${senha}'), '${empresa}')`;

    await sequelize
        .query(maquinaExiste, {type: sequelize.QueryTypes.SELECT})
        .catch(async err => {
            return Promise.resolve(
                await sequelizeAzure.query(maquinaExiste, {
                    type: sequelizeAzure.QueryTypes.SELECT
                })
            );
        })
        .then(async maquinas => {
            if (maquinas.length)
                return res.json({
                    status: "alerta",
                    msg: "Maquina ja cadastrada"
                });
            await sequelize
                .query(insertMaquina, {
                    type: sequelize.QueryTypes.INSERT
                })
                .catch(async err => {
                    return Promise.resolve();
                })
                .then(async () => {
                    insertMaquina = `INSERT INTO maquina(id_maquina, nome, senha, fk_empresa) VALUES ('${id_maquina}', '${nome}', HASHBYTES('md5', '${senha}'), '${empresa}')`;
                    await sequelizeAzure.query(insertMaquina, {
                        type: sequelizeAzure.QueryTypes.INSERT
                    });
                    return Promise.resolve();
                })
                .then(async () => {
                    // capturando id da máquina insertada
                    let sqlPkMac = `SELECT pk_maquina FROM maquina WHERE id_maquina = '${id_maquina}'`;
                    await sequelize
                        .query(sqlPkMac, {
                            type: sequelize.QueryTypes.SELECT
                        })
                        .catch(async err => {
                            return Promise.resolve(
                                await sequelizeAzure.query(sqlPkMac, {
                                    type: sequelizeAzure.QueryTypes.SELECT
                                })
                            );
                        })
                        .then(async resultPkMac => {
                            console.log(resultPkMac);

                            let pk_maquina = resultPkMac[0].pk_maquina;
                            let insertUsuarioMaquina = `INSERT INTO usuario_maquina(responsavel, fk_usuario, fk_maquina) VALUES ('s', ${id}, ${pk_maquina});`;
                            await sequelize
                                .query(insertUsuarioMaquina, {
                                    type: sequelize.QueryTypes.INSERT
                                })
                                .catch(async err => {
                                    return Promise.resolve();
                                })
                                .then(async () => {
                                    await sequelizeAzure.query(
                                        insertUsuarioMaquina,
                                        {
                                            type: sequelizeAzure.QueryTypes
                                                .INSERT
                                        }
                                    );
                                    return Promise.resolve();
                                })
                                .then(() =>
                                    res.json({
                                        status: "ok",
                                        msg: "Maquina registrada com sucesso",
                                        pk_maquina
                                    })
                                )
                                .catch(err =>
                                    res.json({status: "erro", msg: err})
                                );
                        })
                        .catch(err => res.json({status: "erro", msg: err}));
                })
                .catch(err => res.json({status: "erro", msg: err}));
        })
        .catch(err => res.json({status: "erro", msg: err}));
});

router.post("/lista-dependentes/analista", async (req, res) => {
    let {id, search, main, order} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });
    maquinasDependentes("analista", id, search, main, order).then(maquinas => {
        if (maquinas.status != "ok") {
            res.json({status: "ok", msg: maquinas});
        } else {
            res.json(maquinas);
        }
    });
});

router.post("/lista-dependentes/gestor", async (req, res) => {
    let {id, search, main, order} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });
    maquinasDependentes("gestor", id, search, main, order).then(response => {
        res.json(response);
    });
});

router.post("/lista-dependentes/admin", async (req, res) => {
    let {id, search, main, order} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });
    maquinasDependentes("admin", id, search, main, order).then(response => {
        res.json(response);
    });
});

router.post("/verificar-usuario", async (req, res) => {
    let {id, maquina} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });
    let consulta = `SELECT * FROM usuario_maquina WHERE fk_usuario = ${id} AND fk_maquina = ${maquina};`;

    await sequelize
        .query(consulta, {
            type: sequelize.QueryTypes.SELECT
        })
        .catch(async err =>
            Promise.resolve(
                await sequelizeAzure.query(consulta, {
                    type: sequelizeAzure.QueryTypes.SELECT
                })
            )
        )
        .then(resposta =>
            res.json({
                status: "ok",
                msg: resposta
            })
        )
        .catch(err => res.json({status: "erro", msg: err}));
});

router.post("/componentes", async (req, res) => {
    let {id, componentes} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });

    try {
        for (let componente of componentes) {
            let {acao, nome, limite} = componente;
            if (acao === "insert") {
                let sql = `INSERT INTO categoria_medicao(medicao_limite, fk_maquina, fk_tipo_medicao) VALUES (${limite}, ${id}, (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}'))`;

                await sequelize
                    .query(sql, {type: sequelize.QueryTypes.INSERT})
                    .catch(err => Promise.resolve())
                    .then(async () => {
                        await sequelizeAzure
                            .query(sql, {
                                type: sequelizeAzure.QueryTypes.INSERT
                            })
                            .then(responseAzure => console.log(responseAzure))
                            .catch(err => console.log(err));
                        return Promise.resolve();
                    })
                    .then(response => {})
                    .catch(err => {
                        return res.json({status: "erro", msg: err});
                    });
            } else if (acao === "update") {
                let sql = `UPDATE categoria_medicao SET medicao_limite = ${limite} WHERE fk_maquina = ${id} AND fk_tipo_medicao = (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}')`;
                await sequelize
                    .query(sql, {type: sequelize.QueryTypes.UPDATE})
                    .catch(err => Promise.resolve())
                    .then(async () => {
                        await sequelizeAzure.query(sql, {
                            type: sequelizeAzure.QueryTypes.UPDATE
                        });
                        return Promise.resolve();
                    })
                    .then(response => {})
                    .catch(err => {
                        return res.json({status: "erro", msg: err});
                    });
            } else {
                let deleteSql = `DELETE FROM medicao WHERE fk_categoria_medicao IN (SELECT id_categoria_medicao FROM categoria_medicao JOIN maquina ON fk_maquina = pk_maquina AND pk_maquina = ${id} JOIN tipo_medicao ON id_tipo_medicao = fk_tipo_medicao AND tipo_medicao.tipo = '${nome}')`;

                await sequelize
                    .query(deleteSql, {
                        type: sequelize.QueryTypes.DELETE
                    })
                    .catch(err => Promise.resolve())
                    .then(async () => {
                        await sequelizeAzure
                            .query(deleteSql, {
                                type: sequelizeAzure.QueryTypes.DELETE
                            })
                            .then(async responseAzure =>
                                console.log(responseAzure)
                            )
                            .catch(async err => console.log(err));
                        return Promise.resolve();
                    })
                    .then(async () => {
                        // delete solucao
                        let sqlDelSolucao = `DELETE FROM solucao WHERE fk_chamado IN (SELECT id_chamado FROM chamado WHERE fk_categoria_medicao IN (SELECT id_categoria_medicao FROM categoria_medicao WHERE fk_maquina = ${id} AND fk_tipo_medicao IN (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}')))`;

                        await sequelize
                            .query(sqlDelSolucao, {
                                type: sequelize.QueryTypes.DELETE
                            })
                            .then(async responseAws => console.log(responseAws))
                            .catch(err => console.log(err));

                        // delete chamado
                        let sqlDelChamado = `DELETE FROM chamado WHERE fk_categoria_medicao IN (SELECT id_categoria_medicao FROM categoria_medicao WHERE fk_maquina = ${id} AND fk_tipo_medicao IN (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}'))`;

                        await sequelize
                            .query(sqlDelChamado, {
                                type: sequelize.QueryTypes.DELETE
                            })
                            .catch(err => Promise.resolve())
                            .then(async () => {
                                sequelizeAzure
                                    .query(sqlDelChamado, {
                                        type: sequelize.QueryTypes.DELETE
                                    })
                                    .then(async responseAzure =>
                                        console.log(responseAzure)
                                    )
                                    .catch(err => console.log(err));
                            })
                            .catch(err => console.log(err));

                        let sql = `DELETE FROM categoria_medicao WHERE fk_maquina = ${id} AND fk_tipo_medicao = (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}')`;
                        await sequelize
                            .query(sql, {type: sequelize.QueryTypes.DELETE})
                            .catch(err => Promise.resolve())
                            .then(async () => {
                                await sequelizeAzure
                                    .query(sql, {
                                        type: sequelizeAzure.QueryTypes.DELETE
                                    })
                                    .then(async responseAzure =>
                                        console.log(responseAzure)
                                    )
                                    .catch(async err => console.log(err));
                                return Promise.resolve();
                            })
                            .then(response => {})
                            .catch(err => {
                                return res.json({status: "erro2", msg: err});
                            });
                    })
                    .catch(err => {
                        return res.json({status: "erro1", msg: err});
                    });
            }
        }
        res.json({status: "ok", msg: "Componentes atualizados"});
    } catch (err) {
        return res.json({status: "erro", msg: err});
    }
});

router.post("/lista-componentes", async (req, res) => {
    let {id} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });

    let sql = `SELECT id_categoria_medicao, tipo, medicao_limite FROM categoria_medicao JOIN tipo_medicao ON id_tipo_medicao = fk_tipo_medicao AND fk_maquina = ${id} `;

    await sequelize
        .query(sql, {type: sequelize.QueryTypes.SELECT})
        .catch(async err =>
            Promise.resolve(
                await sequelizeAzure.query(sql, {
                    type: sequelizeAzure.QueryTypes.SELECT
                })
            )
        )
        .then(response => {
            res.json({status: "ok", msg: response});
        })
        .catch(err => {
            return res.json({status: "erro", msg: err});
        });
});

// delete maquina
router.post("/delete", async (req, res, next) => {
    let {id} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });

    /*
        sequência de deletes

        usuario_maquina -> medicao   -> categoria_medicao -> maquina
    */

    // estrutura de deletes

    let sqlMaquinaExiste = `SELECT * FROM maquina WHERE pk_maquina = ${id}`;

    await sequelize
        .query(sqlMaquinaExiste, {type: sequelize.QueryTypes.SELECT})
        .catch(async err =>
            Promise.resolve(
                await sequelizeAzure.query(sqlMaquinaExiste, {
                    type: sequelizeAzure.QueryTypes.SELECT
                })
            )
        )
        .then(async ([maquinaExiste]) => {
            if (maquinaExiste) {
                let sql = `SELECT id_categoria_medicao FROM categoria_medicao WHERE fk_maquina = ${id}`;
                await sequelize
                    .query(sql, {type: sequelize.QueryTypes.SELECT})
                    .catch(async err =>
                        Promise.resolve(
                            await sequelizeAzure.query(sql, {
                                type: sequelizeAzure.QueryTypes.SELECT
                            })
                        )
                    )
                    .then(async fkCategorias => {
                        let metricas = fkCategorias.map(
                            item => item.id_categoria_medicao
                        );

                        // delete medicao
                        for (let metrica of metricas) {
                            let sqlDelMedicao = `DELETE FROM medicao WHERE fk_categoria_medicao = ${metrica}`;
                            sequelize
                                .query(sqlDelMedicao, {
                                    type: sequelize.QueryTypes.DELETE
                                })
                                .catch(err => Promise.resolve())
                                .then(async () => {
                                    await sequelizeAzure.query(sqlDelMedicao, {
                                        type: sequelizeAzure.QueryTypes.DELETE
                                    });
                                    return Promise.resolve();
                                })
                                .then(async resultMedicao => {
                                    console.log(resultMedicao);

                                    //  delete categoria_medicao
                                    let sqlDelCategoria = `DELETE FROM categoria_medicao WHERE id_categoria_medicao = ${metrica}`;

                                    await sequelize
                                        .query(sqlDelCategoria, {
                                            type: sequelize.QueryTypes.DELETE
                                        })
                                        .catch(err => Promise.resolve())
                                        .then(async () => {
                                            await sequelizeAzure.query(
                                                sqlDelCategoria,
                                                {
                                                    type: sequelizeAzure
                                                        .QueryTypes.DELETE
                                                }
                                            );
                                            return Promise.resolve();
                                        })
                                        .then(async resultCategoria => {
                                            console.log(resultCategoria);
                                        })
                                        .catch(err => {
                                            return res.json({
                                                status: "erro 1",
                                                msg: err
                                            });
                                        });
                                })
                                .catch(err => {
                                    return res.json({
                                        status: "erro 2",
                                        msg: err
                                    });
                                });
                        }

                        // delete usuario máquina
                        let sqlDelUsMac = `DELETE FROM usuario_maquina WHERE fk_maquina = ${id}`;

                        await sequelize
                            .query(sqlDelUsMac, {
                                type: sequelize.QueryTypes.DELETE
                            })
                            .catch(err => Promise.resolve())
                            .then(async () => {
                                await sequelizeAzure.query(sqlDelUsMac, {
                                    type: sequelizeAzure.QueryTypes.DELETE
                                });
                                return Promise.resolve();
                            })
                            .then(async resultUsMac => {
                                let sqlDeleteMac = `DELETE FROM maquina WHERE pk_maquina = ${id};`;

                                await sequelize
                                    .query(sqlDeleteMac, {
                                        type: sequelize.QueryTypes.DELETE
                                    })
                                    .catch(err => Promise.resolve())
                                    .then(async () => {
                                        await sequelizeAzure.query(
                                            sqlDeleteMac,
                                            {
                                                type: sequelizeAzure.QueryTypes
                                                    .DELETE
                                            }
                                        );
                                        return Promise.resolve();
                                    })
                                    .then(async resultMac => {
                                        console.log(resultMac);
                                        res.json({
                                            status: "ok",
                                            msg: "Maquina deletada"
                                        });
                                    })
                                    .catch(err =>
                                        res.json({status: "erro 3", msg: err})
                                    );
                            })
                            .catch(err =>
                                res.json({status: "erro 4", msg: err})
                            );
                    })
                    .catch(err => res.json({status: "erro 5", msg: err}));
            } else {
                res.json({status: "alerta", msg: "Maquina não encontrada"});
            }
        });
});

router.post("/access-permission", async (req, res) => {
    let {id, maquina} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });

    let sql = `INSERT INTO usuario_maquina(responsavel, fk_usuario, fk_maquina) VALUES ('n', ${id}, ${maquina});`;

    await sequelize
        .query(sql, {type: sequelize.QueryTypes.INSERT})
        .catch(async err => Promise.resolve())
        .then(async () => {
            await sequelizeAzure.query(sql, {
                type: sequelizeAzure.QueryTypes.INSERT
            });
            return Promise.resolve();
        })
        .then(response => {
            res.json({status: "ok", msg: "Permissão concedida com sucesso"});
        })
        .catch(err => {
            return res.json({status: "erro", msg: err});
        });
});

router.post("/lista-usuarios", async (req, res) => {
    let {id, search, main, order} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });

    let sql = `SELECT id_usuario, nome, email FROM usuario JOIN usuario_maquina ON id_usuario = fk_usuario AND fk_maquina = ${id} AND responsavel = 'n' ${
        search
            ? ` WHERE email LIKE '%${search}%' OR nome LIKE '%${search}%'`
            : ""
    } ${main ? ` ORDER BY ${main} ${order}` : ""}`;

    await sequelize
        .query(sql, {type: sequelize.QueryTypes.SELECT})
        .catch(async err =>
            Promise.resolve(
                await sequelizeAzure.query(sql, {
                    type: sequelizeAzure.QueryTypes.SELECT
                })
            )
        )
        .then(response => {
            res.json({status: "ok", msg: response});
        })
        .catch(err => {
            return res.json({status: "erro", msg: err});
        });
});

router.post("/convite", async (req, res) => {
    let {email, maquina} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });

    let usuarioExisteEmStaff = `SELECT * FROM staff WHERE email = '${email}'`;
    let usuarioExiste = `SELECT id_usuario, nome, cargo FROM usuario WHERE email = '${email}'`;
    let usuarioMaquinaExiste = `SELECT * FROM usuario_maquina WHERE fk_maquina = ${maquina} AND fk_usuario = (SELECT id_usuario FROM usuario WHERE email = '${email}') `;
    await sequelize
        .query(usuarioExisteEmStaff, {
            type: sequelize.QueryTypes.SELECT
        })
        .catch(async err =>
            Promise.resolve(
                await sequelizeAzure.query(usuarioExisteEmStaff, {
                    type: sequelizeAzure.QueryTypes.SELECT
                })
            )
        )
        .then(async response => {
            if (response.length)
                return res.json({
                    status: "alerta",
                    msg: "Usuario cadastrado como staff"
                });

            await sequelize
                .query(usuarioExiste, {
                    type: sequelize.QueryTypes.SELECT
                })
                .catch(async err =>
                    Promise.resolve(
                        await sequelizeAzure.query(usuarioExiste, {
                            type: sequelizeAzure.QueryTypes.SELECT
                        })
                    )
                )
                .then(async resposta => {
                    if (!resposta.length)
                        return res.json({
                            status: "alerta",
                            msg: "Usuario cadastrado como staff"
                        });

                    let {id_usuario: id, nome, cargo} = resposta[0];
                    if (cargo != "analista") {
                        return res.json({
                            status: "alerta",
                            msg: "Usuario cadastrado como gestor"
                        });
                    }
                    await sequelize
                        .query(usuarioMaquinaExiste, {
                            type: sequelize.QueryTypes.SELECT
                        })
                        .catch(async err =>
                            Promise.resolve(
                                await sequelizeAzure.query(
                                    usuarioMaquinaExiste,
                                    {
                                        type: sequelizeAzure.QueryTypes.SELECT
                                    }
                                )
                            )
                        )
                        .then(async result => {
                            if (result.length)
                                return res.json({
                                    status: "alerta",
                                    msg: "Usuario já possui acesso à maquina"
                                });
                            let insertUsuarioMaquina = `INSERT INTO usuario_maquina(responsavel, fk_usuario, fk_maquina) VALUES ('n', ${id}, ${maquina})`;
                            await sequelize
                                .query(insertUsuarioMaquina, {
                                    type: sequelize.QueryTypes.INSERT
                                })
                                .catch(async err => Promise.resolve())
                                .then(async () => {
                                    await sequelizeAzure.query(
                                        insertUsuarioMaquina,
                                        {
                                            type: sequelizeAzure.QueryTypes
                                                .INSERT
                                        }
                                    );

                                    return Promise.resolve();
                                })
                                .catch(err => {
                                    console.log(err);
                                    return Promise.resolve();
                                })
                                .then(async () => {
                                    let sql = `SELECT usuario.nome as resp, maquina.nome as nomeMaquina from usuario JOIN usuario_maquina ON fk_usuario = id_usuario AND responsavel = 's' JOIN maquina ON fk_maquina = pk_maquina AND pk_maquina = ${maquina}`;

                                    await sequelize
                                        .query(sql, {
                                            type: sequelize.QueryTypes.SELECT
                                        })
                                        .catch(async err =>
                                            Promise.resolve(
                                                await sequelizeAzure.query(
                                                    sql,
                                                    {
                                                        type: sequelizeAzure
                                                            .QueryTypes.SELECT
                                                    }
                                                )
                                            )
                                        )
                                        .then(([{resp, nomeMaquina}]) => {
                                            mandarEmail(
                                                "convite de acesso",
                                                nome,
                                                email,
                                                [nomeMaquina, resp]
                                            )
                                                .then(() => {
                                                    enviarNotificacao(
                                                        [
                                                            {
                                                                id_usuario: id
                                                            }
                                                        ],
                                                        {
                                                            tipo: "convite de acesso",
                                                            msg: msg(
                                                                "convite de acesso",
                                                                nome,
                                                                [
                                                                    nomeMaquina,
                                                                    resp
                                                                ],
                                                                email
                                                            )
                                                        }
                                                    ).then(() => {
                                                        res.json({
                                                            status: "ok",
                                                            msg: "Acesso garantido à maquina"
                                                        });
                                                    });
                                                })
                                                .catch(err => {
                                                    res.json({
                                                        status: "erro",
                                                        msg: err
                                                    });
                                                });
                                        })
                                        .catch(err => {
                                            res.json({
                                                status: "erro",
                                                msg: err
                                            });
                                        });
                                })
                                .catch(err => {
                                    res.json({
                                        status: "erro",
                                        msg: err
                                    });
                                });
                        })
                        .catch(err => {
                            return res.json({status: "erro", msg: err});
                        });
                })
                .catch(err => {
                    return res.json({status: "erro", msg: err});
                });
        })
        .catch(err => {
            return res.json({status: "erro", msg: err});
        });
});

// update de dados da máquina
router.post("/update", async (req, res, next) => {
    let {idAtual, novoId, novoNome, senhaAtual, novaSenha} = req.body;

    if (!req.body) {
        res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });
    }

    let selectType = {type: sequelize.QueryTypes.SELECT};

    // verificando se máquina existe
    let sqlMacExists = `SELECT nome FROM maquina WHERE id_maquina = '${idAtual}'`;

    await sequelize
        .query(sqlMacExists, selectType)
        .then(async ([resultMacExists]) => {
            if (resultMacExists) {
                // máquina existe

                edicaoMaquina(
                    idAtual,
                    novoId,
                    novoNome,
                    senhaAtual,
                    novaSenha,
                    selectType
                )
                    .then(async resp => {
                        if (resp.status == "ok") {
                            let sql = `SELECT id_usuario, usuario.nome, email, responsavel FROM usuario JOIN usuario_maquina ON fk_usuario = id_usuario JOIN maquina ON fk_maquina = pk_maquina AND id_maquina = '${novoId}' ORDER BY responsavel ASC`;

                            await sequelize
                                .query(sql, selectType)
                                .then(async usuarios => {
                                    if (usuarios.length - 1) {
                                        // res.json({status: "ok", msg: "oi"});
                                        return emailUsuarios(usuarios)
                                            .then(() => {
                                                res.json({
                                                    status: "ok",
                                                    msg: "Emails de notificação de edição de máquina enviados"
                                                });
                                            })
                                            .catch(err => {
                                                res.json({
                                                    status: "erro1",
                                                    msg: err
                                                });
                                            });
                                    } else {
                                        res.json({
                                            status: "ok",
                                            msg: "Maquina editada"
                                        });
                                    }
                                })
                                .catch(err =>
                                    res.json({status: "erro2", msg: err})
                                );
                        } else {
                            return res.json({status: "erro3", msg: resp.msg});
                        }
                    })
                    .catch(err => {
                        return res.json(err);
                    });
            } else {
                // máquina não existe
                return res.json({
                    status: "alerta",
                    msg: `A máquina de id ${idAtual} não está cadastrada`
                });
            }
        })
        .catch(err => res.json({status: "erro4", msg: err}));
});

router.post("/dados", async (req, res) => {
    let {maquina} = req.body;
    if (!req.body)
        return res.json({
            status: "alerta",
            msg: "Body não fornecido na requisição"
        });

    let sql;
    if (typeof maquina == "string")
        sql = `SELECT pk_maquina, id_maquina, nome, fk_empresa FROM maquina WHERE id_maquina = '${maquina}'`;
    else
        sql = `SELECT pk_maquina, id_maquina, nome, fk_empresa FROM maquina WHERE pk_maquina = ${maquina}`;
    await sequelize
        .query(sql, {type: sequelize.QueryTypes.SELECT})
        .catch(async err =>
            Promise.resolve(
                await sequelizeAzure.query(sql, {
                    type: sequelizeAzure.QueryTypes.SELECT
                })
            )
        )
        .then(async ([msg]) => {
            res.json({status: "ok", msg});
        })
        .catch(err => res.json({status: "erro", msg: err}));
});

module.exports = router;
