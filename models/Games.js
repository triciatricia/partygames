var DataTypes = require('../core/data/types');

var Games = {
  id: DataTypes.id(),
  round: DataTypes.int(),
  isCompleted: DataTypes.boolean(),
  lastImage: DataTypes.int(),
  gameCode: DataTypes.char(),
  timeCreated: DataTypes.time(),
  host: DataTypes.id(),
  reactor: DataTypes.id(),
  images: DataTypes.links()
};

module.exports = Games;
