'use strict';

let game = require('../game');
let Gifs = require('../gifs');
let DAO = require('../data/DAO');

describe('_getIDFromGameCode', () => {
  it('should convert game code to ID', () => {
    expect(game._getIDFromGameCode('10')).toEqual(10);
    expect(game._getIDFromGameCode('010')).toEqual(10);
  });
});

describe('_getNextImagePromise', () => {
  beforeEach(() => {
    let mockGif = (lastPostRetrieved) => {
      return new Promise((resolve, reject) => {
        resolve([['img0', 'img1', 'img2', 'img3', 'img4', 'img5'], 'lastPostRetrieved']);
      });
    };
    spyOn(Gifs, 'getGifs').and.callFake(mockGif);
  });

  it('should call Gifs.getGifs', (done) => {
    let testCall = (res) => {
      expect(res).toBeDefined();
      expect(Gifs.getGifs).toHaveBeenCalled();
      expect(res.image).toEqual({
        id: 1,
        url: 'img0'
      });
      expect(res.imageQueue.length).toEqual(3); // Only send 3 gifs at a time
    };

    let fail = (err) => {
      console.log(err);
      expect(true).toBe(false);
      done();
    };

    game._getNextImagePromise([])
      .then(testCall)
      .catch(fail)
      .then(done);
  });
});

describe('_getScoresWithConnPromise', () => {
  beforeEach(() => {
    let mockScore = (conn, userIDs, props) => {
      return new Promise((resolve, reject) => {
        resolve({
          3: {
            id: 3,
            nickname: 'abc',
            score: 1
          },
          4: {
            id: 4,
            nickname: 'def',
            score: 2
          }
        });
      });
    };
    spyOn(DAO, 'getUsersPropPromise').and.callFake(mockScore);
  });

  it('should call DAO.getUsersPropPromise', (done) => {
    let testCall = (scores) => {
      expect(scores).toBeDefined();
      expect(scores).toEqual({
        abc: 1,
        def: 2
      });
      let allArgs = DAO.getUsersPropPromise.calls.allArgs();
      expect(allArgs.length).toEqual(1);
      expect(allArgs[0][0]).toEqual(123);
      expect(allArgs[0][1]).toEqual([3, 4]);
      expect(allArgs[0][2]).toEqual(['nickname', 'score']);
      expect(allArgs[0].length).toEqual(3);
      expect(DAO.getUsersPropPromise).toHaveBeenCalled();
    };

    let fail = (err) => {
      console.log(err);
      expect(true).toBe(false);
      done();
    };

    let fakeConn = 123;

    game._getScoresWithConnPromise(fakeConn, [3, 4])
      .then(testCall)
      .catch(fail)
      .then(done);
  });
});

describe('_getScenariosWithConnPromise', () => {
  beforeEach(() => {
    let mockResponse = (conn, userIDs, props) => {
      return new Promise((resolve, reject) => {
        resolve({
          3: {
            id: 3,
            response: 'abcd'
          },
          4: {
            id: 4,
            response: 'defg'
          },
          5: {
            id: 5
          }
        });
      });
    };
    spyOn(DAO, 'getUsersPropPromise').and.callFake(mockResponse);
  });

  it('should call DAO.getUsersPropPromise', (done) => {
    let testCall = (response) => {
      expect(response).toBeDefined();
      expect(response).toEqual({
        _3: 'abcd',
        _4: 'defg'
      });
      expect(DAO.getUsersPropPromise).toHaveBeenCalled();
      expect(DAO.getUsersPropPromise.calls.allArgs()[0][1]).toEqual([3, 4, 5]);
      expect(DAO.getUsersPropPromise.calls.allArgs()[0][2]).toEqual(['response']);
    };

    let fail = (err) => {
      console.log(err);
      expect(true).toBe(false);
      done();
    };

    let fakeConn = 123;

    game._getScenariosWithConnPromise(fakeConn, [3, 4, 5])
      .then(testCall)
      .catch(fail)
      .then(done);
  });
});

describe('_getPlayerGameInfoWithConnPromise', () => {
  const fakeGame = {
    id: 5,
    round: 3,
    image: 'abc.gif',
    waitingForScenarios: 0,
    reactorID: 3,
    reactorNickname: 'Brownie',
    hostID: 2,
    gameOver: 0,
    winningResponse: null,
    winningResponseSubmittedBy: null,
    scores: {},
    displayOrder: '0,1'
  };

  const fakeUser = {
    id: 2,
    nickname: 'Momo',
    accessToken: null,
    roundOfLastResponse: 3,
    response: null,
    score: 1,
    game: 5,
    submittedScenario: 1
  };

  const fakeScores = {
    Momo: 1,
    Brownie: 2,
    Cinna: 0
  };

  const fakeChoices = {
    2: 'choice2',
    4: 'choice4'
  };

  const expectedAns = {
    gameInfo: {
      id: 5,
      round: 3,
      image: 'abc.gif',
      waitingForScenarios: 0,
      reactorID: 3,
      reactorNickname: 'Brownie',
      hostID: 2,
      gameOver: 0,
      winningResponse: null,
      winningResponseSubmittedBy: null,
      displayOrder: '0,1',
      scores: fakeScores,
      choices: fakeChoices,
      responsesIn: 2,
    },
    playerInfo: fakeUser
  };

  beforeEach(() => {
    game = require('../game');
    let mockGame = (conn, gameID) => {
      return new Promise((resolve, reject) => {
        resolve(fakeGame);
      });
    };
    let mockUser = (conn, playerID) => {
      return new Promise((resolve, reject) => {
        resolve(fakeUser);
      });
    };
    let mockGameUsers = (conn, gameID) => {
      return new Promise((resolve, reject) => {
        resolve([2, 3, 4]);
      });
    };
    let mockScores = (conn, userIDs) => {
      return new Promise((resolve, reject) => {
        resolve(fakeScores);
      });
    };
    let mockScenarios = (conn, userIDs) => {
      return new Promise((resolve, reject) => {
        resolve(fakeChoices);
      });
    };
    spyOn(DAO, 'getGamePromise').and.callFake(mockGame);
    spyOn(DAO, 'getUserPromise').and.callFake(mockUser);
    spyOn(DAO, 'getGameUsersPromise').and.callFake(mockGameUsers);
    spyOn(game, '_getScoresWithConnPromise').and.callFake(mockScores);
    spyOn(game, '_getScenariosWithConnPromise').and.callFake(mockScenarios);
  });

  it('should get game and player info', (done) => {
    let testCall = (info) => {
      expect(info).toBeDefined();
      expect(info).toEqual(expectedAns);
      expect(DAO.getGamePromise).toHaveBeenCalled();
      expect(DAO.getUserPromise).toHaveBeenCalled();
      expect(DAO.getGameUsersPromise).toHaveBeenCalled();
      expect(game._getScoresWithConnPromise).toHaveBeenCalled();
      expect(game._getScenariosWithConnPromise).toHaveBeenCalled();
      // expect(DAO.getUsersProp.calls.allArgs()[0][1]).toEqual([3, 4, 5]);
    };

    let fail = (err) => {
      console.log(err);
      expect(true).toBe(false);
      done();
    };

    let fakeConn = 123;

    game._getPlayerGameInfoWithConnPromise(fakeConn, 2, 5)
      .then(testCall)
      .catch(fail)
      .then(done);
  });
});
