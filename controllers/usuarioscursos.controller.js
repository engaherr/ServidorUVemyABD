const { sequelize, DataTypes } = require('sequelize');
const usuariosCursos = require('../models/usuarioscursos');
const db = require('../models/index');
const usuarioscursos = db.usuarioscursos;
const cursos = db.cursos;
let self = {}

self.getAll = async function (req, res) {
    try {
        const results = await sql.query`
            EXEC sps_get_all_usuarios_cursos;
        `;
        const data = results.recordset;
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

self.get = async function(req, res) {
    try {
        let id = req.params.id;
        let status, message;
        
        await sql.query`
            EXEC sps_obtener_usuario_curso_por_id
                @idUsuarioCurso = ${id},
                @status = @status OUTPUT,
                @message = @message OUTPUT;
        `;
        
        if (status === 200) {
            let data = await usuarioscursos.findByPk(id, { attributes: ['idUsuarioCurso', 'calificacion', 'idCurso', 'idUsuario']});
            return res.status(200).json(data);
        } else if (status === 404) {
            return res.status(404).send();
        } else {
            return res.status(500).json({ error: message });
        }
    } catch(error) {
        return res.status(500).json({ error: error.message });
    }
}

self.create = async function(req, res){
    try{
        const { idCurso, idEtiqueta, calificacion, idUsuario } = req.body;

        const [result] = await sequelize.query('CALL spi_create_usuario_curso(:idCurso, :idEtiqueta, :calificacion, :idUsuario)', {
            replacements: { idCurso, idEtiqueta, calificacion, idUsuario }
        });

        const { status, message } = result[0];

        if (status === 201) {
            return res.status(201).json({ message });
        } else {
            return res.status(400).json({ error: message });
        }
    }catch(error){
        return res.status(500).json({ error: error.message });
    }
}

self.update = async function(req, res) {
    try {
        let id = req.params.id;
        let body = req.body;

        const [result] = await sequelize.query('CALL spa_update_usuario_curso(:idCurso, :idUsuario, :calificacion, @status, @message)', {
            replacements: { idCurso: body.idCurso, idUsuario: body.idUsuario, calificacion: body.calificacion }
        });

        const { status, message } = result[0];

        if (status === 204) {
            return res.status(204).send();
        } else if (status === 404) {
            return res.status(404).send();
        } else {
            return res.status(500).json({ error: message });
        }
    } catch(error) {
        return res.status(500).json({ error: error.message });
    }
}

self.delete = async function(req, res) {
    try {
        let id = req.params.id;
        let status, message;

        await sequelize.query('CALL spe_cursos_etiquetas(:id, @status OUTPUT, @message OUTPUT)', {
            replacements: { id: id }
        });

        const [[{ status: statusOutput, message: messageOutput }]] = await sequelize.query('SELECT @status AS status, @message AS message');

        if (statusOutput === 200) {
            return res.status(204).send(); 
        } else if (statusOutput === 404) {
            return res.status(404).send(); 
        } else {
            return res.status(500).json({ error: messageOutput });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message }); 
    }
}

self.borrarUsuariosInscritosDelCurso = async function(cursoId) {
    try {
        let status, message;

        await sequelize.query('CALL spu_borrar_usuarios_inscritos_del_curso(:cursoId, @status OUTPUT, @message OUTPUT)', {
            replacements: { cursoId: cursoId }
        });

        const [[{ status: statusOutput, message: messageOutput }]] = await sequelize.query('SELECT @status AS status, @message AS message');

        if (statusOutput === 204) {
            return 204; 
        } else if (statusOutput === 404) {
            return 404; 
        } else {
            return { status: 500, message: messageOutput }; 
        }
    } catch (error) {
        return { status: 500, message: error.message };
    }
}

module.exports = self;