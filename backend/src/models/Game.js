const { DataTypes } = require("sequelize");

const { sequelize } = require("../db");

const Game = sequelize.define(
  "Game",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    startPage: { type: DataTypes.STRING(255), allowNull: false },
    currentPage: { type: DataTypes.STRING(255), allowNull: false },
    targetPage: { type: DataTypes.STRING(255), allowNull: false },
    path: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    clicks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "in_progress",
      validate: { isIn: [["in_progress", "completed", "failed"]] },
    },
    startedAt: { type: DataTypes.DATE, allowNull: false },
    endedAt: { type: DataTypes.DATE, allowNull: true },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "games",
    timestamps: true,
  }
);

module.exports = Game;
