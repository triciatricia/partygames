/* Utilities for displaying the game */

module.exports.getInstructions = function(gameInfo, playerInfo) {
  if (gameInfo.reactorID == playerInfo.id) {
    if (gameInfo.winningResponse) {
      return 'Good choice!';
    } else {
      return 'Read this list out loud and pick your favorite!';
    }
  }
};
