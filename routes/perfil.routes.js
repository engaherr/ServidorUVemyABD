const router = require('express').Router();
const perfil = require('../controllers/perfil.controller');
const { checkSchema } = require('express-validator');
const esquemas = require('../schemas/perfil.schema');
const validarFormatoPeticion = require('../middlewares/validadorpeticiones.middleware');
const validarCamposPeticion = require('../middlewares/validadorformatopeticiones.middleware');
const { autorizarVerificacionCorreo, autorizar } = require('../middlewares/autorizacion.middleware');
const { subirArchivoPDF } = require("../middlewares/upload.middleware")
const { validarFoto } = require('../schemas/perfil.schema');

router.post('/verificacion', checkSchema(esquemas.solicitarVerificacionCorreoEsquema()), validarFormatoPeticion, validarCamposPeticion(esquemas.solicitarVerificacionCorreoEsquema()), perfil.solicitarCodigoVerificacionCorreo);

router.post('/registro', checkSchema(esquemas.registrarUsuarioEsquema()), validarFormatoPeticion, validarCamposPeticion(esquemas.registrarUsuarioEsquema()), /*autorizarVerificacionCorreo()*/ perfil.registrarUsuario);

router.put('/foto', autorizar(), subirArchivoPDF.single("imagen"), checkSchema(esquemas.fotoPerfilSchema()), validarFormatoPeticion, validarCamposPeticion(esquemas.fotoPerfilSchema()),validarFoto(), perfil.subirFotoPerfilUsuario);

router.put('/', autorizar(), checkSchema(esquemas.actualizarPerfilSchema()), validarFormatoPeticion, validarCamposPeticion(esquemas.actualizarPerfilSchema()), perfil.actualizarPerfilUsuario);

router.put('/usuarioetiquetas', /*autorizar()*,*/ checkSchema(esquemas.actualizarEtiquetasSchema()), validarFormatoPeticion, validarCamposPeticion(esquemas.actualizarEtiquetasSchema()), perfil.actualizarEtiquetasUsuario);

router.get('/foto', autorizar(), perfil.obtenerFotoPerfil);

module.exports = router;