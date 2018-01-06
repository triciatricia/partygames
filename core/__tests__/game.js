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
    const mockGif = (lastPostRetrieved) => {
      return new Promise((resolve, reject) => {
        resolve([['img0', 'img1', 'img2', 'img3', 'img4', 'img5'], 'lastPostRetrieved']);
      });
    };
    spyOn(Gifs, 'getGifs').and.callFake(mockGif);

    const mockNewImage = (
      DBConn: string,
      url: string,
      gameId: number,
      gameImageId: number,
      reactorNickname: string,
    ) => {
      return new Promise((resolve, reject) => {
        resolve({});
      });
    };

    spyOn(DAO, 'newImagePromise').and.callFake(mockNewImage);
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
      expect(DAO.newImagePromise).toHaveBeenCalled();
    };

    let fail = (err) => {
      console.log(err);
      expect(true).toBe(false);
      done();
    };

    const fakeConn = 'fake';
    game._getNextImagePromise([], null, null, null, 'testName', fakeConn)
      .then(testCall)
      .catch(fail)
      .then(done);
  });
});

describe('_getPlayerGameInfoWithConnPromise', () => {
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
    displayOrder: '0,1',
    scores: fakeScores,
    choices: fakeChoices,
    responsesIn: 2,
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
    spyOn(DAO, 'getGamePromise').and.callFake(mockGame);
    spyOn(DAO, 'getUserPromise').and.callFake(mockUser);
  });

  it('should get game and player info', (done) => {
    let testCall = (info) => {
      expect(info).toBeDefined();
      expect(info).toEqual(expectedAns);
      expect(DAO.getGamePromise).toHaveBeenCalled();
      expect(DAO.getUserPromise).toHaveBeenCalled();
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
