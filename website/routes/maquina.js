// dependencias
let express = require("express");
let router = express.Router();
let sequelize = require("../models").sequelize;
const {mandarEmail} = require("../util/email/email");

router.post("/cadastro", async (req, res, next) => {
    let {id, id_maquina, nome, senha, empresa} = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });
    id_maquina = id_maquina.replace(/-/g, ":").toLowerCase();
    let maquinaExiste = `SELECT * FROM maquina WHERE id_maquina = '${id_maquina}';`;
    let insertMaquina = `INSERT INTO maquina(id_maquina, nome, senha, fk_empresa) VALUES ('${id_maquina}', '${nome}', MD5('${senha}'), '${empresa}')`;

    await sequelize
        .query(maquinaExiste, {type: sequelize.QueryTypes.SELECT})
        .then(async maquinas => {
            if (maquinas.length == 0) {
                await sequelize
                    .query(insertMaquina, {
                        type: sequelize.QueryTypes.INSERT
                    })
                    .then(async response => {
                        // capturando id da máquina insertada
                        let sqlPkMac = `SELECT pk_maquina FROM maquina WHERE id_maquina = '${id_maquina}'`;
                        await sequelize
                            .query(sqlPkMac, {
                                type: sequelize.QueryTypes.SELECT
                            })
                            .then(async resultPkMac => {
                                console.log(resultPkMac);

                                let pk_maquina = resultPkMac[0].pk_maquina;
                                let insertUsuarioMaquina = `INSERT INTO usuario_maquina(responsavel, fk_usuario, fk_maquina) VALUES ('s', ${id}, ${pk_maquina});`;
                                await sequelize
                                    .query(insertUsuarioMaquina, {
                                        type: sequelize.QueryTypes.INSERT
                                    })
                                    .then(responsta =>
                                        res.json({
                                            status: "ok",
                                            msg: "Maquina registrada com sucesso",
                                            pk_maquina
                                        })
                                    )
                                    .catch(err =>
                                        res.json({status: "erro", msg: err})
                                    );
                            });
                    })
                    .catch(err => res.json({status: "erro", msg: err}));
            } else res.json({status: "erro", msg: "Maquina ja cadastrada"});
        })
        .catch(err => res.json({status: "erro", msg: err}));
});

router.post("/lista-dependentes", async (req, res) => {
    let {id} = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });
    let dependentes = `SELECT pk_maquina, id_maquina, nome FROM maquina JOIN usuario_maquina ON fk_maquina = pk_maquina and fk_usuario = ${id}`;
    await sequelize
        .query(dependentes, {type: sequelize.QueryTypes.SELECT})
        .then(async response => {
            let maquinas = [];
            for (let {pk_maquina, id_maquina, nome} of response) {
                let responsavel = `SELECT usuario.nome FROM usuario JOIN usuario_maquina ON fk_usuario = id_usuario and responsavel = 's' and fk_maquina = ${pk_maquina};`;
                await sequelize
                    .query(responsavel, {
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(([{nome: usuario}]) =>
                        maquinas.push({
                            pk_maquina,
                            id_maquina,
                            nome,
                            responsavel: usuario
                        })
                    )
                    .catch(err => res.json({status: "erro", err}));
            }
            res.json({status: "ok", res: maquinas});
        })
        .catch(err => res.json({status: "erro", msg: err}));
});

router.post("/verificar-usuario", async (req, res) => {
    let {id, maquina} = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });
    let consulta = `SELECT * FROM usuario_maquina WHERE fk_usuario = ${id} AND fk_maquina = ${maquina};`;

    await sequelize
        .query(consulta, {
            type: sequelize.QueryTypes.SELECT
        })
        .then(resposta =>
            res.json({
                status: "ok",
                msg: resposta
            })
        )
        .catch(err => res.json({status: "erro", err}));
});

router.post("/componentes", async (req, res) => {
    let {id, componentes} = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });

    try {
        for (let componente of componentes) {
            let {acao, nome, limite} = componente;
            if (acao === "insert") {
                let sql = `INSERT INTO categoria_medicao VALUES (NULL, ${limite}, ${id}, (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}'))`;
                await sequelize
                    .query(sql, {type: sequelize.QueryTypes.INSERT})
                    .then(response => {})
                    .catch(err => {
                        res.json({status: "erro", msg: err});
                    });
            } else if (acao === "update") {
                let sql = `UPDATE categoria_medicao SET medicao_limite = ${limite} WHERE fk_maquina = ${id} AND fk_tipo_medicao = (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}')`;
                await sequelize
                    .query(sql, {type: sequelize.QueryTypes.UPDATE})
                    .then(response => {})
                    .catch(err => {
                        res.json({status: "erro", msg: err});
                    });
            } else {
                let sql = `DELETE FROM categoria_medicao WHERE fk_maquina = ${id} AND fk_tipo_medicao = (SELECT id_tipo_medicao FROM tipo_medicao WHERE tipo = '${nome}')`;
                await sequelize
                    .query(sql, {type: sequelize.QueryTypes.DELETE})
                    .then(response => {})
                    .catch(err => {
                        res.json({status: "erro", msg: err});
                    });
            }
        }
        res.json({status: "ok", msg: "Componentes atualizados"});
    } catch (err) {
        res.json({status: "erro", msg: err});
    }
});

