const CodigosRespuesta = require('../utils/codigosRespuesta');
const db = require('../config/database');

let self = {}

self.obtenerPorId = async function(req, res){
    const idClase = req.params.idClase;
    try{
        await db.connectToDB();
        const request = new db.sql.Request();
        request.input('id_clase', db.sql.Int, idClase);
        request.output('status', db.sql.Int);
        request.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuesta = await request.execute('sps_get_detalles_clase');
        const { status, message } = respuesta.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ detalle: [message] });
        }

        const data = respuesta.recordset[0];
    
        return res.status(CodigosRespuesta.OK).json(data);
    }catch(error){
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json(error)
    }
}

self.crear = async function(req, res){
    try{
        await db.connectToDB();
        const request = new db.sql.Request();
        request.input('nombre', db.sql.NVarChar(150), req.body.nombre);
        request.input('descripcion', db.sql.NVarChar(660), req.body.descripcion);
        request.input('id_curso', db.sql.Int, req.body.idCurso);
        request.output('status', db.sql.Int);
        request.output('result', db.sql.Int);
        request.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuesta = await request.execute('spi_clases');
        const { status, result, message } = respuesta.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ detalle: [message] });
        }

        return res.status(CodigosRespuesta.CREATED).json({idClase: result});
    }catch(error){
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json(error);
    }
}

self.actualizar = async function(req, res){
    const idClase = req.body.idClase;
    if(idClase != req.params.idClase){
        return res.status(CodigosRespuesta.BAD_REQUEST).send("IdClase deben ser iguales");
    }

    try{
        await db.connectToDB();
        const request = new db.sql.Request();
        request.input('id_clase', db.sql.Int, idClase);
        request.input('nombre', db.sql.NVarChar(150), req.body.nombre);
        request.input('descripcion', db.sql.NVarChar(660), req.body.descripcion);
        request.output('status', db.sql.Int);
        request.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuesta = await request.execute('spa_clases');
        const { status, message } = respuesta.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ detalle: [message] });
        }

        return res.status(CodigosRespuesta.NO_CONTENT).send();
    }catch(error){
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json(error);
    }
}

self.eliminar = async function(req, res){        
    const idClase = req.params.idClase;
    try{
        await db.connectToDB();
        const request = new db.sql.Request();
        request.input('id_clase', db.sql.Int, idClase);
        request.output('status', db.sql.Int);
        request.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuesta = await request.execute('spe_clases');
        const { status, message } = respuesta.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ detalle: [message] });
        }

        return res.status(CodigosRespuesta.NO_CONTENT).send();
    }catch(error){
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json(error);
    }
}

module.exports = self;


