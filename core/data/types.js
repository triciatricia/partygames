var utils = require('../utils');

var DataTypes = {};

function addType(name, dbTypeGetter, props) {
  /**
   * @constructor
   */
  function DataField() {
    this.props = {};
  }

  if (props) {
    for (var i = 0; i < props.length; ++i) {
      var propName = utils.capitalizeFirst(props[i]);
      DataField.prototype['set' + propName] = function(value) {
        this.props[props[i]] = value;
        return this;
      };

      DataField.prototype['get' + propName] = function() {
        return this.props[props[i]];
      };
    }

    DataField.prototype.getDBType = function() {
      return dbTypeGetter(this.props);
    };
  } else {
    DataField.prototype.getDBType = utils.id(dbTypeGetter);
  }

  DataField.prototype.getType = function() {
    return DataTypes[name];
  };
  
  DataTypes[name] = function() {
    return new DataField();
  };
};

addType('int', 'bigint (20)');
addType('id', 'bigint (20) unsigned');
addType('time', 'int (10) unsigned');
addType(
  'char', 
  function(props) {
    return 'varchar(' + props.size || 256 + ')';
  },
  ['size']
);
addType('text', 'text');
// TODO: Need a way to resolve references
addType('ref', 'bigint (20) unsigned');

module.exports = DataTypes;
