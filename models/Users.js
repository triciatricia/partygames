const DataTypes = require('../core/data/types');

const Users = {
  id: DataTypes.id(),
  nickname: DataTypes.char(),
  accessToken: DataTypes.char(),
  roundOfLastResponse: DataTypes.unsignedint(),
  response: DataTypes.text(),
  score: DataTypes.int(),
  game: DataTypes.id(),
  submittedScenario: DataTypes.boolean()
};

module.exports = Users;
