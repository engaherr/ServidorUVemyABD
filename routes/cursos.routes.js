const router = require('express').Router();
const cursos = require('../controllers/cursos.controller');
const cursosEstadisticas = require('../controllers/estadisticas.controller');
const cursosInscripcion = require('../controllers/inscripcion.controller');
const autorizacion = require('../middlewares/autorizacion.middleware');
const { checkSchema } = require('express-validator');
const { crearCursoSchema, actualizarCursoSchema, estadisticaCursoSchema, inscripcionCursoSchema, calificarCursoSchema, obtenerCalificacionCursoSchema } = require('../schemas/curso.schema');
const validarFormatoPeticion = require('../middlewares/validadorpeticiones.middleware');
const validarCamposPeticion = require('../middlewares/validadorformatopeticiones.middleware');
const { subirArchivoPDF } = require('../middlewares/upload.middleware')

const autorizar = autorizacion.autorizar;

router.get('/:idCurso', /*autorizar()*/ cursos.get);

router.post('/', subirArchivoPDF.single("file"), /*autorizar(), checkSchema(crearCursoSchema()), validarFormatoPeticion, validarCamposPeticion(crearCursoSchema()),*/ cursos.create);

router.put('/:idCurso', subirArchivoPDF.single("file"), /*autorizacion.autorizar(), autorizacion.autorizarIdCurso("Profesor"),*/ checkSchema(actualizarCursoSchema()), validarFormatoPeticion, validarCamposPeticion(actualizarCursoSchema()),  cursos.update);

router.delete('/:idCurso', /*autorizacion.autorizar(), autorizacion.autorizarIdCurso("Profesor"),*/ cursos.delete);

router.get('/estadisticas/:idCurso', checkSchema(estadisticaCursoSchema()), validarFormatoPeticion, autorizacion.autorizar(), autorizacion.autorizarIdCurso("Profesor"), cursosEstadisticas.obtenerEstadisticasCurso);

router.get('/reporte/:idCurso', checkSchema(estadisticaCursoSchema()), validarFormatoPeticion, autorizacion.autorizar(), autorizacion.autorizarIdCurso("Profesor"), cursosEstadisticas.devolverReporte);

router.post('/inscripcion/:id', checkSchema(inscripcionCursoSchema()), validarFormatoPeticion, autorizacion.autorizar(), cursosInscripcion.inscribirse);

router.post('/calificacion/:idCurso', checkSchema(calificarCursoSchema()), validarFormatoPeticion, autorizacion.autorizar(), autorizacion.autorizarIdCurso("Estudiante"), cursosInscripcion.calificarCurso);

router.get('/calificacion/:idCurso',checkSchema(obtenerCalificacionCursoSchema()), validarFormatoPeticion,  autorizacion.autorizar(), autorizacion.autorizarIdCurso("Estudiante"), cursosInscripcion.obtenerCalificacionUsuarioCurso);

module.exports = router