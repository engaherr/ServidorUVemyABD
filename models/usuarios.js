'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class usuarios extends Model {
    static associate(models) {
      usuarios.belongsToMany(models.etiquetas, {as: 'etiquetas', through: 'usuariosetiquetas', foreignKey: 'idUsuario'});
      usuarios.belongsToMany(models.cursos, {through: 'usuarioscursos', foreignKey: 'idUsuario'});
      usuarios.hasMany(models.comentarios, {foreignKey: 'idUsuario'});
    }
  }
  usuarios.init({
    idUsuario: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombres: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apellidos: {
      type: DataTypes.STRING,
      allowNull: false
    },
    correoElectronico: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contrasena: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imagen: {
      type: DataTypes.BLOB('medium'),
      allowNull: true,
      defaultValue: null
    },
    esAdministrador: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    sequelize,
    freezeTableName: true,
    modelName: 'usuarios',
    timestamps: false,
    dialectOptions: {
      encrypt: false
    }
  });
  return usuarios;
};