const bcrypt = require('bcrypt');
const { usuarios, sequelize } = require('../models');
const { generarTokenRegistro } = require('../services/jwttoken.service');
const CodigosRespuesta = require('../utils/codigosRespuesta');
const enviarCorreoVerificacion = require('../services/enviocorreo.service');
const fs = require('fs');
const claimTypes = require('../config/claimtypes');
const { borrarEtiquetasDelUsuario, crearUsuariosEtiquetas } = require('../services/usuariosetiquetas.service');
const db = require('../config/database');


let self = {};

self.solicitarCodigoVerificacionCorreo = async function (req, res) {
    try {
        const { correoElectronico } = req.body;

        await db.connectToDB();

        const confirmacionCorreoRequest = new db.sql.Request();
        confirmacionCorreoRequest.input('correoElectronico', db.sql.NVarChar, correoElectronico);

        const respuestaConfirmacionCorreo= await confirmacionCorreoRequest.execute('sps_usuarios');
        const usuario = respuestaConfirmacionCorreo.recordset[0];

        if (!usuario){
            const codigo = await enviarCorreoVerificacion(correoElectronico);
            token = generarTokenRegistro(correoElectronico, codigo);
            return res.status(CodigosRespuesta.OK).send({ jwt: token });
        } else {
            return res.status(CodigosRespuesta.BAD_REQUEST).send({ detalles: ["Correo electrónico ya registrado"] });
        }
    } catch (error) {
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send({ detalles: [error.message] });
    }
}

self.registrarUsuario = async function (req, res) {
    try {
        const { correoElectronico, contrasena, nombres, apellidos, idsEtiqueta } = req.body;
        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        await db.connectToDB();

        const creacionUsuarioRequest = new db.sql.Request();
        creacionUsuarioRequest.input('nombres', db.sql.NVarChar, nombres);
        creacionUsuarioRequest.input('apellidos', db.sql.NVarChar, apellidos);
        creacionUsuarioRequest.input('correoElectronico', db.sql.NVarChar, correoElectronico);
        creacionUsuarioRequest.input('contrasena', db.sql.NVarChar, contrasenaHash);
        creacionUsuarioRequest.output('status', db.sql.Int);
        creacionUsuarioRequest.output('result', db.sql.NVarChar(20));
        creacionUsuarioRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaCreacionUsuario = await creacionUsuarioRequest.execute('spi_usuarios');
        const { status, result, message } = respuestaCreacionUsuario.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ message });
        }

        for (let etiquetaId of idsEtiqueta) {
            let etiquetaCreada = await crearUsuariosEtiquetas(result, etiquetaId );
            if (etiquetaCreada.status !== CodigosRespuesta.CREATED) {
                console.log(`Error al crear etiqueta: ${etiquetaId} - ${etiquetaCreada.message}`);
                return res.status(CodigosRespuesta.BAD_REQUEST).send({ detalles: ["Error al crear una de las etiquetas"] });
            }
        }

        return res.status(CodigosRespuesta.CREATED).json({
            idUsuario: result
        });
        

    } catch (error) {
        console.error('Error al crear usuario:', error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }

}

self.subirFotoPerfilUsuario = async function (req, res) {
    try {
        const { idUsuario } = req.body;
        const imagen = req.file;
        const tokenDecodificado = req.tokenDecodificado;

        if (idUsuario != tokenDecodificado[claimTypes.Id])
            return res.status(CodigosRespuesta.BAD_REQUEST).send();

        const usuario = await usuarios.findByPk(idUsuario);
        if (!usuario)
            return res.status(CodigosRespuesta.BAD_REQUEST).send({ detalles: ["Usuario no encontrado"] });

        const imagenBuffer = imagen.buffer;
        usuario.imagen = imagenBuffer;
        console.log(usuario);
        await usuario.save();

        return res.status(CodigosRespuesta.OK).send({ idUsuario: usuario.idUsuario, detalles: ["Foto de perfil actualizada"] });
    } catch (error) {
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send({ detalles: [error.message] });
    }
}

