const claimTypes = require('../config/claimtypes');
const { cursos, usuarioscursos, usuarios } = require('../models');
const CodigosRespuesta = require('../utils/codigosRespuesta');

let self = {};

self.inscribirse = async function(req, res) {
    const idUsuario = req.tokenDecodificado[claimTypes.Id];
    const idCurso = req.body.idCurso;

    if (idCurso != req.params.id) {
        return res.status(CodigosRespuesta.BAD_REQUEST).send("IdCurso no válido");
    }

    try {
        await sql.connect(config); 

        const result = await sql.query(`
            DECLARE @status INT;
            DECLARE @message NVARCHAR(MAX);

            EXEC spi_inscribirse_en_curso 
                @idUsuario = ${idUsuario},
                @idCurso = ${idCurso},
                @status = @status OUTPUT,
                @message = @message OUTPUT;

            SELECT @status AS status, @message AS message;
        `);

        const { status, message } = result.recordset[0];

        if (status === 201) {
            res.status(CodigosRespuesta.CREATED).send(message);
        } else {
            res.status(status).send(message);
        }
    } catch (error) {
        console.error("Error al inscribirse en el curso:", error);
        res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send();
    } finally {
        sql.close(); 
    }
}

self.calificarCurso = async function(req, res) {
    const idUsuario = req.tokenDecodificado[claimTypes.Id];
    const idCurso = req.body.idCurso;
    const calificacion = req.body.calificacion;

    if (idCurso != req.params.idCurso) {
        return res.status(CodigosRespuesta.BAD_REQUEST).send("IdCurso no válido");
    }

    try {
        await sql.connect(config); 

        const result = await sql.query(`
            DECLARE @status INT;
            DECLARE @message NVARCHAR(MAX);
            DECLARE @calificacion INT;

            EXEC spa_calificar_curso 
                @idUsuario = ${idUsuario},
                @idCurso = ${idCurso},
                @calificacion = ${calificacion},
                @status = @status OUTPUT,
                @message = @message OUTPUT;

            SELECT @status AS status, @message AS message;
        `);

        const { status, message } = result.recordset[0];

        if (status === 201) {
            res.status(CodigosRespuesta.CREATED).send(message);
        } else {
            res.status(status).send(message);
        }
    } catch (error) {
        console.error("Error al calificar el curso:", error);
        res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send();
    } finally {
        sql.close(); 
    }
}

self.obtenerCalificacionUsuarioCurso = async function(req, res){
    const idCurso = req.params.idCurso;
    const idUsuario = req.tokenDecodificado[claimTypes.Id];
    try{
        await mssql.connect(config);
        const request = new mssql.Request();

        request.input('idUsuario', mssql.Int, idUsuario);
        request.input('idCurso', mssql.Int, idCurso);
        request.output('calificacion', mssql.Int);
        request.output('status', mssql.Int);
        request.output('message', mssql.NVarChar);

        const result = await request.execute('sp_obtener_calificacion_usuario_curso');

        const { calificacion, status, message } = result.output;

        if (status === 200) {
            return res.status(CodigosRespuesta.OK).json({ idCurso, idUsuario, calificacion });
        } else {
            return res.status(status).send(message);
        }
    } catch(error){
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send();
    } finally {
        await mssql.close();
    }
}


module.exports = self;