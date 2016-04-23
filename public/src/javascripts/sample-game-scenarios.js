/* Example game scenarios
   For testing purposes - put in tests later? */

var scenarios = [
  { /* 0 */
    gameInfo: {
      id: 2,
      round: 2,
      image: 'http://i.imgur.com/rxkWqmt.gif',
      choices: ['he smells banana', 'he is released into the backyard',
        'he is jumping off the couch'],
      waitingForScenarios: false,
      submittedScenario: false,
      reactorID: 3,
      reactorNickname: 'Cinna',
      hostID: 2,
      scores: {'Cinna': 1, 'Momo': 0, 'Tricia': 0},
      gameOver: false,
      winningResponse: null,
      winningResponseSubmittedBy: null
    },
    playerInfo: {
      id: 3,
      nickname: 'Cinna',
      response: null,
      score: 1,
      game: 2
    }
  },
  { /* 1 */
    gameInfo: {
      id: 2,
      round: 2,
      image: 'http://i.imgur.com/rxkWqmt.gif',
      choices: ['he smells banana', 'he is released into the backyard',
        'he is jumping off the couch'],
      waitingForScenarios: false,
      submittedScenario: false,
      reactorID: 3,
      reactorNickname: 'Cinna',
      hostID: 2,
      scores: {'Cinna': 1, 'Momo': 0, 'Tricia': 0},
      gameOver: false,
      winningResponse: 1,
      winningResponseSubmittedBy: 'Momo'
    },
    playerInfo: {
      id: 3,
      nickname: 'Cinna',
      response: null,
      score: 1,
      game: 2
    }
  }
];

module.exports.scenarios = scenarios;
