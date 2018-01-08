/**
 * Integration test.
 * Make a connection and insert/get data from a test database.
 */

 /* @flow */

'use strict';

var connUtils = require('../conn');
var DAO = require('../DAO');
var mysql = require('mysql');

 // Use a custom database configuration for these tests.
var DBConfig = {
  host: 'localhost',
  user: 'test',
  password: 'happytesting',
  database: 'partygamestest'
};

describe('DatabaseIntegrationTest', function() {

  // mysql database connection for integration test
  var connection;

  function truncateTables(done, cb) {
    // Setup: Connect to games table
    connection = mysql.createConnection(DBConfig);
    connection.connect(function(err) {
      if (err) {
        console.error('Error connecting to database for jasmine test setup: ' + err.stack);
        connection.end();
        done();
        return;
      }

      // Setup: Truncate games and users tables
      connection.query('TRUNCATE TABLE games', function(err) {
        if (err) {
          console.error('Error truncating mysql table for jasmine test setup: ' + err.stack);
          connection.end();
          done();
          return;
        }
        connection.query('TRUNCATE TABLE users', function(err) {
          if (err) {
            console.error('Error truncating mysql table for jasmine test setup: ' + err.stack);
            connection.end();
            done();
            return;
          }
          connection.query('TRUNCATE TABLE usergame', function(err) {
            if (err) {
              console.error('Error truncating mysql table for jasmine test setup: ' + err.stack);
              connection.end();
              done();
              return;
            }
            connection.query('TRUNCATE TABLE images', function(err) {
              if (err) {
                console.error('Error truncating mysql table for jasmine test setup: ' + err.stack);
                connection.end();
                done();
                return;
              }
              connection.query('TRUNCATE TABLE gameimage', function(err) {
                if (err) {
                  console.error('Error truncating mysql table for jasmine test setup: ' + err.stack);
                  connection.end();
                  done();
                  return;
                }
                cb(done);
              });
            });
          });
        });
      });
    });
  }

  beforeEach((done) => {
    truncateTables(done, (done) => {done();});
  });

  afterEach((done) => {
    truncateTables(done, (done) => {
      connection.end();
      done();
    });
  });

  it('should be able to insert a game', function(done) {
    // Try to make a new game
    // DAOs.newGame = function(DBConn, game, callback)
    let game = {
      round: 1,
      image: {url: 'abc', id: 1},
      waitingForScenarios: 0,
      reactorID: 1,
      reactorNickname: 'Brownie',
      hostID: 1,
      gameOver: 0,
      winningResponse: null,
      winningResponseSubmittedBy: null,
      lastGif: null,
      imageQueue: null,
      roundStarted: null,
    };
    let expectedRow = {
      id: 'REPLACED',
      round: 1,
      image: "{\"url\":\"abc\",\"id\":1}", // quote escaped for JSON.stringify
      waitingForScenarios: 0,
      reactorID: 1,
      reactorNickname: 'Brownie',
      hostID: 1,
      gameOver: 0,
      winningResponse: null,
      winningResponseSubmittedBy: null,
      lastGif: null,
      displayOrder: null,
      imageQueue: null,
      roundStarted: null,
      firstImageID: null,
    };

    let wConn

    // Connect to the database for the integration test
    async function testGame() {
      wConn = await connUtils.getNewConnectionPromise(
        connUtils.Modes.WRITE,
        DBConfig
      );
      let result = await DAO.newGamePromise(wConn, game);
      expect(wConn.getConn()).toBeDefined();
      expect(result).not.toBe(null);
      expect(result.insertId).toBeDefined;
      expect(result.affectedRows).toBeDefined;
      expect(result.affectedRows).toBe(1);
    }

    function checkInserted() {
      connection.query('SELECT * FROM games', function(err, result) {
        expect(err).toBe(null);
        expect(result).not.toBe(null);
        if (result != null) {
          expect(result.length).toBe(1);
          if (result.length == 1) {
            result[0].id = 'REPLACED';
            expect(JSON.stringify(result[0])).toEqual(JSON.stringify(expectedRow));
          }
        }
      });
    }

    function fail() {
      if (wConn && wConn.hasOwnProperty('getConn')) {
        wConn.getConn().end();
      }
      expect(true).toBe(false);
      done();
    }

    testGame()
      .then(checkInserted)
      .catch(fail)
      .then(() => {
        wConn.getConn().end();
        done();
      });
  });


  it('should be able to make, set, and get a game', function(done) {
    // Connect to the database for the integration test
    var game = {
      round: 1,
      image: {url: 'abc', id: 1},
      waitingForScenarios: 0,
      reactorID: 1,
      reactorNickname: 'Brownie',
      hostID: 1,
      gameOver: 0,
      winningResponse: null,
      winningResponseSubmittedBy: null,
      lastGif: null,
      imageQueue: null,
      roundStarted: null,
    };

    var expectedRow = {
      id: 'REPLACED',
      round: 1,
      image: {url: 'abc', id: 1},
      waitingForScenarios: 0,
      reactorID: 1,
      reactorNickname: 'Brownie',
      hostID: 1,
      gameOver: 0,
      winningResponse: null,
      winningResponseSubmittedBy: null,
      lastGif: null,
      displayOrder: null,
      imageQueue: [],
      roundStarted: null,
      firstImageID: null,
      scores: {},
      choices: {},
      responsesIn: 0,
      timeLeft: null,
    };

    var expectedRow2 = {
      id: 'REPLACED', // Replace since it can't be predicted.
      round: 2,
      image: {url: 'abc', id: 1},
      waitingForScenarios: 0,
      reactorID: 1,
      reactorNickname: 'Brownie',
      hostID: 3,
      gameOver: 0,
      winningResponse: null,
      winningResponseSubmittedBy: null,
      lastGif: null,
      displayOrder: null,
      imageQueue: [],
      roundStarted: null,
      firstImageID: null,
      scores: {},
      choices: {},
      responsesIn: 0,
      timeLeft: null,
    };

    let wConn;

    async function testGame() {
      wConn = await connUtils.getNewConnectionPromise(
        connUtils.Modes.WRITE,
        DBConfig
      );
      let result = await DAO.newGamePromise(wConn, game);
      const gameId = result.insertId;
      expect(wConn.getConn()).toBeDefined();
      expect(result.affectedRows).toEqual(1);

      result = await DAO.getGamePromise(wConn, gameId);
      expectedRow.id = gameId;
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow));

      result = await DAO.setGamePromise(wConn, gameId, {hostID: 3, round: 2});
      expect(result).toBeDefined();
      if (result) {
        expect(result.hasOwnProperty('affectedRows')).toBe(true);
      }
      if (result && result.hasOwnProperty('affectedRows')) {
        expect(result.affectedRows).toEqual(1);
      }

      result = await DAO.getGamePromise(wConn, gameId);
      expectedRow2.id = gameId;
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow2));
    }

    function fail() {
      if (wConn && wConn.hasOwnProperty('getConn')) {
        wConn.getConn().end();
      }
      expect(true).toBe(false);
      done();
    }

    testGame()
      .catch(fail)
      .then(() => {
        wConn.getConn().end();
        done();
      });
  });

  it('should be able to make and get a user', function(done) {
    var user = {
      nickname: 'testuser',
      accessToken: 'secret',
      roundOfLastResponse: null,
      response: null,
      score: 0,
      game: 'B',
      submittedScenario: 0
    };
    var expectedRow = {
      id: 1,
      nickname: 'testuser',
      accessToken: 'secret',
      roundOfLastResponse: null,
      response: null,
      score: 0,
      game: 'B',
      submittedScenario: 0,
      lastActiveTime: null,
      ExpoPushToken: null,
      message: null,
    };
    var expectedRow2 = {
      id: 1,
      nickname: 'testuser',
      accessToken: 'secret',
      roundOfLastResponse: null,
      response: null,
      score: 3,
      game: 'C',
      submittedScenario: 0,
      lastActiveTime: null,
      ExpoPushToken: null,
      message: null,
    };

    let wConn;

    async function testUser() {
      wConn = await connUtils.getNewConnectionPromise(
        connUtils.Modes.WRITE,
        DBConfig
      );

      let id = await DAO.newUserPromise(wConn, user);
      expect(wConn.getConn()).toBeDefined();
      expect(id).toEqual(1);

      let result = await DAO.getUserPromise(wConn, 1);
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow));

      result = await DAO.setUserPromise(wConn, 1, {});
      expect(result).toBe(null);

      result = await DAO.setUserPromise(wConn, 1, {score: 3, game: 'C'});
      result = await DAO.getUserPromise(wConn, 1);
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow2));

      await DAO.newUserPromise(wConn, user);
      await DAO.newUserPromise(wConn, user);
      let users = await DAO.getGameUsersPromise(wConn, 'C');
      expect(users).toEqual([1]);

      users = await DAO.getGameUsersPromise(wConn, 'B');
      expect(users).toEqual([2, 3]);

      await DAO.leaveGamePromise(wConn, 2, 'B');
      users = await DAO.getGameUsersPromise(wConn, 'B');
      expect(users).toEqual([3]);

      await DAO.leaveGamePromise(wConn, 3, 'B');
      users = await DAO.getGameUsersPromise(wConn, 'B');
      expect(users).toEqual([]);
    }

    function fail(err) {
      console.log(err);
      if (wConn && wConn.hasOwnProperty('getConn')) {
        wConn.getConn().end();
      }
      expect(true).toBe(false);
      done();
    }

    testUser()
      .catch(fail)
      .then(() => {
        wConn.getConn().end();
        done();
      });
    });

  it('should error when setting a game with invalid fields', function(done) {
    // Connect to the database for the integration test
    var game1 = {
      round: 1,
      image: {url: 'abc', id: 1},
      waitingForScenarios: 0,
      reactorID: 1,
      reactorNickname: 'Brownie',
      hostID: 1,
      gameOver: 0,
      winningResponse: null,
      winningResponseSubmittedBy: null,
      lastGif: null,
      imageQueue: null,
      roundStarted: null,
      notAValidField: 'haha',
    };

    var game2 = {
      round: 'notANumber',
      image: {url: 'abc', id: 1},
      waitingForScenarios: 0,
      reactorID: 1,
      reactorNickname: 'Brownie',
      hostID: 1,
      gameOver: 0,
      winningResponse: null,
      winningResponseSubmittedBy: null,
      lastGif: null,
      imageQueue: null,
      roundStarted: null,
      abcd: 123,
    };

    let wConn;

    async function testGame1() {
      wConn = await connUtils.getNewConnectionPromise(
        connUtils.Modes.WRITE,
        DBConfig
      );
      try {
        await DAO.newGamePromise(wConn, game1);
        fail();
      }
      catch (err) {
        // ignore
      }
    }

    async function testGame2() {
      try {
        await DAO.newGamePromise(wConn, game2);
        fail();
      }
      catch (err) {
        // ignore, close connection
        wConn.getConn().end();
        done();
      }
    }

    function fail() {
      if (wConn && wConn.hasOwnProperty('getConn')) {
        wConn.getConn().end();
      }
      console.log('DatabaseIntegrationTest: Error expected but not found.');
      expect(true).toBe(false);
      done();
    }

    testGame1()
      .then(testGame2);
  });

  it('should be able to add an image and get image information', function(done) {
    const expectedImageRow1 = {
      url: 'testURL1',
      nSkipped: 0,
      nHearted: 0,
    };
    var expectedGameImageRow1 = {
      gameId: 'D',
      gameImageId: 2,
      imageUrl: 'testURL1',
      wasSkipped: null,
      scenario: null,
      reactorNickname: 'reactor1',
    };

    let wConn;

    async function testImage() {
      wConn = await connUtils.getNewConnectionPromise(
        connUtils.Modes.WRITE,
        DBConfig
      );

      await DAO.newImagePromise(wConn, 'testURL1', 'D', 2, 'reactor1');
      await DAO.newImagePromise(wConn, 'testURL2', 'D', 3, 'reactor2');
      await DAO.newImagePromise(wConn, 'testURL3', 'D', 4, 'reactor3');
      await DAO.newImagePromise(wConn, 'testURL3', 'D', 5, 'reactor4');

      // Same image but different game
      await DAO.newImagePromise(wConn, 'testURL2', 'C', 3, 'reactor4');

      let result = await DAO.getImagePromise(wConn, 'testURL1');
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedImageRow1));

      await DAO.skipImagePromise(wConn, 'testURL2', 'D', 3);
      await DAO.increaseHeartCountPromise(wConn, 'testURL2');
      await DAO.increaseHeartCountPromise(wConn, 'testURL2');

      DAO.setImageScenarioPromise(wConn, 'D', 2, 'scenario1');
      DAO.setImageScenarioPromise(wConn, 'D', 4, 'scenario2');

      result = await DAO.getGameImagesPromise(wConn, 'D');
      const expectedGameImages1 = [
        {
          gameImageId: 2,
          imageUrl: 'testURL1',
          scenario: 'scenario1',
          reactorNickname: 'reactor1',
        },
        {
          gameImageId: 4,
          imageUrl: 'testURL3',
          scenario: 'scenario2',
          reactorNickname: 'reactor3',
        },
      ];
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedGameImages1));

      result = await DAO.getGameImagesPromise(wConn, 'D', 3);
      const expectedGameImages2 = [
        {
          gameImageId: 4,
          imageUrl: 'testURL3',
          scenario: 'scenario2',
          reactorNickname: 'reactor3',
        },
      ];
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedGameImages2));

      result = await DAO.getGameImagesPromise(wConn, 'C');
      expect(result.length).toBe(0);

      const expectedImageRow2 = {
        url: 'testURL2',
        nSkipped: 1,
        nHearted: 2,
      };
      result = await DAO.getImagePromise(wConn, 'testURL2');
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedImageRow2))
    }

    function fail(err) {
      console.log(err);
      if (wConn && wConn.hasOwnProperty('getConn')) {
        wConn.getConn().end();
      }
      expect(true).toBe(false);
      done();
    }

    testImage()
      .catch(fail)
      .then(() => {
        wConn.getConn().end();
        done();
      });
    });
});
