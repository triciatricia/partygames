var DataTypes = require('../core/data/types');

var Users = {
  id: DataTypes.id(),
  nickname: DataTypes.char(),
  accessToken: DataTypes.char(),
  roundOfLastResponse: DataTypes.unsignedint(),
  response: DataTypes.text(),
  score: DataTypes.int(),
  game: DataTypes.id()
};

module.exports = Users;
