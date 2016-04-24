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
      game: 2,
      submittedScenario: false
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
      game: 2,
      submittedScenario: false
    }
  },
  { /* 2 */
    gameInfo: {
      id: 2,
      round: 2,
      image: 'http://i.imgur.com/rxkWqmt.gif',
      choices: ['he smells banana', 'he is released into the backyard',
        'he is jumping off the couch'],
      waitingForScenarios: false,
      reactorID: 3,
      reactorNickname: 'Cinna',
      hostID: 2,
      scores: {'Cinna': 1, 'Momo': 0, 'Tricia': 0},
      gameOver: false,
      winningResponse: 1,
      winningResponseSubmittedBy: 'Momo'
    },
    playerInfo: {
      id: 2,
      nickname: 'Tricia',
      response: 'he smells banana',
      score: 1,
      game: 2,
      submittedScenario: true
    }
  },
  { /* 3 Reactor - waiting for responses */
    gameInfo: {
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
    },
    playerInfo: {
      id: 3,
      nickname: 'Cinna',
      response: null,
      score: 1,
      game: 2,
      submittedScenario: false
    }
  },
  { /* 4 Other players - submit scenario */
    gameInfo: {
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
    },
    playerInfo: {
      id: 1,
      nickname: 'Momo',
      response: null,
      score: 1,
      game: 2,
      submittedScenario: false
    }
  },
  { /* 5 Other players - reaction submitted */
    gameInfo: {
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
    },
    playerInfo: {
      id: 1,
      nickname: 'Momo',
      response: 'he is released into the backyard',
      score: 1,
      game: 2,
      submittedScenario: true
    }
  },
  { /* 6 Host: waiting for players to join */
    gameInfo: {
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
    },
    playerInfo: {
      id: 2,
      nickname: 'Tricia',
      response: null,
      score: 0,
      game: 2,
      submittedScenario: false
    }
  },
  { /* 7 waiting to start */
    gameInfo: {
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
    },
    playerInfo: {
      id: 3,
      nickname: 'Cinna',
      response: null,
      score: 0,
      game: 2,
      submittedScenario: false
    }
  },
  { /* 8 new game/join game */
    gameInfo: null,
    playerInfo: null
  },
  { /* 9 submit nickname */
    gameInfo: {
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
    },
    playerInfo: {
      id: null,
      nickname: null,
      response: null,
      score: null,
      game: null,
      submittedScenario: false
    }
  },
  { /* 10 Game over - Host */
    gameInfo: {
      id: 2,
      round: null,
      image: null,
      choices: null,
      waitingForScenarios: false,
      reactorID: 3,
      reactorNickname: 'Cinna',
      hostID: 2,
      scores: {'Cinna': 3, 'Momo': 2, 'Tricia': 1},
      gameOver: true,
      winningResponse: null,
      winningResponseSubmittedBy: null
    },
    playerInfo: {
      id: 2,
      nickname: 'Tricia',
      response: null,
      score: 1,
      game: 2,
      submittedScenario: false
    }
  },
  { /* 11 Game over - Other players */
    gameInfo: {
      id: 2,
      round: null,
      image: null,
      choices: null,
      waitingForScenarios: false,
      reactorID: 3,
      reactorNickname: 'Cinna',
      hostID: 2,
      scores: {'Cinna': 3, 'Momo': 2, 'Tricia': 1},
      gameOver: true,
      winningResponse: null,
      winningResponseSubmittedBy: null
    },
    playerInfo: {
      id: 1,
      nickname: 'Cinna',
      response: null,
      score: 3,
      game: 2,
      submittedScenario: false
    }
  },
  { /* 12 Other players - waiting for reactor to choose */
    gameInfo: {
      id: 2,
      round: 2,
      image: 'http://i.imgur.com/rxkWqmt.gif',
      choices: ['he smells banana', 'he is released into the backyard',
        'he is jumping off the couch'],
      waitingForScenarios: false,
      reactorID: 3,
      reactorNickname: 'Cinna',
      hostID: 2,
      scores: {'Cinna': 1, 'Momo': 0, 'Tricia': 0},
      gameOver: false,
      winningResponse: null,
      winningResponseSubmittedBy: null
    },
    playerInfo: {
      id: 2,
      nickname: 'Tricia',
      response: 'he smells banana',
      score: 1,
      game: 2,
      submittedScenario: true
    }
  }
];

module.exports.scenarios = scenarios;
