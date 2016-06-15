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

  if (req.hasOwnProperty('joinGame')) {
    if (req.joinGame == 'abcde') {
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
    }
    playerInfo = defaultPlayerInfo;
  }

  let info = {
    gameInfo: gameInfo,
    playerInfo: playerInfo
  };
  cb(null, info);
};