self.obtenerFotoPerfil = async function (req, res) {
    try {
        const idUsuario = req.tokenDecodificado[claimTypes.Id];
        const usuario = await usuarios.findByPk(idUsuario, {
            attributes: ['imagen']
        });

        if (!usuario)
            return res.status(CodigosRespuesta.NOT_FOUND).send({ detalles: ["Usuario no encontrado"] });

        if (!usuario.imagen)
            return res.status(CodigosRespuesta.NOT_FOUND).send();

        res.set('Content-Type', 'image/png');
        return res.status(CodigosRespuesta.OK).send(usuario.imagen);
    } catch (error) {
        console.log(error);
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send({ detalles: [error.message] });
    }
}

self.actualizarPerfilUsuario = async function (req, res) {
    try {
        const idUsuario = req.tokenDecodificado[claimTypes.Id];
        const { nombres, apellidos, correoElectronico, contrasena} = req.body;

        if (idUsuario != req.body.idUsuario)
            return res.status(CodigosRespuesta.BAD_REQUEST).send({ detalles: ["IdUsuario no coincide con el token"] });
        
        let contrasenaHash = null;
        if (contrasena != null){
            contrasenaHash = await bcrypt.hash(contrasena, 10);
        }

        await db.connectToDB();

        const actualizacionUsuarioRequest = new db.sql.Request();
        actualizacionUsuarioRequest.input('idUsuario', db.sql.Int, req.body.idUsuario);
        actualizacionUsuarioRequest.input('nombres', db.sql.NVarChar, nombres);
        actualizacionUsuarioRequest.input('apellidos', db.sql.NVarChar, apellidos);
        actualizacionUsuarioRequest.input('contrasena', db.sql.NVarChar, contrasenaHash);
        actualizacionUsuarioRequest.output('status', db.sql.Int);
        actualizacionUsuarioRequest.output('result', db.sql.NVarChar(20));
        actualizacionUsuarioRequest.output('message', db.sql.NVarChar(db.sql.MAX));

        const respuestaActualizacionUsuario = await actualizacionUsuarioRequest.execute('spa_usuarios');
        const { status, result, message } = respuestaActualizacionUsuario.output;

        if (status !== 200) {
            return res.status(CodigosRespuesta.BAD_REQUEST).json({ message });
        }

        return res.status(CodigosRespuesta.NO_CONTENT).send();
    } catch (error) {
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send({ detalles: [error.message] });
    }
}

self.actualizarEtiquetasUsuario = async function (req, res) {
    try {
        const { idsEtiqueta } = req.body;

        await db.connectToDB();

        const confirmarUsuarioExistente = new db.sql.Request();
        confirmarUsuarioExistente.input('idUsuario', db.sql.Int, req.body.idUsuario);

        const respuestaUsuario = await confirmarUsuarioExistente.execute('sps_usuarios');
        const usuario = respuestaUsuario.recordset[0];

        if (!usuario) {
            return res.status(CodigosRespuesta.NOT_FOUND).send({ detalles: ["No existe el usuario"] });
        }

        resultadoEtiquetas = await borrarEtiquetasDelUsuario(req.body.idUsuario);

        if(resultadoEtiquetas !== CodigosRespuesta.NOT_FOUND && resultadoEtiquetas !== CodigosRespuesta.NO_CONTENT) {
            return res.status(resultadoEtiquetas).send({ detalles: ["Error al actualizar las etiquetas"] });
        }

        for (let etiquetaId of idsEtiqueta) {
            let etiquetaCreada = await crearUsuariosEtiquetas(req.body.idUsuario, etiquetaId);
            if(etiquetaCreada.status != CodigosRespuesta.CREATED){
                return res.status(CodigosRespuesta.BAD_REQUEST).send({ detalles: ["Error al crear una de las etiquetas"] });
            }
        }

        return res.status(CodigosRespuesta.NO_CONTENT).send();

    } catch (error) {
        return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send({ detalles: [error.message] });
    }
}

module.exports = self;