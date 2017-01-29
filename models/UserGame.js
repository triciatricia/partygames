const DataTypes = require('../core/data/types');

const UserGame = {
  user: DataTypes.id(),
  game: DataTypes.id()
};

module.exports = UserGame;
