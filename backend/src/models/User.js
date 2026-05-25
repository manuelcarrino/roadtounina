const { DataTypes } = require("sequelize");

const { sequelize } = require("../db");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    refreshTokenHash: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

module.exports = User;
