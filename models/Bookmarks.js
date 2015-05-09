var DataTypes = require('../core/data/types');

var Bookmarks = {
  id: DataTypes.id(),
  name: DataTypes.char().setSize(256),
  link: DataTypes.ref(),
  description: DataTypes.text()
};

module.exports = Bookmarks;
