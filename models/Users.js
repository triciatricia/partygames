var DataTypes = require('../core/data/types');

var Users = {
  id: DataTypes.id(),
  name: DataTypes.char().setSize(256),
  email: DataTypes.char().setSize(256),
  passHash: DataTypes.char().setSize(256),
  passSalt: DataTypes.char().setSize(256),
  timeCreated: DataTypes.time(),
};

module.exports = Users;
