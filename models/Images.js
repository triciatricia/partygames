const DataTypes = require('../core/data/types');

const Images = {
  url: DataTypes.char(),
  nSkipped: DataTypes.unsignedint(),
  nHearted: DataTypes.unsignedint(),
};

module.exports = Images;
