const bcrypt = require('bcrypt');
const { generaToken, tiempoRestanteToken } = require('../services/jwttoken.service');
const CodigosRespuesta = require('../utils/codigosRespuesta');
const db = require('../config/database');

let self = {};

self.iniciarSesion = async function (req, res) {
    try{
        const { correoElectronico, contrasena } = req.body;
        
        await db.connectToDB();

        const inicioSesionrequest = new db.sql.Request();
        inicioSesionrequest.input('correoElectronico', db.sql.NVarChar, correoElectronico);

        const respuestaUsuario = await inicioSesionrequest.execute('sps_usuarios');
        const usuario = respuestaUsuario.recordset[0];

        if (!usuario)
            return res.status(CodigosRespuesta.BAD_REQUEST).send({ detalles: ["Correo electrónico o contraseña incorrectos"] });

        const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!passwordMatch)
            return res.status(CodigosRespuesta.BAD_REQUEST).send({ detalles: ["Correo electrónico o contraseña incorrectos"] });


        // Obtener etiquetas de usuario
        const usuariosEtiquetasRequest = new db.sql.Request();
        usuariosEtiquetasRequest.input('idUsuario', db.sql.Int, usuario.idUsuario);

        const respuestaUsuariosEtiquetas = await usuariosEtiquetasRequest.execute('sps_usuarios_etiquetas');
        const idsEtiqueta = respuestaUsuariosEtiquetas.recordset.map(row => row.idEtiqueta);

        token = generaToken(usuario.idUsuario, usuario.correoElectronico, usuario.nombres);

        return res.status(CodigosRespuesta.OK).json({
            idUsuario: usuario.idUsuario,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            correoElectronico: usuario.correoElectronico,
            idsEtiqueta: idsEtiqueta,
            jwt: token,
            esAdministrador: usuario.esAdministrador
        });

    } catch (error) {
        res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).send({ detalles: [error.message] });
    }
}

self.tiempo = async function (req, res) {
    const tiempo = tiempoRestanteToken(req);
    if (tiempo == null)
        return res.status(CodigosRespuesta.NOT_FOUND).send();
    
    return res.status(CodigosRespuesta.OK).send(tiempo);
}

module.exports = self;