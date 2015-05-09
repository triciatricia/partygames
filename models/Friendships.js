var DataTypes = require('../core/data/types');

var Friendships = {
  uid1: DataTypes.ref(),
  uid2: DataTypes.ref(),
  timeCreated: DataTypes.time(),
};

module.exports = Friendships;
