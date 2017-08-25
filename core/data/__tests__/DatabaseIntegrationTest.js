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
            cb(done);
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
      id: 1,
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
      expect(result.insertId).toBe(1);
      expect(result.affectedRows).toBe(1);
    }

    function checkInserted() {
      connection.query('SELECT * FROM games', function(err, result) {
        expect(err).toBe(null);
        expect(result).not.toBe(null);
        if (result != null) {
          expect(result.length).toBe(1);
          if (result.length == 1) {
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
      id: 1,
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
      scores: {},
      timeLeft: null,
    };

    var expectedRow2 = {
      id: 1,
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
      scores: {},
      timeLeft: null,
    };

    let wConn;

    async function testGame() {
      wConn = await connUtils.getNewConnectionPromise(
        connUtils.Modes.WRITE,
        DBConfig
      );
      let result = await DAO.newGamePromise(wConn, game);
      expect(wConn.getConn()).toBeDefined();
      expect(result.insertId).toEqual(1);
      expect(result.affectedRows).toEqual(1);

      result = await DAO.getGamePromise(wConn, 1);
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow));

      result = await DAO.setGamePromise(wConn, 1, {hostID: 3, round: 2});
      expect(result).toBeDefined();
      if (result) {
        expect(result.hasOwnProperty('affectedRows')).toBe(true);
      }
      if (result && result.hasOwnProperty('affectedRows')) {
        expect(result.affectedRows).toEqual(1);
      }

      result = await DAO.getGamePromise(wConn, 1);
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
      game: 1,
      submittedScenario: 0
    };
    var expectedRow = {
      id: 1,
      nickname: 'testuser',
      accessToken: 'secret',
      roundOfLastResponse: null,
      response: null,
      score: 0,
      game: 1,
      submittedScenario: 0
    };
    var expectedRow2 = {
      id: 1,
      nickname: 'testuser',
      accessToken: 'secret',
      roundOfLastResponse: null,
      response: null,
      score: 3,
      game: 2,
      submittedScenario: 0
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

      result = await DAO.setUserPromise(wConn, 1, {score: 3, game: 2});
      result = await DAO.getUserPromise(wConn, 1);
      expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow2));

      await DAO.newUserPromise(wConn, user);
      await DAO.newUserPromise(wConn, user);
      let users = await DAO.getGameUsersPromise(wConn, 2);
      expect(users).toEqual([1]);

      users = await DAO.getGameUsersPromise(wConn, 1);
      expect(users).toEqual([2, 3]);

      await DAO.leaveGamePromise(wConn, 2, 1);
      users = await DAO.getGameUsersPromise(wConn, 1);
      expect(users).toEqual([3]);

      await DAO.leaveGamePromise(wConn, 3, 1);
      users = await DAO.getGameUsersPromise(wConn, 1);
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
});