router.post("/lista-componentes", async (req, res) => {
    let {id} = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });

    let sql = `SELECT tipo, medicao_limite FROM categoria_medicao JOIN tipo_medicao ON id_tipo_medicao = fk_tipo_medicao AND fk_maquina = ${id}`;

    await sequelize
        .query(sql, {type: sequelize.QueryTypes.SELECT})
        .then(response => {
            res.json({status: "ok", msg: response});
        })
        .catch(err => {
            res.json({status: "erro", msg: err});
        });
});

// delete maquina
router.post("/delete", async (req, res, next) => {
    let {id} = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });

    /*
        sequência de deletes

        usuario_maquina -> medicao   -> categoria_medicao -> maquina
    */

    // estrutura de deletes

    let sql = `SELECT id_categoria_medicao FROM categoria_medicao WHERE fk_maquina = ${id}`;
    await sequelize
        .query(sql, {type: sequelize.QueryTypes.SEELCT})
        .then(async fkCategorias => {
            let metricas = fkCategorias[0].map(
                item => item.id_categoria_medicao
            );
            console.log(metricas);

            // delete medicao
            for (let metrica of metricas) {
                let sqlDelMedicao = `DELETE FROM medicao WHERE fk_categoria_medicao = ${metrica}`;

                sequelize
                    .query(sqlDelMedicao, {
                        type: sequelize.QueryTypes.DELETE
                    })
                    .then(async resultMedicao => {
                        console.log(resultMedicao);

                        //  delete categoria_medicao
                        let sqlDelCategoria = `DELETE FROM categoria_medicao WHERE id_categoria_medicao = ${metrica}`;

                        await sequelize
                            .query(sqlDelCategoria, {
                                type: sequelize.QueryTypes.DELETE
                            })
                            .then(async resultCategoria => {
                                console.log(resultCategoria);
                            })
                            .catch(err => {
                                res.json({
                                    status: "erro",
                                    msg: err
                                });
                            });
                    })
                    .catch(err => {
                        res.json({status: "erro", msg: err});
                    });
            }

            // delete usuario máquina
            let sqlDelUsMac = `DELETE FROM usuario_maquina WHERE fk_maquina = ${id}`;

            await sequelize
                .query(sqlDelUsMac, {
                    type: sequelize.QueryTypes.DELETE
                })
                .then(async resultUsMac => {
                    let sqlDeleteMac = `DELETE FROM maquina WHERE pk_maquina = ${id};`;

                    await sequelize
                        .query(sqlDeleteMac, {
                            type: sequelize.QueryTypes.DELETE
                        })
                        .then(async resultMac => {
                            console.log(resultMac);
                            res.json({
                                status: "ok",
                                msg: "Maquina deletada"
                            });
                        });
                });
        });
});

router.post("/permissao-acesso", async (req, res) => {
    let {id, maquina} = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });

    let sql = `INSERT INTO usuario_maquina VALUES (null, 'n', ${id}, ${maquina});`;

    await sequelize
        .query(sql, {type: sequelize.QueryTypes.INSERT})
        .then(response => {
            res.json({status: "ok", msg: "Permissão concedida com sucesso"});
        })
        .catch(err => {
            res.json({status: "erro", msg: err});
        });
});

router.post("/lista-usuarios", async (req, res) => {
    let {id} = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });

    let sql = `SELECT nome, email FROM usuario JOIN usuario_maquina ON id_usuario = fk_usuario AND fk_maquina = ${id}`;

    await sequelize
        .query(sql, {type: sequelize.QueryTypes.SELECT})
        .then(response => {
            res.json({status: "ok", msg: response});
        })
        .catch(err => {
            res.json({status: "erro", msg: err});
        });
});

