/**
 * The schema for the data types.
 * Define data types (DataFields), their properties,
 * and what type they are in the mysql table ("DBType").
 */

'use strict';

const utils = require('../utils');

// DataTypes holds all the DataFields defined below.
let DataTypes = {};

function addType(name, dbTypeGetter, props, beforeSaving, afterLoading) {
  /**
   * @constructor
   * name: Name of the data type
   * dbTypeGetter: Function that returns the database type (ie: bigint)
   * props: List of properties of the data type (ie: size)
   * beforeSaving and afterLoading are functions (value) that
   * operate on the data before saving to the database or
   * after loading. afterLoading's argument is a string, and
   * beforeSaving must return a string.
   */
  function DataField() {
    this.props = {};
    this.beforeSaving = beforeSaving ? beforeSaving : x => x;
    this.afterLoading = afterLoading ? afterLoading : x => x;
  }

  if (props) {
    for (let i = 0; i < props.length; ++i) {
      const propName = utils.capitalizeFirst(props[i]);
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
addType('link', utils.functionThatReturns('text'));
addType(
  'JSONtext',
  utils.functionThatReturns('text'),
  null,
  valueToSave => JSON.stringify(valueToSave),
  databaseText => JSON.parse(databaseText)
);

module.exports = DataTypes;
