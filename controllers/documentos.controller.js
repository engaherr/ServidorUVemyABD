const db = require('../config/database');
const dbdocumentos = db.documentos;
const cursos = db.cursos;
const { documentos, tiposarchivos, clases } = require('../models');
const CodigosRespuesta = require('../utils/codigosRespuesta');
let self = {}

self.obtenerArchivoPDF = async function(req, res){
    const idDocumento = req.params.idDocumento;
    try{
        let data = await dbdocumentos.findByPk(idDocumento, { 
            attributes: ['idDocumento', 'archivo', 'nombre', 'idTipoArchivo', 'idCurso', 'idClase'],
            include: { model: tiposarchivos, as: 'tiposarchivos'}
        })

        if(data == null){
            return res.status(CodigosRespuesta.NOT_FOUND).send("No se encontró el archivo")
        }
        
        if(data.dataValues.tiposarchivos.nombre != "application/pdf"){
            return res.status(CodigosRespuesta.BAD_REQUEST).send("No puede enviar un documento que no sea PDF");
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=' + data.nombre +'.pdf');

        return res.status(CodigosRespuesta.OK).send(data.archivo);
    }catch(error){
        return res.status(CodigosRespuesta.BAD_REQUEST).json(error);
    }
}

self.borrarArchivoDelCurso = async function(documentoId){
    try{
        let id = documentoId;
        let data = await cursos.findByPk(id);
        if(!data){
            return 404
        }
        data = await dbdocumentos.destroy({ where : {idDocumento:id}});
        if(data >= 1 ){
            return 204
        }else{
            return 404
        }
    }catch(error){
        return { status: 500, message: error.message };
    }
}

self.crearArchivoDelCurso = async function(documento, idCurso){
    try{
        await db.connectToDB();

        const creacionArchivoCursoRequest = new db.sql.Request();
        creacionArchivoCursoRequest.input('archivo', db.sql.VarBinary, documento.buffer);
        creacionArchivoCursoRequest.input('nombre', db.sql.NVarChar, "Miniatura del curso "+ idCurso);
        creacionArchivoCursoRequest.input('idTipoArchivo', db.sql.Int, 1);
        creacionArchivoCursoRequest.output('status', db.sql.Int);
        creacionArchivoCursoRequest.output('result', db.sql.NVarChar(20));
        creacionArchivoCursoRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaCreacionArchivoCurso = await creacionArchivoCursoRequest.execute('spi_archivos');
        var { status, result, message } = respuestaCreacionArchivoCurso.output;

        if (status !== 200) {
            return { status: CodigosRespuesta.INTERNAL_SERVER_ERROR, message: message };
        }

        const creacionArchivoRelacionesRequest = new db.sql.Request();
        creacionArchivoRelacionesRequest.input('idArchivo', db.sql.Int, result);
        creacionArchivoRelacionesRequest.input('idPadre', db.sql.Int, idCurso);
        creacionArchivoRelacionesRequest.input('tipo', db.sql.NVarChar, 'Curso');
        creacionArchivoRelacionesRequest.output('status', db.sql.Int);
        creacionArchivoRelacionesRequest.output('result', db.sql.NVarChar(20));
        creacionArchivoRelacionesRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaCreacionArchivoRelaciones = await creacionArchivoRelacionesRequest.execute('spi_archivos_relaciones');
        var { status, result, message } = respuestaCreacionArchivoRelaciones.output;

        if(status !== 200){
            return { status: CodigosRespuesta.INTERNAL_SERVER_ERROR, message: "Error al crear el documento" };
        }

        return { status: CodigosRespuesta.CREATED, message: 'Documento Creado' };
    }catch(error){
        console.log(error);
        return { status: CodigosRespuesta.INTERNAL_SERVER_ERROR, message: error.message };
    }
}

self.crear = async function(req, res){
    try{
        const { file, nombre, idClase } = req.body;
        const archivoBuffer = file.buffer;

        await db.connectToDB();

        const creacionArchivoRequest = new db.sql.Request();
        creacionArchivoRequest.input('archivo', db.sql.VarBinary, archivoBuffer);
        creacionArchivoRequest.input('nombre', db.sql.NVarChar, nombre);
        creacionArchivoRequest.input('idTipoArchivo', db.sql.Int, 2);
        creacionArchivoRequest.output('status', db.sql.Int);
        creacionArchivoRequest.output('result', db.sql.NVarChar(20));
        creacionArchivoRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaCreacionArchivo = await creacionArchivoRequest.execute('spi_archivos');
        const { status, result, message } = respuestaCreacionArchivo.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send("Error al crear el documento " + req.body.nombre);
        }

        const creacionArchivoRelacionesRequest = new db.sql.Request();
        creacionArchivoRelacionesRequest.input('idArchivo', db.sql.Int, result);
        creacionArchivoRelacionesRequest.input('idPadre', db.sql.Int, idClase);
        creacionArchivoRelacionesRequest.input('tipo', db.sql.NVarChar, 'Clase');
        creacionArchivoRelacionesRequest.output('status', db.sql.Int);
        creacionArchivoRelacionesRequest.output('result', db.sql.NVarChar(20));
        creacionArchivoRelacionesRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaCreacionArchivoRelaciones = await creacionArchivoRelacionesRequest.execute('spi_archivos_relaciones');
        const { status2, result2, message2 } = respuestaCreacionArchivoRelaciones.output;

        if(status2 == null){
            return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send("Error al crear el documento " + req.body.nombre);
        }

        return res.status(CodigosRespuesta.CREATED).json({ idDocumento: result });
    }catch(error){
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json(error)
    }
}

self.eliminarDocumentoClase = async function(req, res){
    const idDocumento = req.params.idDocumento;
    try{
        const documento = await documentos.findByPk(idDocumento, { 
            attributes: ['idDocumento', 'archivo', 'nombre', 'idTipoArchivo', 'idCurso', 'idClase'],
            include: { model: tiposarchivos, as: 'tiposarchivos'}
        });

        if(documento == null){
            return res.status(CodigosRespuesta.NOT_FOUND).send("No existe el documento");
        }
        
        if(documento.dataValues.tiposarchivos.nombre != "application/pdf"){
            return res.status(CodigosRespuesta.BAD_REQUEST).send("No puede eliminar un documento que no sea PDF");
        }

        await documento.destroy();

        return res.status(CodigosRespuesta.NO_CONTENT).send();
    }catch(error){
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json(error)
    }
}

self.actualizarArchivoDelCurso = async function(idDocumento, documento){
    try{

        await db.connectToDB();

        const actualizacionArchivoCursoRequest = new db.sql.Request();
        actualizacionArchivoCursoRequest.input('idArchivo', db.sql.Int, idDocumento);
        actualizacionArchivoCursoRequest.input('archivo', db.sql.VarBinary, documento.buffer);
        actualizacionArchivoCursoRequest.output('status', db.sql.Int);
        actualizacionArchivoCursoRequest.output('result', db.sql.NVarChar(20));
        actualizacionArchivoCursoRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaActualizacionArchivoCurso = await actualizacionArchivoCursoRequest.execute('spa_archivos');
        var { status, result, message } = respuestaActualizacionArchivoCurso.output;

        if (status !== 200) {
            return CodigosRespuesta.NOT_FOUND;
        } else {
            return CodigosRespuesta.NO_CONTENT
        }
        
    }catch(error){
        return { status: CodigosRespuesta.INTERNAL_SERVER_ERROR, message:error.message  }
    }
}



module.exports = self;
