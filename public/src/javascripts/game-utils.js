/* Utilities for displaying the game */

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
