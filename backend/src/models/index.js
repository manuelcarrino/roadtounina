const User = require("./User");
const Game = require("./Game");

User.hasMany(Game, { foreignKey: "userId" });
Game.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  User,
  Game,
};
