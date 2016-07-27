'use strict';

var Utils = require('./utils');
var ConnUtils = require('./data/conn');
var DAO = require('./data/DAO');

const defaultPlayerInfo = {
  id: null,
  nickname: null,
  response: null,
  score: null,
  game: null,
  submittedScenario: false
};

const defaultGame = {
  round: null,
  gameOver: 0,
  image: null,
  hostID: null,
  reactorID: null
};  // TODO change this to a real default

/* function generateGameCode(id) {
  return id.toString();
} */

function getIDFromGameCode(code) {
  return parseInt(code);
}

function getScoresWithConn(conn, userIDs, cb) {
  // cb(err, scores)
  // scores = {nickname: score} for the userIDs
  if (userIDs.length == 0) {
    cb(null, {});
  } else {
    let nextID = userIDs.pop();
    DAO.getUser(conn, nextID, (err, userInfo) => {
      if (err) {
        cb('Cannot find user record.', {});
        return;
      }

      getScoresWithConn(conn, userIDs, (err, scores) => {
        if (err) {
          cb(err, {});
          return;
        }

        scores[userInfo.nickname] = userInfo.score;
        cb(null, scores);
      });
    });
  }


}

function getPlayerGameInfoWithConn(conn, playerID, gameID, cb) {
  // cb(err, {gameInfo: blah, playerInfo: blah})
  DAO.getGame(conn, gameID, (err, gameInfo) => {
    if (err) {
      cb('Cannot find game record.', {});
      return;
    }

    DAO.getUser(conn, playerID, (err, playerInfo) => {
      if (err) {
        cb('Cannot find user record.', {});
        return;
      }

      // For now, get every user's scores.
      // TODO In the future, don't update score info as often if it takes too much time.
      DAO.getGameUsers(conn, gameID, (err, userIDs) => {
        if (err) {
          cb('Cannot find game users in record.', {});
          return;
        }

        getScoresWithConn(conn, userIDs, (err, scores) => {
          // scores = {nickname: score}
          if (err) {
            cb('Error retrieving scores', {});
            return;
          }

          gameInfo.scores = scores;

          cb(null, {
            gameInfo: gameInfo,
            playerInfo: playerInfo
          });

        });
      });
    });
  });
}

function getGameInfo(req, cb) {
  let gameID = req.gameID;
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.READ,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      DAO.getGame(conn, gameID, (err, res) => {
        if (err) {
          cb('Cannot find game record.', {});
        } else {
          cb(null, {
            gameInfo: res
          });
        }
        conn.getConn().end();
      });
    });
}

function joinGame(req, cb) {
  // Get the gameID of a game and check if it's a valid
  // game.
  let gameID = getIDFromGameCode(req.gameCode);
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.READ,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      DAO.getGame(conn, gameID, (err, res) => {
        if (err) {
          cb(err, {});
        } else {
          cb(null, {
            gameInfo: res
          });
        }
        conn.getConn().end();
      });
    });
}

function createNewGame(req, cb) {
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.WRITE,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      DAO.newGame(conn, defaultGame, (err, res) => {
        if (err) {
          conn.getConn().end();
          cb(err);
          return;
        }

        console.log('Creating game with ID ' + res.insertId);

        DAO.getGame(conn, res.insertId, (err, res) => {
          if (err) {
            conn.getConn().end();
            cb(err);
            return;
          }

          conn.getConn().end();
          cb(null, {
            gameInfo: res
          });
        });
      });
    }
  );
}

function createPlayer(req, cb) {
  // Create a player called req.nickname
  // in the game req.gameID
  let gameID = req.gameID;
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.WRITE,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      DAO.getGame(conn, gameID, (err) => {
        if (err) {
          conn.getConn().end();
          cb('Cannot find game record.', {});
          return;
        }

        // TODO Check if playerInfo is valid?
        // TODO Check if there is a user with the same nickname in the game
        let playerInfo = {
          nickname: req.nickname,
          game: gameID
        };
        Utils.extend(playerInfo, defaultPlayerInfo);

        DAO.newUser(conn, playerInfo, (err, playerID) => {
          if (err) {
            conn.getConn().end();
            cb('Error creating player.', {});
            return;
          }

          getPlayerGameInfoWithConn(conn, playerID, gameID, (err, info) => {
            conn.getConn().end();
            cb(err, info);
          });
        });
      });
    });

  /* if (req.gameID == 2) { // TODO check game ID
    // TODO Need to be different depending on whether is host
    let gameInfo = {
      id: 2,
      round: null,
      image: null,
      choices: null,
      waitingForScenarios: false,
      reactorID: null,
      reactorNickname: null,
      hostID: 2,
      scores: {'Cinna': 0, 'Momo': 0, 'Tricia': 0},
      gameOver: false,
      winningResponse: null,
      winningResponseSubmittedBy: null
    };
    let playerInfo = {
      id: 2,
      nickname: 'Tricia',
      response: null,
      score: 0,
      game: 2,
      submittedScenario: false
    };
    playerInfo.nickname = req.nickname;

    cb(null, {
      gameInfo: gameInfo,
      playerInfo: playerInfo
    });

  } else {
    cb('Cannot find game in records', {});
  } */
}

function startGame(req, cb) {
  if (req.playerID == 2) {// TODO check if the player is the host, check if game hasn't been started
    let gameInfo = {
      id: 2,
      round: 2,
      image: 'http://i.imgur.com/rxkWqmt.gif',
      choices: null,
      waitingForScenarios: true,
      reactorID: 3,
      reactorNickname: 'Cinna',
      hostID: 2,
      scores: {'Cinna': 1, 'Momo': 0, 'Tricia': 0},
      gameOver: false,
      winningResponse: null,
      winningResponseSubmittedBy: null
    };
    let playerInfo = {
      id: 2,
      nickname: 'Tricia',
      response: null,
      score: 0,
      game: 2,
      submittedScenario: false
    };

    cb(null, {
      gameInfo: gameInfo,
      playerInfo: playerInfo
    });
  } else {
    cb('Error starting game.', {});
  }
}

// Functions that call cb(err, res), where res = {gameInfo: [blah], playerInfo: [blah]}
const actions = {
  getGameInfo: getGameInfo,
  joinGame: joinGame,
  createPlayer: createPlayer,
  createNewGame: createNewGame,
  startGame: startGame
};

module.exports.processRequest = (req, cb) => {
  // Process requests to the server
  // req has the 'action' property to tell it what action to complete
  // cb(err, res)
  // req = {gameInfo: ..., playerInfo: ...}

  if (!req.hasOwnProperty('action') || !actions.hasOwnProperty(req.action)) {
    return cb('Error while processing your information');
  }

  actions[req.action](req, (err, info) => {
    let res = {
      'gameInfo': null,
      'playerInfo': null
    };
    Utils.extend(res, info);
    cb(err, res);
  });

};
