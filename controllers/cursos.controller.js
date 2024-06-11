const db = require('../config/database');
const cursosetiquetas = require('../services/cursosetiquetas.service.');
const documentos = require('./documentos.controller');
const CodigosRespuesta = require('../utils/codigosRespuesta');

let self = {}

self.get = async function(req, res){
    try{
        if(isNaN(req.params.idCurso)){
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al recuperar el curso, el id no es valido");
        }

        await db.connectToDB();

        const obtenerCursos = new db.sql.Request();
        obtenerCursos.input('idCurso', db.sql.Int, req.params.idCurso);

        const respuestaCursos = await obtenerCursos.execute('sps_GetCursoDetalle');

        const cursos = respuestaCursos.recordset;

        if (cursos.length === 0) {
            return res.status(CodigosRespuesta.NOT_FOUND).send("No se encontró el curso");
        }

        const curso = {
            idCurso: cursos[0].idCurso,
            titulo: cursos[0].titulo,
            descripcion: cursos[0].descripcion,
            objetivos: cursos[0].objetivos,
            requisitos: cursos[0].requisitos,
            idUsuario: cursos[0].idUsuario,
            etiquetas: [],
            promedio: cursos[0].promedio
        };

        cursos.forEach(item => {
            if (item.etiquetaNombre) {
                curso.etiquetas.push(item.etiquetaNombre);
            }
        });

        return res.status(CodigosRespuesta.OK).json(curso);

    }catch(error){
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
}


self.create = async function(req, res){
    try{        
        if(isNaN(req.body.idUsuario)){
            return res.status(CodigosRespuesta.NOT_FOUND).json("Error al crear el curso, el idUsuario no es valido");
        }

        const { titulo, descripcion, objetivos, requisitos } = req.body;

        await db.connectToDB();

        const creacionCursoRequest = new db.sql.Request();
        creacionCursoRequest.input('idUsuario', db.sql.Int, req.body.idUsuario);
        creacionCursoRequest.input('titulo', db.sql.NVarChar, titulo);
        creacionCursoRequest.input('descripcion', db.sql.NVarChar, descripcion);
        creacionCursoRequest.input('objetivos', db.sql.NVarChar, objetivos);
        creacionCursoRequest.input('requisitos', db.sql.NVarChar, requisitos);
        creacionCursoRequest.output('status', db.sql.Int);
        creacionCursoRequest.output('result', db.sql.NVarChar(20));
        creacionCursoRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaCreacionCurso = await creacionCursoRequest.execute('spi_cursos');
        const { status, result, message } = respuestaCreacionCurso.output;

        if (status === 404) {
            return res.status(CodigosRespuesta.NOT_FOUND).json("No se encontró el usuario");
        }

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json("Error al crear el curso");
        }

        let archivoCreado = await crearArchivoDelCurso(req.file, result);

        if(archivoCreado.status != CodigosRespuesta.CREATED){
            return res.status(CodigosRespuesta.BAD_REQUEST).json("Error al crear el archivo")
        }

        const etiquetas = JSON.parse(req.body.etiquetas);
        for (let etiquetaId of etiquetas) {
            if(isNaN(etiquetaId)){
                return res.status(CodigosRespuesta.NOT_FOUND).json("Error al crear una de las etiquetas, el id no es valido");
            }

            let etiquetaCreada = await crearCursosEtiquetas(result, etiquetaId);

            if(etiquetaCreada.status!=CodigosRespuesta.CREATED){
                return res.status(CodigosRespuesta.BAD_REQUEST).json("Error al crear una de las etiquetas")
            }
        }

        return res.status(CodigosRespuesta.CREATED).json({ idCurso: result })

    }catch(error){
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: "Error" });
    }
}

