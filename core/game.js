'use strict';

var Utils = require('./utils');
var ConnUtils = require('./data/conn');
var DAO = require('./data/DAO');

/*
const defaultPlayerInfo = {
  id: null,
  nickname: null,
  response: null,
  score: null,
  game: null,
  submittedScenario: false
}; */

const defaultGame = {
  round: null,
  isCompleted: 0,
  lastImage: null,
  gameCode: null, // TODO generate
  timeCreated: 123, // TODO generate
  host: null,
  reactor: null,
  images: null
};  // TODO change this to a real default

function generateGameCode(id) {
  return id.toString();
}

function getIDFromGameCode(code) {
  return parseInt(code);
}

function getGameInfo(req, cb) {
  if (req.gameID == 2) { // TODO Check for game id
    let gameInfo = {
      id: 2,
      round: null,
      image: null,
      choices: null,
      waitingForScenarios: false,
      reactorID: null,
      reactorNickname: null,
      hostID: 2,  // change - shouldn't be the host if you just joined the game. For testing purposes.
      scores: {'Cinna': 0, 'Tricia': 0, 'Momo': 0},
      gameOver: false,
      winningResponse: null,
      winningResponseSubmittedBy: null
    };
    cb(null, {
      gameInfo: gameInfo
    });
  } else {
    cb('Cannot find game record', {});
  }
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
  if (req.gameID == 2) { // TODO check game ID
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
  }
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
