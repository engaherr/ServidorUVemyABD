const router = require('express').Router();
const documentos = require('../controllers/documentos.controller');
const autorizacion = require('../middlewares/autorizacion.middleware');
const { checkSchema } = require('express-validator');
const validarFormatoPeticion = require('../middlewares/validadorpeticiones.middleware');
const { subirArchivoPDF } = require("../middlewares/upload.middleware")
const { crearDocumentoSchema, validarFile, actualizarDocumentoSchema, idDocumentoSchema } = require('../schemas/documento.schema');

router.get('/clase/:idDocumento', checkSchema(idDocumentoSchema()), validarFormatoPeticion, /*autorizacion.autorizar(), autorizacion.autorizarIdDocumento("Profesor,Estudiante"),*/ documentos.obtenerArchivoPDF);

router.post('/clase', subirArchivoPDF.single("file"), checkSchema(crearDocumentoSchema()), validarFormatoPeticion, validarFile(), /*autorizacion.autorizar(), autorizacion.autorizarIdClase("Profesor"),*/ documentos.crear);

router.delete('/clase/:idDocumento', checkSchema(idDocumentoSchema()), validarFormatoPeticion, /*autorizacion.autorizar(), autorizacion.autorizarIdDocumento("Profesor"),*/ documentos.eliminarDocumentoClase);

module.exports = router;