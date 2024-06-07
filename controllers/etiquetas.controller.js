const { etiquetas } = require('../models');
const CodigosRespuesta = require('../utils/codigosRespuesta');
const db = require('../config/database');

let self = {}

self.getAll = async function(req, res){
  try{
    await db.connectToDB();
    const request = new db.sql.Request();
    const respuesta = await request.execute('sps_get_etiquetas');
    return res.status(CodigosRespuesta.OK).json(respuesta.recordset);
  }catch(error){
    console.log(error);
    return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json(error)
  }
}

self.create = async function(req, res) {
  try {
    await db.connectToDB();
    const request = new db.sql.Request();
    request.input('nombre', db.sql.NVarChar, req.body.nombre);
    request.output('status', db.sql.Int);
    request.output('result', db.sql.Int);
    request.output('message', db.sql.NVarChar(db.sql.MAX));

    const respuesta = await request.execute('spi_etiquetas');
    const { status, result, message } = respuesta.output;

    if(status !== 200){
      return res.status(CodigosRespuesta.BAD_REQUEST).json({ message });
    }

    return res.status(CodigosRespuesta.CREATED).json({
      idEtiqueta: result,
    });
  } catch (error) {
    return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

self.delete = async function(req, res) {
  try {
    await db.connectToDB();
    const request = new db.sql.Request();
    request.input('id_etiqueta', db.sql.Int, req.params.id);
    request.output('status', db.sql.Int);
    request.output('result', db.sql.Int);
    request.output('message', db.sql.NVarChar(db.sql.MAX));

    const respuesta = await request.execute('spe_etiquetas');
    const { status, message } = respuesta.output;

    if (status !== 200) {
      return res.status(CodigosRespuesta.BAD_REQUEST).json({ message });
    }

    return res.status(CodigosRespuesta.NO_CONTENT).send();
  } catch (error) {
    return res.status(CodigosRespuesta.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

module.exports = self;
