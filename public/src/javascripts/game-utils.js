/* Utilities for displaying the game */
var conf = require('../../../conf');

function postToServer(data, cb) {
  // Send game info to the server
  // cb(error, gameInfo, playerInfo)
  $.post(
    '/api/game',
    data,
    (res, status) => {
      if (res.result) {
        cb(null, res.result.gameInfo, res.result.playerInfo);
      } else if (res.errorMessage) {
        cb(res.errorMessage, null, null);
      } else {
        cb('Error communicating with server', null, null);
      }
    }
  );
}

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
  // Check if the game is valid and retrieve info
  // TODO Escape gameCode to make safer?
  postToServer({
    'joinGame': gameCode
  }, cb);
  // TODO Move defaultPlayerInfo to server side
};

module.exports.log = function() {
  // Log things to the console while developing
  if (~conf.isProduction) {
    console.log.apply(console, arguments);
  }
};
