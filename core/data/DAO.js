'use strict';

var conn = require('./conn');
// var types = require('./types');
var assert = require('assert');
var tables = require('./tables');
var Games = require('../../models/Games');
var Users = require('../../models/Users');
// var UserGame = require('../../models/UserGame');

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
   * props: Object with column names and values to insert
   * callback: Callback function(err, results)
   */
  this.insertData = function(table, props, callback) {
    // Assert that the connection mode is write so the database can be changed.
    assert(this.DBConn.getMode() === conn.Modes.WRITE);

    // Make mysql command
    var command = 'INSERT INTO ' + table + ' SET ?;';
    var commandVals = [props];

    // Run mysql command
    this.DBConn.getConn().query(command, commandVals, callback);
  };

  /**
   * Update the data for a table
   * table: Name of the table to modify
   * idProp: Name of the ID column (unique key column) - will not change this.
   * idVal: The ID (row value in the unique key column)
   * props: Object with column names and values to insert
   * callback: Callback function(err, results)
   */
  this.updateData = function(table, idProp, idVal, props, callback) {
    // Assert that the connection mode is write so the database can be changed.
    assert(this.DBConn.getMode() === conn.Modes.WRITE);

    // Make mysql command
    var command = 'UPDATE ?? SET';
    var commandVals = [table];
    for (var prop in props) {
      if (props.hasOwnProperty(prop)) {
        if (commandVals.length > 1) {
          command += ',';
        }
        command += ' ?? = ?';
        commandVals.push(prop);
        commandVals.push(props[prop]);
      }
    }
    if (commandVals.length == 1) {
      // There are no values to update
      callback(null, null);
      return;
    }

    command += ' WHERE ?? = ?;';
    commandVals.push(idProp);
    commandVals.push(idVal);

    this.DBConn.getConn().query(command, commandVals, callback);
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
  gameDAO.updateData(gameTable, gameIDName, gameID, props, callback);
};

/**
 * Function that inserts a game.
 * Callback(err, res)
 */
DAOs.newGame = function(DBConn, game, callback) {
  var gameDAO = new DAO(DBConn);
  var props = {};
  // Copy all the properties from game to props.
  Object.assign(props, game);
  var gameTable = tables.game.tableName;
  gameDAO.insertData(gameTable, props, callback);
};

/**
 * Function that returns a promise that returns the result from inserting a game
 * into the database.
 */
