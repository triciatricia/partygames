'use strict';

var Utils = require('./utils');

/*
const defaultPlayerInfo = {
  id: null,
  nickname: null,
  response: null,
  score: null,
  game: null,
  submittedScenario: false
}; */

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
  if (req.gameCode == 'abcde') { // TODO: check if valid code
    let gameInfo = {
      id: 2,
      round: null,
      image: null,
      choices: null,
      waitingForScenarios: false,
      reactorID: null,
      reactorNickname: null,
      hostID: 2,  // change - shouldn't be the host if you just joined the game. For testing purposes.
      scores: {'Cinna': 0, 'Tricia': 0},
      gameOver: false,
      winningResponse: null,
      winningResponseSubmittedBy: null
    };
    cb(null, {
      gameInfo: gameInfo
    });
  } else {
    cb('Invalid game code', {});
  }
}

function createNewGame(req, cb) {
  let gameInfo = {
    id: 3,
    round: null,
    image: null,
    choices: null,
    waitingForScenarios: false,
    reactorID: null,
    reactorNickname: null,
    hostID: null,
    scores: null,
    gameOver: false,
    winningResponse: null,
    winningResponseSubmittedBy: null
  };
  cb(null, {
    gameInfo: gameInfo
  });
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
