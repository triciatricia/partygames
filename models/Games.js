var DataTypes = require('../core/data/types');

var Games = {
  id: DataTypes.id(),
  roundNum: DataTypes.int(),
  hasStarted: DataTypes.boolean(),
  isCompleted: DataTypes.boolean(),
  lastImageRetrieved: DataTypes.int(),
  URLSuffix: DataTypes.char(),
  timeCreated: DataTypes.time(),
  host: DataTypes.id(),
};

module.exports = Games;
