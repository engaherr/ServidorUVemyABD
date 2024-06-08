const claimTypes = require('../config/claimtypes');
const { comentarios, usuarios, clases } = require('../models');
const CodigosRespuesta = require('../utils/codigosRespuesta');
const db = require('../config/database');

let self = {}

self.get = async function (req, res) {
    try {
        await db.connectToDB();
        const request = new db.sql.Request();
        request.input('id_clase', db.sql.Int, req.params.idClase);
        request.output('status', db.sql.Int);
        request.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuesta = await request.execute('sps_get_comentarios_clase');
        const { status, message } = respuesta.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ message });
        }

        const data = respuesta.recordset;

        // Crear un diccionario para mapear los comentarios por idComentario
        let comentariosMap = {};
        data.forEach(comentario => {
            let { idComentario, fecha, descripcion, idClase, nombreUsuario } = comentario;
            comentariosMap[idComentario] = {
                idComentario,
                idClase,
                nombreUsuario,
                descripcion,
                fecha,
                respuestas: []
            };
        });

        // Agrupar respuestas dentro de los comentarios correspondientes
        data.forEach(comentario => {
            if (comentario.respuestaAComentario) {
                let parentComentario = comentariosMap[comentario.respuestaAComentario];
                if (parentComentario) {
                    parentComentario.respuestas.push(comentariosMap[comentario.idComentario]);
                }
            }
        });

        // Ordenar las respuestas por fecha (del más nuevo al más viejo)
        Object.values(comentariosMap).forEach(comentario => {
            comentario.respuestas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        });

        // Filtrar solo los comentarios que no son respuestas y ordenar por fecha (del más nuevo al más viejo)
        let dataFormateada = Object.values(comentariosMap)
            .filter(comentario => !data.some(c => c.idComentario === comentario.idComentario && c.respuestaAComentario))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        res.status(CodigosRespuesta.OK).json(dataFormateada);
    } catch (error) {
        res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ detalles: [error.message] });
    }
}

self.create = async function (req, res) {
    try {
        const { idClase, idUsuario, descripcion } = req.body;
        const respuestaAComentario = req.body.respondeAComentario || null;
        // const idUsuarioToken = req.tokenDecodificado[claimTypes.Id];

        // if (idUsuarioToken !== idUsuario) {
        //     return res.status(CodigosRespuesta.UNAUTHORIZED).json({ detalles: ['Usuario incorrecto'] });
        // }

        await db.connectToDB();
        const request = new db.sql.Request();

        request.input('id_clase', db.sql.Int, idClase);
        request.input('id_usuario', db.sql.Int, idUsuario);
        request.input('descripcion', db.sql.NVarChar(350), descripcion);

        if (respuestaAComentario !== null) {
            request.input('respuesta_a_comentario', db.sql.Int, respuestaAComentario);
        } else {
            request.input('respuesta_a_comentario', db.sql.Int, null);
        }        
        
        request.output('result', db.sql.Int);
        request.output('status', db.sql.Int);
        request.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuesta = await request.execute('spi_comentarios');

        const { result, status, message } = respuesta.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ detalles: [message] });
        }

        return res.status(CodigosRespuesta.CREATED).json({ idComentario: result });
    } catch (error) {
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ detalles: [error] });
    }
}


module.exports = self;