DAOs.newGamePromise = function(DBConn, game) {
  return new Promise((resolve, reject) => {
    let gameDAO = new DAO(DBConn);
    let props = {};
    // Copy all the properties from game to props.
    Object.assign(props, game);
    let gameTable = tables.game.tableName;

    gameDAO.insertData(gameTable, props, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
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
      callback('Could not find game ' + gameID + ' in database', res);
    } else {
      let game = res[0];
      game.scores = {}; // TODO Find actual scores
      callback(err, game);
    }
  };

  gameDAO.getData(tables.game.tableName, Object.getOwnPropertyNames(Games), queryProps, cb);
};

/**
 * Function that returns a promise to return a game.
 */
DAOs.getGamePromise = function(DBConn, gameID) {
  return new Promise((resolve, reject) => {
    var gameDAO = new DAO(DBConn);
    var queryProps = {};
    queryProps[tables.game.gameIDName] = gameID;

    var cb = function(err, res) {
      if (err) {
        reject(err);
      } else if (res.length === 0) {
        reject('Could not find game ' + gameID + ' in database');
      } else {
        let game = res[0];
        game.scores = {}; // TODO Placeholder for actual scores - need to organize better
        resolve(game);
      }
    };

    gameDAO.getData(tables.game.tableName, Object.getOwnPropertyNames(Games), queryProps, cb);
  });
};

/**
 * Function that sets a value for a user.
 * callback(error, result)
 */
DAOs.setUser = function(DBConn, userID, props, callback) {
  var userDAO = new DAO(DBConn);
  var userTable = tables.users.tableName;
  var userIDName = tables.users.userIDName;

  // Modify the callback to change usergame if it's being changed
  // Assumes a user can't be in 2 games at the same time
  var cb = callback;
  if (props.hasOwnProperty('game')) {
    cb = function(err) {
      assert(err === null, 'Should not have an error accessing database');
      userDAO.updateData(tables.usergame.tableName, 'user',
        userID, {'user': userID, 'game': props.game}, callback);
    };
  }

  userDAO.updateData(userTable, userIDName, userID, props, cb);
};

/**
 * Function that creates a new user.
 * Callback(err, userID)
 */
DAOs.newUser = function(DBConn, user, callback) {
  var userDAO = new DAO(DBConn);
  var props = {};
  Object.assign(props, user);

  // Modify the callback to add a row to usergame
  var cb = callback;
  if (user.hasOwnProperty('game')) {
    cb = function(err, userID) {
      if (err) {
        console.log(err);
        callback(err, null);
        return;
      }
      // TODO delete below? If callback above works.
      // assert(err === null, 'Should not have an error accessing database');
      userDAO.insertData(tables.usergame.tableName,
        {'user': userID, 'game': user.game},
        function(err) {callback(err, userID);});
    };
  }
  userDAO.insertData(tables.users.tableName, props,
    function(err, res) {
      if (err) {
        console.log(err);
        callback('Error adding user to database', null);
        return;
      }
      cb(err, res.insertId);
    });
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

/**
 * Function that returns a promise to return a user.
 */
DAOs.getUserPromise = function(DBConn, userID) {
  return new Promise((resolve, reject) => {
    var userDAO = new DAO(DBConn);
    var queryProps = {};
    queryProps[tables.users.userIDName] = userID;

    var cb = function(err, res) {
      if (err) {
        reject(err);
      } else if (res.length === 0) {
        reject('Could not find user ' + userID + ' in database');
      } else {
        resolve(res[0]);
      }
    };

    userDAO.getData(tables.users.tableName, Object.getOwnPropertyNames(Users), queryProps, cb);

  });
};

/**
 * Function that gets the users in a game
 * callback(err, users)
 * users: array of userIDs
 */
DAOs.getGameUsers = function(DBConn, gameID, callback) {
  var gameDAO = new DAO(DBConn);
  var queryProps = {'game': gameID};

  var cb = function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      var users = [];
      for (var i = 0; i < res.length; ++i) {
        users.push(res[i].user);
      }
      callback(err, users);
    }
  };

  gameDAO.getData(tables.usergame.tableName, ['user'], queryProps, cb);
};

/**
 * Function that returns a promise to get the users in a game
 * users: array of userIDs
 */
DAOs.getGameUsersPromise = function(DBConn, gameID) {
  return new Promise((resolve, reject) => {
    var gameDAO = new DAO(DBConn);
    var queryProps = {'game': gameID};

    var cb = (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      var users = [];
      for (var i = 0; i < res.length; ++i) {
        users.push(res[i].user);
      }
      resolve(users);
    };

    gameDAO.getData(tables.usergame.tableName, ['user'], queryProps, cb);
  });
};

/**
 * Function to get properties from all users in an array
 * Returns an object where the keys are userIDs
 * cb(err, {userID: {prop: value}})
 */
function getUsersPropHelper(DBConn, userIDs, props, cb) {
  if (userIDs.length == 0) {
    cb(null, {});
  } else {
    let nextID = userIDs.pop();
    DAOs.getUser(DBConn, nextID, (err, userInfo) => {
      if (err) {
        cb('Cannot find user record.', {});
        return;
      }

      let userInfoKeep = {};
      for (var i in props) {
        userInfoKeep[props[i]] = userInfo[props[i]];
      }

      getUsersPropHelper(DBConn, userIDs, props, (err, usersInfo) => {
        if (err) {
          cb(err, {});
          return;
        }

        usersInfo[userInfo.id] = userInfoKeep;
        cb(null, usersInfo);
      });
    });
  }
}

/**
 * Function to get properties from all users in an array
 * Returns an object where the keys are userIDs
 * cb(err, {userID: {prop: value}})
 */
DAOs.getUsersProp = function(DBConn, userIDs, props, cb) {
  getUsersPropHelper(DBConn, userIDs.slice(0), props, cb);
};

module.exports = DAOs;
