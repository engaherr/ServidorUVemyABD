//const { sequelize, DataTypes } = require('sequelize');
const { Op } = require('sequelize');
const CodigosRespuesta = require('../utils/codigosRespuesta');
const { sql } = require('../config/database');
const db = require('../models/index');
const usuarios = db.usuarios;
const cursos = db.cursos;
let self = {}

self.getAll = async function (req, res) {
    try {
        let pagina = parseInt(req.params.pagina, 10);
        if (pagina < 1) {
            pagina = 1;
        }

        const results = await sql.query`
            EXEC sps_obtener_todos_usuarios @Pagina = ${pagina};
        `;

        const data = results.recordset;

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

self.get = async function(req, res){
    try {
        let id = req.params.id;        
        const results = await sql.query`
            EXEC sps_obtener_usuario_por_id @idUsuario = ${id};
        `;
        const data = results.recordset[0];
        if(data){
            return res.status(200).json(data);
        } else {
            return res.status(404).send();
        }
    } catch(error){
        return res.status(500).json({ error: error.message });
    }
}

self.create = async function(req, res) {
    try {
        const { nombres, apellidos, correoElectronico, contrasena } = req.body;

        // Ejecutar el procedimiento almacenado con los parámetros proporcionados
        const results = await sql.query`
            DECLARE @status INT;
            DECLARE @result NVARCHAR(20);
            DECLARE @message NVARCHAR(MAX);

            EXEC spi_usuarios
                @nombres = ${nombres},
                @apellidos = ${apellidos},
                @correoElectronico = ${correoElectronico},
                @contrasena = ${contrasena},
                @status = @status OUTPUT,
                @result = @result OUTPUT, 
                @message = @message OUTPUT;

            SELECT @status AS status, @result AS result, @message AS message;
        `;

        // Verificar el resultado del procedimiento almacenado
        const { status, result, message } = results.recordset[0];

        if (status === 200) {
            return res.status(CodigosRespuesta.CREATED).json({ idUsuario: result });
        } else {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ message });
        }

    } catch (error) {
        console.error('Error al crear usuario:', error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
}

self.update = async function(req, res) {
    try {
        let id = req.params.id;
        let { nombres, apellidos, contrasena } = req.body;

        const results = await sql.query`
            DECLARE @status INT;
            DECLARE @message NVARCHAR(MAX);

            EXEC spa_usuarios
                @idUsuario = ${id},
                @nombres = ${nombres},
                @apellidos = ${apellidos},
                @contrasena = ${contrasena},
                @status = @status OUTPUT,
                @message = @message OUTPUT;

            SELECT @status AS status, @message AS message;
        `;

        const { status, message } = results.recordset[0];

        if (status === 200) {
            return res.status(204).send();
        } else if (status === 404) {
            return res.status(404).send();
        } else {
            return res.status(500).json({ message });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

self.delete = async function(req, res) {
    try {
        let id = req.params.id;        
        const results = await sql.query`
            DECLARE @status INT;
            DECLARE @result INT;
            DECLARE @message NVARCHAR(MAX);

            EXEC spe_eliminar_usuario
                @idUsuario = ${id},
                @status = @status OUTPUT,
                @result = @result OUTPUT,
                @message = @message OUTPUT;

            SELECT @status AS status, @result AS result, @message AS message;
        `;
        const { status, message } = results.recordset[0];

        if (status === 200) {
            return res.status(204).send();
        } else if (status === 404) {
            return res.status(404).send();
        } else {
            return res.status(500).json({ error: message });
        }

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

self.getAllBusqueda = async function (req, res) {
    try {
        let pagina = parseInt(req.params.pagina, 10);
        if (pagina < 1) {
            pagina = 1;
        }

        let limite = 6;
        let busqueda = req.query.busqueda || '';

        // Llamar al procedimiento almacenado
        const results = await sql.query`
            DECLARE @limite INT = ${limite};
            DECLARE @offset INT = (${pagina} - 1) * @limite;

            EXEC sps_get_all_usuarios_busqueda
                @pagina = ${pagina},
                @busqueda = ${busqueda};
        `;

        const data = results.recordset;

        return res.status(200).json({
            data: data,
            total: data.length, // No necesitamos hacer una segunda consulta para obtener el total
            totalPages: Math.ceil(data.length / limite),
            currentPage: pagina
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


module.exports = self;