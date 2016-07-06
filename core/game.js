'use strict';

const defaultPlayerInfo = {
  id: null,
  nickname: null,
  response: null,
  score: null,
  game: null,
  submittedScenario: false
};

module.exports.processRequest = (req, cb) => {
  // info = {gameInfo: ..., playerInfo: ...}
  // TODO replace below with functions to actually find the gameInfo
  // depending on req
  let gameInfo = null;
  let playerInfo = null;
  playerInfo = defaultPlayerInfo; // For now TODO change

  if (req.hasOwnProperty('joinGame') && req.joinGame == 'abcde') { // TODO: check if valid code
    gameInfo = {
      id: 2,
      round: null,
      image: null,
      choices: null,
      waitingForScenarios: false,
      reactorID: null,
      reactorNickname: null,
      hostID: 2,
      scores: {'Cinna': 0, 'Tricia': 0},
      gameOver: false,
      winningResponse: null,
      winningResponseSubmittedBy: null
    };
  } else if (req.hasOwnProperty('createNewGame') && req.createNewGame) {
    gameInfo = {
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
  } else if (req.hasOwnProperty('createPlayer')) {
    // TODO Need to be different depending on whether is host
    gameInfo = {
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
    playerInfo = {
      id: 2,
      nickname: 'Tricia',
      response: null,
      score: 0,
      game: 2,
      submittedScenario: false
    };
    playerInfo.nickname = req.createPlayer;
  } else {
    return cb('Error while processing your information');
  }


  let info = {
    gameInfo: gameInfo,
    playerInfo: playerInfo
  };
  cb(null, info);
};
