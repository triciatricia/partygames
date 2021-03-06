/* Utilities for displaying the game */
const conf = require('../../../conf');

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
        console.log(res);
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

module.exports.getGameInfo = function(gameID, playerID, cb) {
  // Gets the game info from the server
  // cb(err, gameInfo, playerInfo)
  if (playerID) {
    postToServer({
      'gameID': gameID,
      'playerID': playerID,
      'action': 'getGameInfo'
    }, cb);
  } else {
    postToServer({
      'gameID': gameID,
      'action': 'getGameInfo'
    }, cb);
  }
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

module.exports.submitResponse = function(response, gameID, playerID, round, cb) {
  // Submit a player's reaction description
  // cb(err, gameInfo, playerInfo)
  postToServer({
    gameID: gameID,
    playerID: playerID,
    round: round,
    response: response,
    action: 'submitResponse'
  }, cb);
};

module.exports.chooseScenario = function(choiceID, gameID, playerID, round, cb) {
  // Submit the winning scenario
  // cb(err, gameInfo, playerInfo)
  postToServer({
    gameID: gameID,
    playerID: playerID,
    round: round,
    choiceID: choiceID,
    action: 'chooseScenario'
  }, cb);
};

module.exports.skipImage = function(gameID, playerID, cb) {
  postToServer({
    gameID: gameID,
    playerID: playerID,
    action: 'skipImage'
  }, cb);
};

module.exports.nextRound = function(gameID, playerID, cb) {
  postToServer({
    gameID: gameID,
    playerID: playerID,
    action: 'nextRound'
  }, cb);
};

module.exports.endGame = function(gameID, playerID, cb) {
  postToServer({
    gameID: gameID,
    playerID: playerID,
    action: 'endGame'
  }, cb);
};

module.exports.leaveGame = function(playerID, cb) {
  postToServer({
    playerID: playerID,
    action: 'leaveGame'
  }, cb);
};

module.exports.log = function() {
  // Log things to the console while developing
  if (~conf.isProduction) {
    console.log.apply(console, arguments);
  }
};
