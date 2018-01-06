/* @flow */
'use strict';

import assert from 'assert';
import mysql from 'mysql';

import conn from './conn';
import tables from './tables';
import Games from '../../models/Games';
import Users from '../../models/Users';
// import UserGame from '../../models/UserGame';
import Images from '../../models/Images';

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
  responsesIn: number,
  hostID: number,
  gameOver: boolean,
  winningResponse: string | null,
  winningResponseSubmittedBy: number,
  scores: Object,
  choices: Object,
  lastGif: string,
  displayOrder: string,
  imageQueue: Array<Image>,
  roundStarted: ?number,
  firstImageID: ?number,
  timeLeft: number | null,
  gameImages?: Array<{
    gameImageId: number,
    imageUrl: string,
    scenario: string,
    reactorNickname: string,
  }>,
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
   * appendQuery: Optional: escaped string to append to the query.
   */
  this.getData = function(table, selectedCols, queryProps, callback, appendQuery) {
    let command = 'SELECT ?? FROM ??';
    let commandVals = [selectedCols, table];
    if (queryProps) {
      command += ' WHERE ? ';
      Array.prototype.push.apply(commandVals, [queryProps]);
    } else {
      command += ' ';
    }

    if (appendQuery) {
      command += appendQuery;
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
    const command = 'INSERT INTO ' + table + ' SET ?;';
    const commandVals = [props];

    // Run mysql command
    this.DBConn.getConn().query(command, commandVals, callback);
  };

  /**
   * Insert props into the table or update key (possibly to the same value) if already inserted.
   * table: Name of the table to modify
   * props: Object with column names and values to insert
   * keyName: Column name of the key
   * keyVal: Value at keyName
   * callback: Callback function(err, results)
   */
  this.insertOrUpdateData = function(table, props, keyName, keyVal, callback) {
    // Assert that the connection mode is write so the database can be changed.
    assert(this.DBConn.getMode() === conn.Modes.WRITE);

    // Make mysql command
    const command = 'INSERT INTO ' + table + ' SET ? ON DUPLICATE KEY UPDATE ?? = ?;';
    const commandVals = [props, keyName, keyVal];

    // Run mysql command
    this.DBConn.getConn().query(command, commandVals, callback);
  };

  /**
   * Update the data for a table
   * table: Name of the table to modify
   * idProps: Names of the ID columns (unique key column) - will not change this.
   * idVals: The ID (row values in the unique key column)
   * props: Object with column names and values to insert
   * callback: Callback function(err, results)
   */
  this.updateData = function(table, idProps, idVals, props, callback) {
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

    command += ' WHERE ?? = ?';
    commandVals.push(idProps[0]);
    commandVals.push(idVals[0]);

    for (let i = 1; i < idProps.length; ++i) {
      command += ' AND ?? = ?';
      commandVals.push(idProps[i]);
      commandVals.push(idVals[i]);
    }
    command += ';';

    this.DBConn.getConn().query(command, commandVals, callback);
  };

  /**
   * Update the data for a table so that a column is increased by an amount.
   * table: Name of the table to modify
   * prop: Name of the column to use to select which row(s) to change
   * val: The value of the prop column in the row(s) to change
   * changeProp: The name of the column to change
   * delta: The number to add to the existing value
   * callback: Callback function(err, results)
   */
  this.incrementData = function(table, prop, val, changeProp, delta, callback) {
    // Assert that the connection mode is write so the database can be changed.
    assert(this.DBConn.getMode() === conn.Modes.WRITE);

    // Make mysql command
    let command = 'UPDATE ?? SET ?? = ?? + ? WHERE ?? = ?;';
    let commandVals = [table, changeProp, changeProp, delta, prop, val];

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
        try {
          props[key] = Games[key].beforeSaving(props[key]);
        }
        catch (err) {
          reject('Cannot save game property ${key}. Check formatting.');
        }
      } else {
        reject('Cannot save invalid game property: ' + key);
      }
    });

    gameDAO.updateData(gameTable, [gameIDName], [gameID], props, (err, res) => {
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
        try {
          props[key] = Games[key].beforeSaving(props[key]);
        }
        catch (err) {
          reject('Cannot save game property ${key}. Check formatting.');
        }
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
        console.warn(err);
        reject('Error retrieving game info.');
      } else if (res.length === 0) {
        reject('Could not find game ' + gameID + ' in database');
      } else {

        // Get the scores
        gameDAO.getData(
          tables.users.tableName,
          ['id', 'nickname', 'score', 'response'],
          {game: gameID},
          function(err, scoreRes) {
            if (err) {
              console.warn(err);
              reject('Error retrieving game info.');
            } else {
              let game = res[0];

              // Format saved data
              Object.keys(game).forEach(key => {
                if (Games.hasOwnProperty(key)) {
                  try {
                    game[key] = Games[key].afterLoading(game[key]);
                  }
                  catch (err) {
                    reject('Error retrieving game info.');
                  }
                }
              });

              addAdditionalProps(game, scoreRes);

              resolve(game);

            }
          }
        );
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
        userDAO.updateData(tables.usergame.tableName, ['user'],
          [userID], {'user': userID, 'game': props.game}, (err, res) => {
            (err) ? reject('Error changing user info.') : resolve(res);
          });
      };
    }

    // Format data for saving
    Object.keys(props).forEach(key => {
      if (Users.hasOwnProperty(key)) {
        try {
          props[key] = Users[key].beforeSaving(props[key]);
        }
        catch (err) {
          reject('Cannot save user property ${key}. Check formatting.');
        }
      } else {
        reject('Cannot save invalid user property: ' + key);
      }
    });

    userDAO.updateData(userTable, [userIDName], [userID], props, cb);
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
        try {
          props[key] = Users[key].beforeSaving(props[key]);
        }
        catch (err) {
          reject('Cannot save user property ${key}. Check formatting.');
        }
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

    userDAO.updateData(userTable, [userIDName], [userID], props, (err, res) => {
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
            try {
              playerInfo[key] = Users[key].afterLoading(playerInfo[key]);
            }
            catch (err) {
              reject('Error retrieving user info.');
            }
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
 * Function that returns a promise to return the pushTokens of
 * users that have apps that were last active between
 * the times specified (the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC.)
 * Note that values are not escaped at the moment. TODO
 */
DAOs.getPushTokensPromise = function(
  DBConn: conn.DBConn,
  userIDs: Array<number>,
  start: number,
  end: number
): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    if (userIDs.length === 0) {
      resolve([]);
      return;
    }

    let command = (
      `SELECT ExpoPushToken FROM ${tables.users.tableName} ` +
      `WHERE ${tables.users.userIDName} IN (${userIDs.join(', ')}) ` +
      `AND lastActiveTime >= ${start} ` +
      `AND lastActiveTime <= ${end}`
    );

    DBConn.getConn().query(command, [], (err, res) => {
      if (err) {
        reject('Error retrieving user info.');
      } else {
        let pushTokens = [];
        for (let data of res) {
          pushTokens.push(data.ExpoPushToken);
        }
        resolve(pushTokens);
      }
    });

  });
};

