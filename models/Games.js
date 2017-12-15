const DataTypes = require('../core/data/types');

const Games = {
  id: DataTypes.id(),
  round: DataTypes.int(),
  image: DataTypes.JSONtext(),
  waitingForScenarios: DataTypes.boolean(),
  reactorID: DataTypes.id(),
  reactorNickname: DataTypes.char(),
  hostID: DataTypes.id(),
  gameOver: DataTypes.boolean(),
  winningResponse: DataTypes.id(),
  winningResponseSubmittedBy: DataTypes.char(),
  lastGif: DataTypes.char(),
  displayOrder: DataTypes.text(),
  imageQueue: DataTypes.JSONtext(),
  roundStarted: DataTypes.unsignedint(),
  firstImageID: DataTypes.unsignedint(),
};

module.exports = Games;
