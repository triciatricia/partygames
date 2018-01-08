const DataTypes = require('../core/data/types');

const UserGame = {
  user: DataTypes.id(),
  game: DataTypes.gameCodeId()
};

module.exports = UserGame;
