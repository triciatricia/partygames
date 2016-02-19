var DataTypes = require('../core/data/types');

var Bookmarks = {
  id: DataTypes.id(),
  name: DataTypes.char().setSize(256),
  description: DataTypes.text()
};

module.exports = Bookmarks;
