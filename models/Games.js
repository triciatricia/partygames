var DataTypes = require('../core/data/types');

var Games = {
  id: DataTypes.id(),
  round: DataTypes.int(),
  image: DataTypes.link(),
  waitingForScenarios: DataTypes.boolean(),
  reactorID: DataTypes.id(),
  reactorNickname: DataTypes.char(),
  hostID: DataTypes.id(),
  gameOver: DataTypes.boolean(),
  winningResponse: DataTypes.id(),
  winningResponseSubmittedBy: DataTypes.char(),
  lastGif: DataTypes.char()
};

module.exports = Games;
