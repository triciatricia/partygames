/**
 * The schema for the data types.
 * Define data types (DataFields), their properties,
 * and what type they are in the mysql table ("DBType").
 */

"use strict";

var utils = require('../utils');

// DataTypes holds all the DataFields defined below.
var DataTypes = {};

function addType(name, dbTypeGetter, props) {
  /**
   * @constructor
   * name: Name of the data type
   * dbTypeGetter: Function that returns the database type (ie: bigint)
   * props: List of properties of the data type (ie: size)
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
}

// Add data types
addType('int', utils.functionThatReturns('bigint (20)'));
addType('unsignedint', utils.functionThatReturns('bigint (20) unsigned'));
addType('id', utils.functionThatReturns('bigint (20) unsigned'));
addType('time', utils.functionThatReturns('int (10) unsigned'));
addType('boolean', utils.functionThatReturns('tinyint(1)'));
addType(
  'char',
  function(props) {
    return 'varchar(' + props.size || 256 + ')';
  },
  ['size']);
addType('text', utils.functionThatReturns('text'));
// TODO Need a way to get out links
addType('links', utils.functionThatReturns('text'));

module.exports = DataTypes;
