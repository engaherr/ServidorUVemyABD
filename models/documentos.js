'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class documentos extends Model {
    static associate(models) {
      documentos.belongsTo(models.clases, {as: "clases", foreignKey: "idClase"});
      documentos.hasOne(models.cursos, {foreignKey: "idCurso"});
      documentos.belongsTo(models.tiposarchivos, {as: "tiposarchivos",foreignKey: "idTipoArchivo"});
    }
  }
  documentos.init({
    idDocumento: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    archivo: {
      type: DataTypes.BLOB('long'),
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    idTipoArchivo:{
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    idCurso:{
      allowNull: true,
      type: DataTypes.INTEGER,
    },
    idClase: {
      allowNull: true,
      type: DataTypes.INTEGER,
    }
  }, {
    sequelize,
    timestamps: false,
    modelName: 'documentos',
  });
  return documentos;
};