self.update = async function(req, res){
    try{
        const { idCurso, titulo, descripcion, objetivos, requisitos, idDocumento } = req.body;

        await db.connectToDB();

        const actualizacionCursoRequest = new db.sql.Request();
        actualizacionCursoRequest.input('idCurso', db.sql.Int, idCurso);
        actualizacionCursoRequest.input('titulo', db.sql.NVarChar, titulo);
        actualizacionCursoRequest.input('descripcion', db.sql.NVarChar, descripcion);
        actualizacionCursoRequest.input('objetivos', db.sql.NVarChar, objetivos);
        actualizacionCursoRequest.input('requisitos', db.sql.NVarChar, requisitos);
        actualizacionCursoRequest.output('status', db.sql.Int);
        actualizacionCursoRequest.output('result', db.sql.NVarChar(20));
        actualizacionCursoRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaActualizacionCurso = await actualizacionCursoRequest.execute('spa_cursos');
        const { status, result, message } = respuestaActualizacionCurso.output;

        if (status == CodigosRespuesta.NOT_FOUND) {
            return res.status(CodigosRespuesta.NOT_FOUND).send({message: message});
        }

        if(isNaN(idDocumento)){
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al actualizar la miniatura, el idDocumento no es valido");
        }
        
        let resultadoArchivo = await actualizarArchivoDelCurso(idDocumento, req.file);

        if(resultadoArchivo !== 404 && resultadoArchivo !== 204){
            return res.status(resultadoArchivo).json("Error al actualizar la miniatura");
        }

        resultadoEtiquetas = await eliminarEtiquetasDelCurso(idCurso);

        if(resultadoEtiquetas.status !== 404 && resultadoEtiquetas.status !== 204){        
            return res.status(resultadoEtiquetas.status).send("Error al actualizar las etiquetas");
        }

        const etiquetas = JSON.parse(req.body.etiquetas);
        for (let etiquetaId of etiquetas) {
            if(isNaN(etiquetaId)){
                return res.status(CodigosRespuesta.NOT_FOUND).send("Error al crear una de las etiquetas, el id no es valido");
            }

            let etiquetaCreada = await crearCursosEtiquetas(idCurso, etiquetaId);
            
            if(etiquetaCreada.status != 201){
                return res.status(CodigosRespuesta.BAD_REQUEST).json("Error al crear una de las etiquetas")
            }
        }
        
        return res.status(CodigosRespuesta.NO_CONTENT).send();

    }catch(error){
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
}

self.delete = async function(req, res){
    try{

        if(isNaN(req.params.idCurso)){
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al eliminar el curso, el id no es valido");
        }

        let idCurso = req.params.idCurso;

        await db.connectToDB();

        const eliminarCursoRequest = new db.sql.Request();
        eliminarCursoRequest.input('idCurso', db.sql.Int, idCurso);
        eliminarCursoRequest.output('status', db.sql.Int);
        eliminarCursoRequest.output('result', db.sql.NVarChar(20));
        eliminarCursoRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaEliminacionCurso = await eliminarCursoRequest.execute('spe_cursos');
        const { status, result, message } = respuestaEliminacionCurso.output;

        if(status === CodigosRespuesta.OK){
            return res.status(CodigosRespuesta.NO_CONTENT).send("Se ha eliminado el curso")
        }else{
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al eliminar el curso")
        }

    }catch(error){
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
}

async function eliminarEtiquetasDelCurso(cursoId) {
    const resultado = await cursosetiquetas.borrarEtiquetasDelCurso(cursoId);
    return resultado;
}

async function crearArchivoDelCurso(documento, idCurso) {
    const resultado = await documentos.crearArchivoDelCurso(documento, idCurso);
    return resultado;
}

async function actualizarArchivoDelCurso(idDocumento, documento) {
    const resultado = await documentos.actualizarArchivoDelCurso(idDocumento, documento);
    return resultado;
}


async function crearCursosEtiquetas(idCurso, etiquetaId) {
    const resultado = await cursosetiquetas.crearCursosEtiquetas(idCurso, etiquetaId);
    return resultado;
}


module.exports = self;