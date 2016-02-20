var DataTypes = require('../core/data/types');

var UserGame = {
  user: DataTypes.id(),
  game: DataTypes.id()
};

module.exports = UserGame;
