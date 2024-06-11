const db = require('../config/database');
const CodigosRespuesta = require('../utils/codigosRespuesta');

const crearCursosEtiquetas = async function(idCurso, idEtiqueta){
    try{
        await db.connectToDB();

        const insertarEtiquetasRequest = new db.sql.Request();
        insertarEtiquetasRequest.input('idCurso', db.sql.Int, idCurso);
        insertarEtiquetasRequest.input('idEtiqueta', db.sql.Int, idEtiqueta);
        insertarEtiquetasRequest.output('status', db.sql.Int);
        insertarEtiquetasRequest.output('result', db.sql.NVarChar(20));
        insertarEtiquetasRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaCreacionEtiquetas = await insertarEtiquetasRequest.execute('spi_cursos_etiquetas');
        const { status, result, message } = respuestaCreacionEtiquetas.output;

        if (status !== 200) {
            return { status: CodigosRespuesta.NOT_FOUND, message: "Error al crear la relación entre curso y etiqueta" };
        }

        return { status: CodigosRespuesta.CREATED, message: result }

    }catch(error){
        return { status: CodigosRespuesta.INTERNAL_SERVER_ERROR, message: error  }
    }
}


const borrarEtiquetasDelCurso = async function(cursoId){
    try{
        await db.connectToDB();

        const eliminarEtiquetasRequest = new db.sql.Request();
        eliminarEtiquetasRequest.input('idCurso', db.sql.Int, cursoId);
        eliminarEtiquetasRequest.output('status', db.sql.Int);
        eliminarEtiquetasRequest.output('result', db.sql.NVarChar(20));
        eliminarEtiquetasRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaEliminacionEtiquetas = await eliminarEtiquetasRequest.execute('spe_cursos_etiquetas');
        const { status, result, message } = respuestaEliminacionEtiquetas.output;

        return { status: CodigosRespuesta.NO_CONTENT, message:result }

    }catch(error){
        return { status: 500, message: error.message };
    }
}

module.exports = {crearCursosEtiquetas, borrarEtiquetasDelCurso};