/**
 * Function that returns a promise to return data on an image, given the url.
 */
DAOs.getImagePromise = function(DBConn: conn.DBConn, url: string): Promise<Object> {
  return new Promise((resolve, reject) => {
    const imageDAO = new DAO(DBConn);

    const cb = function(err, res) {
      if (err) {
        reject('Error retrieving image info.');
      } else if (res.length === 0) {
        reject('Could not find image with url ' + url + ' in database');
      } else {
        resolve(res[0]);
      }
    };

    imageDAO.getData(tables.images.tableName, Object.getOwnPropertyNames(Images), {url}, cb);

  });
};

/**
 * Add an image to the gameimage database.
 * Inserts the image into the images database if it is not already in it.
 */
DAOs.newImagePromise = function(
  DBConn: conn.DBConn,
  url: string,
  gameId: number,
  gameImageId: number,
  reactorNickname: string,
): Promise<Object> {
  return new Promise((resolve, reject) => {
    const imageDAO = new DAO(DBConn);

    imageDAO.insertOrUpdateData(tables.images.tableName, {url}, 'url', url, (err, res) => {
      if (err) {

        console.warn(err);
        reject('Error adding image url to database.');

      } else {

        const props = {
          gameId: gameId,
          gameImageId: gameImageId,
          imageUrl: url,
          reactorNickname: reactorNickname,
        };

        imageDAO.insertData(tables.gameimage.tableName, props, (err, res) => {
          if (err) {

            console.warn(err);
            reject('Error adding image to gameimage database.');

          } else {

            resolve(res);

          }
        });

      }
    });
  });
};

/**
 * Skip image. Increase the skip count of an image by 1.
 */
