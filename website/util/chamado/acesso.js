let sequelize = require("../../models").sequelize;

const verificarAcesso = async ({idUsuario, idCategoriaMedicao, idChamado}) => {
    let sqlCategoria = ` AND fk_maquina = (SELECT fk_maquina FROM categoria_medicao WHERE id_categoria_medicao = ${idCategoriaMedicao})`;
    let sqlChamado = ` JOIN maquina ON usuario_maquina.fk_maquina = pk_maquina JOIN categoria_medicao ON pk_maquina = categoria_medicao.fk_maquina AND id_categoria_medicao = (SELECT fk_categoria_medicao FROM chamado WHERE id_chamado = ${idChamado})`;
    const sqlUsuarioTemAcesso = `SELECT count(fk_usuario) as usuarios FROM usuario_maquina WHERE fk_usuario = ${idUsuario} ${
        idChamado ? sqlChamado : sqlCategoria
    }`;

    return await sequelize
        .query(sqlUsuarioTemAcesso, {type: sequelize.QueryTypes.SELECT})
        .then(async ([{usuarios}]) => {
            if (usuarios) {
                return true;
            } else {
                const sqlGestorTemAcesso = `SELECT count(fk_usuario) as usuarios FROM usuario_maquina JOIN usuario ON fk_usuario = id_usuario AND fk_supervisor = ${idUsuario} ${
                    idChamado ? sqlChamado : sqlCategoria
                }`;
                return await sequelize
                    .query(sqlGestorTemAcesso, {
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(([{usuarios}]) => {
                        return !!usuarios;
                    });
            }
        });
};

module.exports = {verificarAcesso};
