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
        const { status, result, message } = respuestaCreacionArchivoCurso.output;

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
        const { status2, result2, message2 } = respuestaCreacionArchivoRelaciones.output;


        if(status2 !== 200){
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
        const idTipoArch = await obtenerIdTipoArchivoPDF();
        if(idTipoArch == 0) return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send("Error al crear el documento");

        const archivoBuffer = req.file.buffer;

        const data = await documentos.create({
            archivo: archivoBuffer,
            nombre: req.body.nombre,
            idClase: req.body.idClase,
            idTipoArchivo: idTipoArch
        });

        if(data == null){
            return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send("Error al crear el documento " + req.body.nombre);
        } 

        const respuesta = {
            idDocumento: data.idDocumento,
            nombre: data.nombre,
            idClase: data.idClase,
            idTipoArchivo: data.idTipoArchivo
        }

        return res.status(CodigosRespuesta.CREATED).json(respuesta);
    }catch(error){
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json(error)
    }
}

async function obtenerIdTipoArchivoPDF(){
    let idTipoArchivo;
    try{
        const tipoArchivoVideo = await tiposarchivos.findOne({ where: {nombre: "application/pdf"}, attributes: ['idTipoArchivo']});
        if(tipoArchivoVideo == null){
            const tipoNuevo = await tiposarchivos.create({
                nombre: "application/pdf"
            });
            if(tipoNuevo == null){
                idTipoArchivo = 0;
            }else{
                idTipoArchivo = tipoNuevo.idTipoArchivo;
            }
        }else{
            idTipoArchivo = tipoArchivoVideo.dataValues.idTipoArchivo;
        }
    }catch(error){
        idTipoArchivo = 0;
    }
    return idTipoArchivo;
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

self.actualizarArchivoDelCurso = async function(idDocumento, documento, transaccion){
    try{
        let data = await dbdocumentos.update(
            { archivo: documento.buffer }, 
            {where:{idDocumento:idDocumento}, 
            fields: ['archivo'],
            transaction: transaccion
        });
        
        if(data[0]==0){
            console.log("NOT_FOUND");
            return CodigosRespuesta.NOT_FOUND
        }else{
            console.log("NO_CONTENT");
            return CodigosRespuesta.NO_CONTENT
        }
    }catch(error){
        return { status: CodigosRespuesta.INTERNAL_SERVER_ERROR, message:error.message  }
    }
}



module.exports = self;
