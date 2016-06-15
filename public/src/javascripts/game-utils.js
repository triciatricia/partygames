/* Utilities for displaying the game */
var conf = require('../../../conf');

const defaultPlayerInfo = {
  id: null,
  nickname: null,
  response: null,
  score: null,
  game: null,
  submittedScenario: false
};

module.exports.getInstructions = function(gameInfo, playerInfo) {
  if (gameInfo.reactorID == playerInfo.id) {
    if (gameInfo.winningResponse !== null) {
      return 'Good choice!';
    }
    return (playerInfo.nickname +
            ', read this list out loud and pick your favorite!');
  }
  if (gameInfo.winningResponse !== null) {
    return gameInfo.reactorNickname + ' has chosen!';
  }

  return gameInfo.reactorNickname + ' is choosing their favorite scenario. Hold tight!';
};

module.exports.joinGame = function(gameCode, cb) {
  // cb(err, gameInfo, playerInfo)
  // TODO: replace with real thing
  let gameInfo = {
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
  let playerInfo = defaultPlayerInfo;
  cb(null, gameInfo, playerInfo);
};

module.exports.log = function() {
  // Log things to the console while developing
  if (~conf.isProduction) {
    console.log.apply(console, arguments);
  }
};
