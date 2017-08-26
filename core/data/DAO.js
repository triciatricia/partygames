'use strict';

/* @flow */

const mysql = require('mysql');
const conn = require('./conn');
// const types = require('./types');
const assert = require('assert');
const tables = require('./tables');
const Games = require('../../models/Games');
const Users = require('../../models/Users');
// const UserGame = require('../../models/UserGame');

const TIME_LIMIT = 120000; // Time limit per round in milliseconds.

export type Image = {
  url: string,
  id: number,
};

export type GameInfo = {
  id: number,
  round: number,
  image: Image,
  waitingForScenarios: boolean,
  reactorID: number,
  reactorNickname: string,
  hostID: number,
  gameOver: boolean,
  winningResponse: string,
  winningResponseSubmittedBy: number,
  scores: Object,
  choices: Object,
  lastGif: string,
  displayOrder: string,
  imageQueue: Array<Image>,
  roundStarted: number,
  timeLeft: number,
};

// All the data access objects
const DAOs = {};

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
    let command = 'SELECT ?? FROM ??';
    let commandVals = [selectedCols, table];
    if (queryProps) {
      command += ' WHERE ?';
      Array.prototype.push.apply(commandVals, [queryProps]);
    } else {
      command += '';
    }
    command += ' FOR UPDATE';

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
    const command = 'INSERT INTO ' + table + ' SET ?;';
    const commandVals = [props];

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
    let command = 'UPDATE ?? SET';
    let commandVals = [table];
    for (const prop in props) {
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
   * props: Object with column names and values to delete
   * callback: Callback function(err, results)
   */
  this.deleteData = function(table, props, callback) {
    // Make and run command
    const command = 'DELETE FROM ?? WHERE' + _toQueryPairs(props) + ';';
    const commandVals = [table];
    this.DBConn.getConn().query(command, commandVals, callback);
  };
}

const _toQueryPairs = function(obj) {
  // Convert an object (ie: {a: b, c: d, e: f}) to a query pair
  // ie: 'a=b AND c=d AND e=f'
  let i = 0;
  let command = '';
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      if (i > 0) {
        command += ' AND';
      }
      command += ' ' + mysql.escapeId(prop) + '=' + mysql.escape(obj[prop]);
      i += 1;
    }
  }
  return command;
}

// Function that returns a promise to set a value for a game.
DAOs.setGamePromise = function(
  DBConn: conn.DBConn,
  gameID: number,
  props: Object
): Promise<?Object> {
  return new Promise((resolve, reject) => {
    const gameDAO = new DAO(DBConn);
    const gameTable = tables.game.tableName;
    const gameIDName = tables.game.gameIDName;

    // Format data for saving
    Object.keys(props).forEach(key => {
      if (Games.hasOwnProperty(key)) {
        props[key] = Games[key].beforeSaving(props[key]);
      } else {
        reject('Cannot save invalid game property: ' + key);
      }
    });

    gameDAO.updateData(gameTable, gameIDName, gameID, props, (err, res) => {
      (err ? reject('Error saving game info.') : resolve(res));
    });
  });
};

/**
 * Function that returns a promise that returns the result from inserting a game
 * into the database.
 */
DAOs.newGamePromise = function(DBConn: conn.DBConn, game: Object): Promise<Object> {
  return new Promise((resolve, reject) => {
    const gameDAO = new DAO(DBConn);
    let props = {};
    // Copy all the properties from game to props.
    Object.assign(props, game);
    const gameTable = tables.game.tableName;

    // Format data for saving
    Object.keys(props).forEach(key => {
      if (Games.hasOwnProperty(key)) {
        props[key] = Games[key].beforeSaving(props[key]);
      } else {
        reject('Cannot save invalid game property: ' + key);
      }
    });

    gameDAO.insertData(gameTable, props, (err, res) => {
      if (err) {
        reject('Error creating new game.');
      } else {
        resolve(res);
      }
    });
  });
};

/**
 * Function that returns a promise to return a game.
 */
DAOs.getGamePromise = function(DBConn: conn.DBConn, gameID: number): Promise<Object> {
  return new Promise((resolve, reject) => {
    const gameDAO = new DAO(DBConn);
    let queryProps = {};
    queryProps[tables.game.gameIDName] = gameID;

    const cb = function(err, res) {
      if (err) {
        reject('Error retrieving game info.');
      } else if (res.length === 0) {
        reject('Could not find game ' + gameID + ' in database');
      } else {
        let game = res[0];

        // Format saved data
        Object.keys(game).forEach(key => {
          if (Games.hasOwnProperty(key)) {
            game[key] = Games[key].afterLoading(game[key]);
          }
        });

        if (game.imageQueue === null) {
          // The imageQueue hasn't been made yet because
          // it's a new game.
          game.imageQueue = [];
        }

        game.scores = {};

        game.timeLeft = null;
        if (game.waitingForScenarios && game.roundStarted) {
          game.timeLeft = TIME_LIMIT - (Date.now() - game.roundStarted);
        }

        resolve(game);
      }
    };

    gameDAO.getData(tables.game.tableName, Object.getOwnPropertyNames(Games), queryProps, cb);
  });
};

/**
 * Function that promises to set a value for a user.
 */
