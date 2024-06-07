const db = require('../config/database');
const CodigosRespuesta = require('../utils/codigosRespuesta');

let self = {}

self.getAll = async function (req, res){
    try{
        await db.connectToDB();

        const obtenerCursosEtiquetas = new db.sql.Request();
        obtenerCursosEtiquetas.input('idCursosEtiqueta', null);
        obtenerCursosEtiquetas.input('idCurso', null);
        obtenerCursosEtiquetas.input('idEtiqueta', null);

        const respuestaCursosEtiquetas = await obtenerCursosEtiquetas.execute('sps_cursos_etiquetas');

        const cursosEtiquetas = respuestaCursosEtiquetas.recordset;

        return res.status(200).json(cursosEtiquetas)
    }catch(error){
        return res.status(500).json({ error: error.message });
    }
}

self.get = async function(req, res){
    try{
        
        let id = req.params.id;

        await db.connectToDB();

        const obtenerCursosEtiquetas = new db.sql.Request();
        obtenerCursosEtiquetas.input('idCursosEtiqueta', id);
        obtenerCursosEtiquetas.input('idCurso', null);
        obtenerCursosEtiquetas.input('idEtiqueta', null);

        const respuestaCursosEtiquetas = await obtenerCursosEtiquetas.execute('sps_cursos_etiquetas');

        const cursosEtiquetas = respuestaCursosEtiquetas.recordset;

        if(cursosEtiquetas[0]){
            return res.status(200).json(cursosEtiquetas)
        }else{
           return res.status(404).send()
        }

    }catch(error){
        return res.status(500).json({ error: error.message });
    }
}

self.create = async function(req, res){
    try{

        await db.connectToDB();

        const creacionCursosEtiquetasRequest = new db.sql.Request();
        creacionCursosEtiquetasRequest.input('idCurso', db.sql.Int, req.body.idCurso);
        creacionCursosEtiquetasRequest.input('idEtiqueta', db.sql.Int, req.body.idEtiqueta);
        creacionCursosEtiquetasRequest.output('status', db.sql.Int);
        creacionCursosEtiquetasRequest.output('result', db.sql.NVarChar(20));
        creacionCursosEtiquetasRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaCreacionCursosEtiquetas = await creacionCursosEtiquetasRequest.execute('spi_cursos_etiquetas');
        const { status, result, message } = respuestaCreacionCursosEtiquetas.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ message });
        }

        return res.status(201).json({ idCursosEtiqueta: result })
    }catch(error){
        return res.status(500).json({ error: error.message });
    }
}

self.update = async function(req, res){
    try{

        await db.connectToDB();

        const actualizacionCursosEtiquetasRequest = new db.sql.Request();
        actualizacionCursosEtiquetasRequest.input('idCursosEtiqueta', db.sql.Int, req.params.id);
        actualizacionCursosEtiquetasRequest.input('idCurso', db.sql.Int, req.body.idCurso);
        actualizacionCursosEtiquetasRequest.input('idEtiqueta', db.sql.Int, req.body.idEtiqueta);
        actualizacionCursosEtiquetasRequest.output('status', db.sql.Int);
        actualizacionCursosEtiquetasRequest.output('result', db.sql.NVarChar(20));
        actualizacionCursosEtiquetasRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaActualizacionCursosEtiquetas = await actualizacionCursosEtiquetasRequest.execute('spa_cursos_etiquetas');
        const { status, result, message } = respuestaActualizacionCursosEtiquetas.output;

        if (status === CodigosRespuesta.NOT_FOUND)
            return res.status(CodigosRespuesta.NOT_FOUND).json({ message });
        

        if (status !== CodigosRespuesta.OK)
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ message })

        return res.status(CodigosRespuesta.NO_CONTENT).send();

    }catch(error){
        return res.status(500).json({ error: error.message });
    }
}

self.delete = async function(req, res){
    try{

        await db.connectToDB();

        const eliminacionCursosEtiquetasRequest = new db.sql.Request();
        eliminacionCursosEtiquetasRequest.input('idCursosEtiqueta', db.sql.Int, req.params.id);
        eliminacionCursosEtiquetasRequest.output('status', db.sql.Int);
        eliminacionCursosEtiquetasRequest.output('result', db.sql.NVarChar(20));
        eliminacionCursosEtiquetasRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaEliminacionCursosEtiquetas = await eliminacionCursosEtiquetasRequest.execute('spe_cursos_etiquetas');
        const { status, result, message } = respuestaEliminacionCursosEtiquetas.output;

        if (status === CodigosRespuesta.NOT_FOUND)
            return res.status(CodigosRespuesta.NOT_FOUND).json({ message });
        

        if (status !== CodigosRespuesta.OK)
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ message })

        return res.status(CodigosRespuesta.NO_CONTENT).send();

    }catch(error){
        return res.status(500).json({ error: error.message });
    }
}

module.exports = self;