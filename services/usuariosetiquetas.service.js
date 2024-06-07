const CodigosRespuesta = require('../utils/codigosRespuesta');
const db = require('../config/database');

const crearUsuariosEtiquetas = async function(idUsuario, idEtiqueta){
    try{
        await db.connectToDB();

        const insertarEtiquetasRequest = new db.sql.Request();
        insertarEtiquetasRequest.input('idUsuario', db.sql.Int, idUsuario);
        insertarEtiquetasRequest.input('idEtiqueta', db.sql.Int, idEtiqueta);
        insertarEtiquetasRequest.output('status', db.sql.Int);
        insertarEtiquetasRequest.output('result', db.sql.NVarChar(20));
        insertarEtiquetasRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaCreacionEtiquetas = await insertarEtiquetasRequest.execute('spi_usuarios_etiquetas');
        const { status, result, message } = respuestaCreacionEtiquetas.output;

        if (!status === 200) {
            return { status: CodigosRespuesta.BAD_REQUEST, message: "Error al crear la relación entre usuario y etiqueta" };
        }

        return { status: CodigosRespuesta.CREATED, message: result }
    }catch(error){
        return { status: CodigosRespuesta.INTERNAL_SERVER_ERROR, message:error  }
    }
}


const borrarEtiquetasDelUsuario = async function(idUsuario){
    try{
        await db.connectToDB();

        const borrarEtiquetasRequest = new db.sql.Request();
        borrarEtiquetasRequest.input('idUsuario', db.sql.Int, idUsuario);
        borrarEtiquetasRequest.output('status', db.sql.Int);
        borrarEtiquetasRequest.output('result', db.sql.NVarChar(20));
        borrarEtiquetasRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaEliminacionEtiquetas = await borrarEtiquetasRequest.execute('spe_usuarios_etiquetas');
        const { status, result, message } = respuestaEliminacionEtiquetas.output;

        if (status === CodigosRespuesta.NOT_FOUND)
            return CodigosRespuesta.NOT_FOUND;
        
        if (status === CodigosRespuesta.OK)
            return CodigosRespuesta.NO_CONTENT;
        else
            return CodigosRespuesta.NOT_FOUND;
    }catch(error){
        return { status: 500, message: error.message };
    }
}

module.exports = {crearUsuariosEtiquetas, borrarEtiquetasDelUsuario};