DAOs.setUserPromise = function(DBConn: conn.DBConn, userID: number, props: Object): Promise<?Object> {
  return new Promise((resolve, reject) => {
    const userDAO = new DAO(DBConn);
    const userTable = tables.users.tableName;
    const userIDName = tables.users.userIDName;

    // Modify the callback to change usergame if it's being changed
    // Assumes a user can't be in 2 games at the same time
    let cb = (err, res) => {(err) ? reject('Error changing user info.') : resolve(res);};
    if (props.hasOwnProperty('game')) {
      cb = function(err, res) {
        if (err) { reject('Error changing user info.'); }
        userDAO.updateData(tables.usergame.tableName, 'user',
          userID, {'user': userID, 'game': props.game}, (err, res) => {
            (err) ? reject('Error changing user info.') : resolve(res);
          });
      };
    }

    // Format data for saving
    Object.keys(props).forEach(key => {
      if (Users.hasOwnProperty(key)) {
        props[key] = Users[key].beforeSaving(props[key]);
      } else {
        reject('Cannot save invalid user property: ' + key);
      }
    });

    userDAO.updateData(userTable, userIDName, userID, props, cb);
  });
};

/**
 * Function that returns a promise to create a new user and to return the userID
 * from creating a new user.
 */
DAOs.newUserPromise = function(DBConn: conn.DBConn, user: Object): Promise<number> {
  return new Promise((resolve, reject) => {
    const userDAO = new DAO(DBConn);
    let props = {};
    Object.assign(props, user);

    const cb = (err, userID) => {
      if (err) {
        console.log(err);
        reject('Error creating user.');
        return;
      }
      if (!user.hasOwnProperty('game')) {
        resolve(userID);
        return;
      }
      // Add a row to usergame if the user is in a game
      // TODO delete below? If callback above works.
      userDAO.insertData(tables.usergame.tableName,
        {'user': userID, 'game': user.game},
        (err) => {err ? reject('Error creating user.') : resolve(userID);});
    };

    // Format data for saving
    Object.keys(props).forEach(key => {
      if (Users.hasOwnProperty(key)) {
        props[key] = Users[key].beforeSaving(props[key]);
      } else {
        reject('Cannot save invalid user property: ' + key);
      }
    });

    userDAO.insertData(tables.users.tableName, props,
      function(err, res) {
        if (err) {
          console.log(err);
          reject('Error adding user to database');
          return;
        }
        cb(err, res.insertId);
      });
  });
};

/**
 * Function that returns a promise to remove a user from the game.
 */
DAOs.leaveGamePromise = function(
  DBConn: conn.DBConn,
  userID: number,
  gameID: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const userDAO = new DAO(DBConn);
    const userTable = tables.users.tableName;
    const userIDName = tables.users.userIDName;

    let props = {
      game: null
    };

    userDAO.updateData(userTable, userIDName, userID, props, (err, res) => {
      if (err) {
        console.log(err);
        reject('Unable to leave game.');
        return;
      }

      userDAO.deleteData(
        tables.usergame.tableName,
        {user: userID, game: gameID},
        (err) => {err ? reject('Unable to leave game.') : resolve()}
      );
    });
  });
};

/**
 * Function that returns a promise to return a user.
 */
DAOs.getUserPromise = function(DBConn: conn.DBConn, userID: number): Promise<Object> {
  return new Promise((resolve, reject) => {
    const userDAO = new DAO(DBConn);
    let queryProps = {};
    queryProps[tables.users.userIDName] = userID;

    const cb = function(err, res) {
      if (err) {
        reject('Error retrieving user info.');
      } else if (res.length === 0) {
        reject('Could not find user ' + userID + ' in database');
      } else {
        let playerInfo = res[0];
        // Format saved data
        Object.keys(playerInfo).forEach(key => {
          if (Users.hasOwnProperty(key)) {
            playerInfo[key] = Users[key].afterLoading(playerInfo[key]);
          }
        });
        resolve(playerInfo);
      }
    };

    userDAO.getData(tables.users.tableName, Object.getOwnPropertyNames(Users), queryProps, cb);

  });
};

/**
 * Function that returns a promise to get the users in a game
 * users: array of userIDs
 */
DAOs.getGameUsersPromise = function(DBConn: conn.DBConn, gameID: number): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const gameDAO = new DAO(DBConn);
    const queryProps = {'game': gameID};

    var cb = (err, res) => {
      if (err) {
        reject('Error retrieving game and user info.');
        return;
      }
      let users = [];
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
const getUsersPropHelper = async (
  DBConn: conn.DBConn,
  userIDs: number[],
  props: string[],
): Promise<Object> => {
  if (userIDs.length == 0) {
    return {};
  }

  const nextID = userIDs.pop();
  const userInfo = await DAOs.getUserPromise(DBConn, nextID);
  if (!userInfo) {
    throw new Error('Cannot find user record.');
  }

  let userInfoKeep = {};
  for (var i = 0; i < props.length; ++i) {
    userInfoKeep[props[i]] = userInfo[props[i]];
  }

  let usersInfo = await getUsersPropHelper(DBConn, userIDs, props);
  if ( !usersInfo || !(userInfo.hasOwnProperty('id')) ) {
    throw new Error('Error looking up user in database');
  }

  usersInfo[userInfo.id] = userInfoKeep;
  return usersInfo;
};

/**
 * Function to get properties from all users in an array
 * Returns an object where the keys are userIDs
 * cb(err, {userID: {prop: value}})
 */
DAOs.getUsersPropPromise = (
  DBConn: conn.DBConn,
  userIDs: number[],
  props: string[]
): Promise<Object> => {
  return getUsersPropHelper(DBConn, userIDs.slice(0), props);
};

module.exports = DAOs;
