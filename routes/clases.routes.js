const router = require('express').Router();
const clases = require('../controllers/clases.controller');
const { checkSchema } = require('express-validator');
const { crearClaseSchema, actualizarClaseSchema, recuperarClaseSchema } = require('../schemas/clase.schema');
const validarFormatoPeticion = require('../middlewares/validadorpeticiones.middleware');
const validarCamposPeticion = require('../middlewares/validadorformatopeticiones.middleware');
const autorizacion = require('../middlewares/autorizacion.middleware');

router.get('/:idClase', checkSchema(recuperarClaseSchema()), validarFormatoPeticion,  
    autorizacion.autorizar(), autorizacion.autorizarIdClase("Profesor,Estudiante"), 
    clases.obtenerPorId);

router.post('/', validarCamposPeticion(crearClaseSchema()), checkSchema(crearClaseSchema()), validarFormatoPeticion, autorizacion.autorizar(), autorizacion.autorizarIdCurso("Profesor"), clases.crear);

router.put('/:idClase', checkSchema(actualizarClaseSchema()), validarFormatoPeticion,  autorizacion.autorizar(), autorizacion.autorizarIdClase("Profesor"), clases.actualizar);

router.delete('/:idClase', checkSchema(recuperarClaseSchema()), validarFormatoPeticion, autorizacion.autorizar(), autorizacion.autorizarIdClase("Profesor"), clases.eliminar);

module.exports = router;