router.post("/convite", async (req, res) => {
    let {email, maquina} = req.body;
    if (!req.body)
        return res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });

    let usuarioExisteEmStaff = `SELECT * FROM staff WHERE email = '${email}'`;
    let usuarioExiste = `SELECT id_usuario, nome, cargo FROM usuario WHERE email = '${email}'`;
    let usuarioMaquinaExiste = `SELECT * FROM usuario_maquina WHERE fk_maquina = ${maquina} AND fk_usuario = (SELECT id_usuario FROM usuario WHERE email = '${email}') `;
    await sequelize
        .query(usuarioExisteEmStaff, {
            type: sequelize.QueryTypes.SELECT
        })
        .then(async response => {
            if (response.length == 0) {
                await sequelize
                    .query(usuarioExiste, {
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(async resposta => {
                        if (resposta.length > 0) {
                            let {id_usuario: id, nome, cargo} = resposta[0];
                            if (cargo != "analista") {
                                return res.json({
                                    status: "erro",
                                    msg: "Usuario cadastrado como gestor"
                                });
                            }
                            await sequelize
                                .query(usuarioMaquinaExiste, {
                                    type: sequelize.QueryTypes.SELECT
                                })
                                .then(async result => {
                                    if (result.length == 0) {
                                        let insertUsuarioMaquina = `INSERT INTO usuario_maquina VALUES (NULL, 'n', ${id}, ${maquina})`;
                                        await sequelize
                                            .query(insertUsuarioMaquina, {
                                                type: sequelize.QueryTypes
                                                    .INSERT
                                            })
                                            .then(async () => {
                                                let sql = `SELECT usuario.nome as resp, maquina.nome as nomeMaquina from usuario JOIN usuario_maquina ON fk_usuario = id_usuario AND responsavel = 's' JOIN maquina ON fk_maquina = pk_maquina AND pk_maquina = ${maquina}`;

                                                await sequelize
                                                    .query(sql, {
                                                        type: sequelize
                                                            .QueryTypes.SELECT
                                                    })
                                                    .then(
                                                        ([
                                                            {resp, nomeMaquina}
                                                        ]) => {
                                                            mandarEmail(
                                                                "convite de acesso",
                                                                nome,
                                                                email,
                                                                [
                                                                    nomeMaquina,
                                                                    resp
                                                                ]
                                                            )
                                                                .then(() => {
                                                                    res.json({
                                                                        status: "ok",
                                                                        msg: "Usuário com acesso à maquina"
                                                                    });
                                                                })
                                                                .catch(err => {
                                                                    res.json({
                                                                        status: "erro",
                                                                        msg: err
                                                                    });
                                                                });
                                                        }
                                                    )
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
                                    } else {
                                        res.json({
                                            status: "erro",
                                            msg: "Usuario já possui acesso à maquina"
                                        });
                                    }
                                })
                                .catch(err => {
                                    res.json({status: "erro", msg: err});
                                });
                        } else {
                            res.json({
                                status: "erro",
                                msg: "Usuario não cadastrado"
                            });
                        }
                    })
                    .catch(err => {
                        res.json({status: "erro", msg: err});
                    });
            } else {
                res.json({
                    status: "erro",
                    msg: "Usuario cadastrado como staff"
                });
            }
        })
        .catch(err => {
            res.json({status: "erro", msg: err});
        });
});

// update de dados da máquina
router.post("/update", async (req, res, next) => {
    let {idAtual, novoId, novoNome, senhaAtual, novaSenha} = req.body;

    if (!req.body) {
        res.json({
            status: "erro",
            msg: "Body não fornecido na requisição"
        });
    }

    let selectType = {type: sequelize.QueryTypes.SELECT};
    let updateType = {type: sequelize.QueryTypes.UPDATE};

    // verificando se máquina existe
    let sqlMacExists = `SELECT nome FROM maquina WHERE id_maquina = '${idAtual}'`;

    await sequelize
        .query(sqlMacExists, selectType)
        .then(async resultMacExists => {
            if (resultMacExists.length === 1) {
                // máquina existe

                if (!!novaSenha && !!senhaAtual) {
                    // alterando informações da máquina, incluindo senha
                    res.json({status: "alterando senha"});
                } else {
                    // mantendo senha, alterando apenas nome e/ou id da máquina
                    let sqlUpdateMac = `UPDATE maquina SET id_maquina = '${novoId}', nome = '${novoNome}' WHERE id_maquina = '${idAtual}'`;

                    await sequelize
                        .query(sqlUpdateMac, updateType)
                        .then(async resultUpdateMac => {
                            let sqlUpdateCatMed = `UPDATE categoria_medicao SET fk_maquina = '${novoId}' WHERE fk_maquina = '${idAtual}'`;

                            await sequelize
                                .query(sqlUpdateCatMed, updateType)
                                .then(async resultCatMed => {
                                    let sqlUpdateUsMac = `UPDATE usuario_maquina SET fk_maquina = '${novoId}' WHERE fk_maquina = '${idAtual}'`;

                                    await sequelize
                                        .query(sqlUpdateUsMac, updateType)
                                        .then(async resultMacUs => {
                                            res.json({
                                                resultUpdateMac,
                                                resultCatMed,
                                                resultMacUs
                                            });
                                        });
                                });
                        });
                }
            } else {
                // máquina não existe
                res.json({
                    status: "erro",
                    msg: `a máquina de id '${idAtual}' não existe ou não está cadastrada`
                });
            }
        });
});

module.exports = router;