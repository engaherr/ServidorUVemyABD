const cursoModel = require('../models/cursos');
const db = require('../config/database');
const cursosetiquetas = require('../services/cursosetiquetas.service.');
const usuarioscursos = require('./usuarioscursos.controller');
const documentos = require('./documentos.controller');
const CodigosRespuesta = require('../utils/codigosRespuesta');
const claimTypes = require('../config/claimtypes');
const {esEstudianteCurso} = require('../middlewares/autorizacion.middleware');
const curso = db.cursos;
const usuario = db.usuarios;
const etiquetasModel = db.etiquetas;
const cursosetiquetasModel = db.cursosetiquetas;
const usuariocurso = db.usuarioscursos;
const sequelize = db.sequelize;

let self = {}

self.getAll = async function (req, res){
    try{
        let data = await curso.findAll({ attributes: ['idCurso', 'titulo', 'descripcion', 'objetivos', 'requisitos', 'idUsuario']})
        return res.status(CodigosRespuesta.OK).json(data)
    }catch(error){
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
}

self.get = async function(req, res){
    try{
        if(isNaN(req.params.idCurso)){
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al recuperar el curso, el id no es valido");
        }

        let idCurso = req.params.idCurso;
        let cursoRecuperado = await curso.findByPk(idCurso, {
            attributes: ['descripcion', 'objetivos', 'requisitos', 'idUsuario']
        });

        if (cursoRecuperado == null) {
            return res.status(CodigosRespuesta.NOT_FOUND).send("No se encontró el curso");
        }

        let etiquetasRecuperadas = await cursosetiquetasModel.findAll({
            attributes: [
              ['idEtiqueta', 'idEtiqueta'], 
              [sequelize.col('etiqueta.nombre'), 'nombre']
            ], 
            where: { idCurso: idCurso },
            include: [
              {
                model: etiquetasModel,
                attributes: [],
                }
            ],
        });

        let promedioCalificacion = await usuariocurso.findOne({
            attributes: [
              [sequelize.fn('AVG', sequelize.col('Calificacion')), 'calificacion']
            ],
            where: { idCurso: idCurso }
        });

        let rol;
        let profesor = await usuario.findByPk(cursoRecuperado.idUsuario, {
            attributes: ['nombres','apellidos','correoElectronico'],
            where: {idUsuario: cursoRecuperado.idUsuario}
        });
        console.log(profesor);
        const idUsuario = req.tokenDecodificado[claimTypes.Id];
        const esEstudiante = await esEstudianteCurso(idCurso, idUsuario);

        if(cursoRecuperado.idUsuario==idUsuario)
        {
            rol = "Profesor";
        } else if(esEstudiante)
        {
            rol = "Estudiante";
        }
        else
        {
            rol = "Usuario";
        }

        cursoRecuperado = cursoRecuperado.toJSON();
        cursoRecuperado.etiquetas = etiquetasRecuperadas;
        cursoRecuperado.calificacion = promedioCalificacion.calificacion;
        cursoRecuperado.rol = rol;
        cursoRecuperado.profesor = profesor.correoElectronico+": "+profesor.nombres +" "+profesor.apellidos;
        

        return res.status(CodigosRespuesta.OK).json(cursoRecuperado)
    }catch(error){
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
}

self.create = async function(req, res){
    try{
        const idUsuario = req.tokenDecodificado[claimTypes.Id];
        
        if(isNaN(idUsuario)){
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

        // Hasta aca bien

        for (let etiquetaId of req.body.etiquetas) {
            if(isNaN(etiquetaId)){
                return res.status(CodigosRespuesta.NOT_FOUND).json("Error al crear una de las etiquetas, el id no es valido");
            }

            let etiquetaCreada = await crearCursosEtiquetas(cursoCreado.idCurso, etiquetaId, transaccion);
            
            if(etiquetaCreada.status!=CodigosRespuesta.CREATED){
                await transaccion.rollback();
                return res.status(CodigosRespuesta.BAD_REQUEST).json("Error al crear una de las etiquetas")
            }
        }


        return res.status(CodigosRespuesta.CREATED).json(cursoCreado)
    }catch(error){
        if (transaccion && !transaccion.finished) {
            await transaccion.rollback();
        }
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: "Error" });
    }
}

self.update = async function(req, res){
    let transaccion;
    try{
        const idUsuario = req.tokenDecodificado[claimTypes.Id];
        if(isNaN(req.params.idCurso) || isNaN(req.body.idCurso)){
            console.log("Error al actualizar el curso, el id no es valido");
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al actualizar el curso, el id no es valido");
        } else if(req.params.idCurso != req.body.idCurso){
            console.log("Error al actualizar el curso, los id no coinciden");
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al actualizar el curso, los id no coinciden");
        } else if(isNaN(idUsuario)){
            console.log("Error al actualizar el curso, el idUsuario no es valido");
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al actualizar el curso, el idUsuario no es valido");
        }

        let idCurso = req.params.idCurso;
        let cursoRecuperado = await curso.findByPk(idCurso, {
            attributes: ['descripcion', 'objetivos', 'requisitos', 'idUsuario']
        });
        if(cursoRecuperado.idUsuario != idUsuario){
            console.log("CodigosRespuesta.NOT_FOUND cursoRecuperado.idUsuario");
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al actualizar el curso, el idUsuario no es valido");
        }

        let body = {
            id: req.params.idCurso,
            titulo: req.body.titulo,
            descripcion: req.body.descripcion,
            objetivos: req.body.objetivos,
            requisitos: req.body.requisitos,
        };
        let id = req.params.idCurso;

        transaccion = await sequelize.transaction();

        if(isNaN(req.body.idDocumento)){
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al actualizar la miniatura, el idDocumento no es valido");
        }
        
        let resultadoArchivo = await actualizarArchivoDelCurso(req.body.idDocumento, req.file, transaccion);
        if(resultadoArchivo !== 404 && resultadoArchivo !== 204){
            await transaccion.rollback();
            return res.status(resultadoArchivo).json("Error al actualizar la miniatura");
        }

        let data = await curso.update(body, {where: 
            {idCurso:id},
            transaction: transaccion
        });

        resultadoEtiquetas = await eliminarEtiquetasDelCurso(id, transaccion);

        if(resultadoEtiquetas !== 404 && resultadoEtiquetas !== 204){
            console.log("Error al actualizar el curso");
            await transaccion.rollback();
            return res.status(resultadoEtiquetas).send("Error al actualizar las etiquetas");
        }

        for (let etiquetaId of req.body.etiquetas) {
            if(isNaN(etiquetaId)){
                await transaccion.rollback();
                return res.status(CodigosRespuesta.NOT_FOUND).send("Error al crear una de las etiquetas, el id no es valido");
            }
            let etiquetaCreada = await crearCursosEtiquetas(id, etiquetaId, transaccion);
            if(etiquetaCreada.status!=201){
                await transaccion.rollback();
                return res.status(CodigosRespuesta.BAD_REQUEST).json("Error al crear una de las etiquetas")
            }
        }
        await transaccion.commit();
        return res.status(CodigosRespuesta.NO_CONTENT).send();
    }catch(error){
        if (transaccion && !transaccion.finished) {
            await transaccion.rollback();
        }
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
}

self.delete = async function(req, res){
    try{
        const idUsuario = req.tokenDecodificado[claimTypes.Id];
        if(isNaN(req.params.idCurso)){
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al eliminar el curso, el id no es valido");
        }
        let id = req.params.idCurso;
        let cursoRecuperado = await curso.findByPk(id);
        if(cursoRecuperado==null){
            return res.status(CodigosRespuesta.NOT_FOUND).send("No se encontró el curso");
        }
        if(cursoRecuperado.idUsuario != idUsuario){
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al eliminar el curso, el idUsuario no es valido");
        }
        data = await curso.destroy({ where : {idCurso:id}});
        if(data === 1){
            return res.status(CodigosRespuesta.NO_CONTENT).send("Se ha eliminado el curso")
        }else{
            return res.status(CodigosRespuesta.NOT_FOUND).send("Error al eliminar el curso")
        }
    }catch(error){
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
}

async function eliminarEtiquetasDelCurso(cursoId, transaccion) {
    const resultado = await cursosetiquetas.borrarEtiquetasDelCurso(cursoId, transaccion);
    return resultado;
}

async function crearArchivoDelCurso(documento, idCurso) {
    const resultado = await documentos.crearArchivoDelCurso(documento, idCurso);
    return resultado;
}

async function eliminarArchivoDelCurso(documentoId) {
    const resultado = await documentos.borrarArchivoDelCurso(documentoId);
    return resultado;
}

async function actualizarArchivoDelCurso(idDocumento, documento, transaccion) {
    const resultado = await documentos.actualizarArchivoDelCurso(idDocumento, documento, transaccion);
    return resultado;
}


async function crearCursosEtiquetas(idCurso, etiquetaId, transaccion) {
    const resultado = await cursosetiquetas.crearCursosEtiquetas(idCurso, etiquetaId, transaccion);
    return resultado;
}


module.exports = self;