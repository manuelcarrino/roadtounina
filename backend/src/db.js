const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");

const storagePath =
  process.env.SQLITE_PATH ||
  path.join(__dirname, "..", "data", "roadtounina.sqlite");

fs.mkdirSync(path.dirname(storagePath), { recursive: true });

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: storagePath,
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
});

module.exports = { sequelize };
