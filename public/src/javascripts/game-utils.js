/* Utilities for displaying the game */
var conf = require('../../../conf');

function postToServer(data, cb) {
  // Send game info to the server
  // cb(error, gameInfo, playerInfo)
  $.post(
    '/api/game',
    data,
    (res) => { // function can also take status
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
    'gameCode': gameCode,
    'action': 'joinGame'
  }, cb);
};

module.exports.createGame = function(cb) {
  // cb(err, gameInfo, playerInfo)
  postToServer({
    'action': 'createNewGame'
  }, cb);
};

module.exports.createPlayer = function(nickname, gameID, cb) {
  // cb(err, gameInfo, playerInfo)
  postToServer({
    'nickname': nickname,
    'gameID': gameID,
    'action': 'createPlayer'
  }, cb);
};

module.exports.getGameInfo = function(id, cb) {
  // Gets the game info from the server
  // cb(err, gameInfo, playerInfo)
  postToServer({
    'gameID': id,
    'action': 'getGameInfo'
  }, cb);
};

module.exports.startGame = function(gameID, playerID, cb) {
  // Start a game if the player is the host of the game
  // cb(err, gameInfo, playerInfo)
  postToServer({
    'gameID': gameID,
    'playerID': playerID,
    'action': 'startGame'
  }, cb);
};

module.exports.log = function() {
  // Log things to the console while developing
  if (~conf.isProduction) {
    console.log.apply(console, arguments);
  }
};