DAOs.skipImagePromise = function(DBConn: conn.DBConn, url: string, gameId: number, gameImageId: number): Promise<Object> {
  return new Promise((resolve, reject) => {
    const imageDAO = new DAO(DBConn);

    imageDAO.updateData(
      tables.gameimage.tableName,
      ['gameId', 'gameImageId'],
      [gameId, gameImageId],
      {wasSkipped: true},
      (err, res) => {
        if (err) {
          reject('Database error skipping image.');
          return;
        }
        imageDAO.incrementData(tables.images.tableName, 'url', url, 'nSkipped', 1, (err, res) => {
          if (err) {
            reject('Error increasing image skip count.');
          } else {
            resolve(res);
          }
        });
      });

  });
};

/**
 * Increase the heart count of an image by 1.
 */
DAOs.increaseHeartCountPromise = function(DBConn: conn.DBConn, url: string): Promise<Object> {
  return new Promise((resolve, reject) => {
    const imageDAO = new DAO(DBConn);

    imageDAO.incrementData(tables.images.tableName, 'url', url, 'nHearted', 1, (err, res) => {
      if (err) {
        reject('Error increasing image heart count.');
      } else {
        resolve(res);
      }
    });
  });
};

/**
 * Set the scenario for an image in a game.
 */
DAOs.setImageScenarioPromise = function(
 DBConn: conn.DBConn,
 gameId: number,
 gameImageId: number,
 scenario: string
): Promise<?Object> {
  return new Promise((resolve, reject) => {
    const imageDAO = new DAO(DBConn);

    imageDAO.updateData(
      tables.gameimage.tableName,
      ['gameId', 'gameImageId'],
      [gameId, gameImageId],
      {wasSkipped: false, scenario: scenario},
      (err, res) => {
        if (err) {
          reject('Database error skipping image.');
          return;
        }
        resolve(res);
      });
  });
};

/**
 * Returns a promise to return all the images with scenarios for a game.
 * after: Optionally, return only images with gameImageId >= after
 */
DAOs.getGameImagesPromise = function(
  DBConn: conn.DBConn,
  gameId: number,
  after?: ?number,
): Promise<Array<{
  gameImageId: number,
  imageUrl: string,
  scenario: string,
  reactorNickname: string,
}>> {
  return new Promise((resolve, reject) => {
    const imageDAO = new DAO(DBConn);

    let appendedQuery = ' AND scenario IS NOT NULL';
    if (after) {
      appendedQuery += ' AND gameImageId >= ' + mysql.escape(after);
    }

    let images = imageDAO.getData(
      tables.gameimage.tableName,
      ['gameImageId', 'imageUrl', 'scenario', 'reactorNickname'],
      {gameId},
      (err, res) => {
        if (err) {
          console.warn(err);
          reject('Database error retrieving images from game.');
          return;
        }

        // Sort by gameImageId
        res.sort((a, b) => a.gameImageId - b.gameImageId);
        resolve(res);
      },
      appendedQuery,
    );

  });
};

function choiceIDFromPlayerID(playerID: string | number | null): string | null {
  // Insert '_' before each id so it doesn't default to ordering responses by id.
  return playerID ? '_' + playerID : null;
};

/**
 * Add additional properties beyond what's in the games table row to make GameInfo complete.
 * These are: imageQueue, scores, choices, winningResponse, responsesIn, timeLeft.
 */
function addAdditionalProps(
  game: GameInfo,
  scoreRes: Array<{
    id: number,
    score: number | null,
    nickname: string | null,
    response: string | null,
  }>
) {
  if (game.imageQueue === null) {
    // The imageQueue hasn't been made yet because
    // it's a new game.
    game.imageQueue = [];
  }

  game.scores = {};
  const infoList = [];
  scoreRes.forEach((info, idx) => {
    if (info.score != null && info.nickname) {
      game.scores[info.nickname] = info.score;
    }
    if (info.response) {
      infoList.push(info);
    }
  });

  game.choices = {};

  if (game.displayOrder) {
    const displayOrder = game.displayOrder.split(',');
    if (displayOrder) {
      displayOrder.forEach(x => {
        const i = parseInt(x);
        if (i < infoList.length) { // In case not everyone submitted a response
          game.choices[choiceIDFromPlayerID(infoList[i].id)] = infoList[i].response;
        }
      });
    }
  }

  game.winningResponse = choiceIDFromPlayerID(game.winningResponse);
  game.responsesIn = infoList.length;

  game.timeLeft = null;
  const roundStarted = game.roundStarted;
  if (game.waitingForScenarios && roundStarted) {
    game.timeLeft = TIME_LIMIT - (Date.now() - roundStarted);
  }
}

module.exports = DAOs;
