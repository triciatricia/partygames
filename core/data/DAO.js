"use strict";

var conn = require('./conn');
var types = require('./types');
var assert = require('assert');
var utils = require('../utils');
var tables = require('./tables');
var Games = require('../../models/Games');
var Users = require('../../models/Users');
var UserGame = require('../../models/UserGame');

// All the data access objects
var DAOs = {};

/**
 * @constructor
 * Data access object
 * conn: DBConn (see conn.js).
 * Writer and getter from/to mysql
 */
function DAO(DBConn) {
  // assert(DBConn instanceof conn.DBConn, 'Should be given a valid database connection');  // Issue with this in jasmine test.
  this.DBConn = DBConn;

  /**
   * table: Name of the table to get data from
   * selectedCols: List of columns to select
   * queryProps: String with column names and values specifying which
   * rows to get
   * callback: Callback function(err, results)
   */
  this.getData = function(table, selectedCols, queryProps, callback) {
    var command = 'SELECT ?? FROM ??';
    var commandVals = [selectedCols, table];
    if (queryProps) {
      command += ' WHERE ?';
      Array.prototype.push.apply(commandVals, [queryProps]);
    } else {
      command += '';
    }

    this.DBConn.getConn().query(command, commandVals, callback);
  };

  /**
   * table: Name of the table to modify
   * idProp: Name of the ID column (unique key column), null to make new entry
   * props: Object with column names and values to insert
   * callback: Callback function(err, results)
   */
  this.setData = function(table, idProp, props, callback) {
    // Assert that the connection mode is write so the database can be changed.
    assert(this.DBConn.getMode() === conn.Modes.WRITE);

    // Make mysql command
    var command = 'INSERT INTO ' + table + ' SET ?';
    var commandVals = [props];
    if (idProp && props.hasOwnProperty(idProp)) {
      command += ' ON DUPLICATE KEY UPDATE ?;';
      var propsNoID = {};
      for (var prop in props) {
        if (props.hasOwnProperty(prop) && props[prop] != idProp) {
          propsNoID[prop] = props[prop];
        }
      }
    }  else {
      command += ';';
    }

    // Run mysql command
    this.DBConn.getConn().query(command, commandVals, callback);
  };

  /**
   * Insert data
   */
  this.insertData = function(table, props, callback) {
    this.setData(table, null, props, callback);
  };

  /**
   * table: Name of the table to modify
   * props: Object with column names and values to insert
   * callback: Callback function(err, results)
   */
  this.deleteData = function(table, props, callback) {
    // Assert that the connection mode is write so the database can be changed.
    assert(this.DBConn.getMode() === conn.Modes.WRITE);

    // Make and run command
    var command = 'DELETE FROM ? WHERE ?;';
    var commandVals = [table, props];
    this.DBConn.getConn().query(command, commandVals, callback);
  };
}

// Function that sets a value for a game.
DAOs.setGame = function(DBConn, gameID, props, callback) {
  var gameDAO = new DAO(DBConn);
  var gameTable = tables.game.tableName;
  var gameIDName = tables.game.gameIDName;
  gameDAO.setData(gameTable, gameIDName, props, callback);
};

/**
 * Function that inserts a game.
 * Callback(err, res)
 */
 DAOs.newGame = function(DBConn, game, callback) {
  var gameDAO = new DAO(DBConn);
  var props = {};
  // Copy all the properties from game to props.
  utils.extend(props, game);
  var gameTable = tables.game.tableName;
  gameDAO.insertData(gameTable, props, callback);
 };

/**
 * Function that retrieves a game.
 * Callback(err, game)
 */
DAOs.getGame = function(DBConn, gameID, callback) {
  var gameDAO = new DAO(DBConn);
  var queryProps = {};
  queryProps[tables.game.gameIDName] = gameID;

  var cb = function(err, res) {
    if (err) {
      callback(err, null);
    } else if (res.length === 0) {
      callback('Could not find game ' + gameID + 'in database', res);
    } else {
      callback(err, res[0]);
    }
  };

  gameDAO.getData(tables.game.tableName, Object.getOwnPropertyNames(Games), queryProps, cb);
};

/**
 * Function that sets a value for a user.
 */
DAOs.setUser = function(DBConn, userID, props, callback) {
  var userDAO = new DAO(DBConn);
  var userTable = tables.users.tableName;
  var userIDName = tables.users.userIDName;
  userDAO.setData(userTable, userIDName, props, callback);
};

/**
 * Function that creates a new user.
 * Callback(err, res)
 */
DAOs.newUser = function(DBConn, user, callback) {
  var userDAO = new DAO(DBConn);
  var props = {};
  utils.extend(props, user);
  userDAO.insertData(tables.users.tableName, props, callback);
};

/**
 * Function that retrieves a user.
 * Callback(err, user)
 */
DAOs.getUser = function(DBConn, userID, callback) {
  var userDAO = new DAO(DBConn);
  var queryProps = {};
  queryProps[tables.users.userIDName] = userID;

  var cb = function(err, res) {
    if (err) {
      callback(err, null);
    } else if (res.length === 0) {
      callback('Could not find user ' + userID + ' in database', res);
    } else {
      callback(err, res[0]);
    }
  };

  userDAO.getData(tables.users.tableName, Object.getOwnPropertyNames(Users), queryProps, cb);
};

module.exports = DAOs;