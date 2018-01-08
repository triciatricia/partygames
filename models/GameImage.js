const DataTypes = require('../core/data/types');

const GameImage = {
  gameId: DataTypes.gameCodeId(),
  gameImageId: DataTypes.unsignedint(),
  imageUrl: DataTypes.char(),
  wasSkipped: DataTypes.boolean(),
  scenario: DataTypes.text(),
  reactorNickname: DataTypes.char(),
};

module.exports = Users;
