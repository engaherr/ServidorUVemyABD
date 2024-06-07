const router = require('express').Router();
const autenticacion = require('../controllers/autenticacion.controller');
const { checkSchema } = require('express-validator');
const esquemas = require('../schemas/autenticacion.schema');
const validarFormatoPeticion = require('../middlewares/validadorpeticiones.middleware');
const validarCamposPeticion = require('../middlewares/validadorformatopeticiones.middleware');

router.post('/', checkSchema(esquemas.inicioSesionSchema()), validarFormatoPeticion, validarCamposPeticion(esquemas.inicioSesionSchema()), autenticacion.iniciarSesion);

module.exports = router;