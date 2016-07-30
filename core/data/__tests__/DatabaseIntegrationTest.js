/**
 * Integration test.
 * Make a connection and insert/get data from a test database.
 */

'use strict';

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

  beforeEach(function(done) {
    // Setup: Connect to games table
    var mysql = require('mysql');
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
            done();
          });
        });
      });
    });
  });

  afterEach(function() {
    connection.end();
  });

  it('should be able to insert a game', function(done) {
    // Connect to the database for the integration test
    var connUtils = require('../conn');
    var DAO = require('../DAO');
    var wConn = connUtils.getNewConnection(
      connUtils.Modes.WRITE,
      function(err) {
        // Try to make a new game
        // DAOs.newGame = function(DBConn, game, callback)
        var game = {
          round: 1,
          image: 'abc',
          waitingForScenarios: 0,
          reactorID: 1,
          reactorNickname: 'Brownie',
          hostID: 1,
          gameOver: 0,
          winningResponse: null,
          winningResponseSubmittedBy: null
        };
        var expectedRow = {
          id: 1,
          round: 1,
          image: 'abc',
          waitingForScenarios: 0,
          reactorID: 1,
          reactorNickname: 'Brownie',
          hostID: 1,
          gameOver: 0,
          winningResponse: null,
          winningResponseSubmittedBy: null
        };

        expect(err).toBe(null);

        DAO.newGame(wConn, game, function(err, result) {
          expect(wConn.getConn()).toBeDefined();
          expect(err).toBe(null);
          expect(result).not.toBe(null);
          if (result != null) {
            expect(result.insertId).toBeDefined;
            expect(result.affectedRows).toBeDefined;
            if (result.hasOwnProperty('insertId') && result.hasOwnProperty('affectedRows')) {
              expect(result.insertId).toBe(1);
              expect(result.affectedRows).toBe(1);
            }
          }

          connection.query('SELECT * FROM games', function(err, result) {
            expect(err).toBe(null);
            expect(result).not.toBe(null);
            if (result != null) {
              expect(result.length).toBe(1);
              if (result.length == 1) {
                expect(JSON.stringify(result[0])).toEqual(JSON.stringify(expectedRow));
              }
            }
            // Close database connections
            wConn.getConn().end();
            done();
          });
        });
      },
      DBConfig);
  });

  it('should be able to make, set, and get a game', function(done) {
    // Connect to the database for the integration test
    var connUtils = require('../conn');
    var DAO = require('../DAO');
    var wConn = connUtils.getNewConnection(
      connUtils.Modes.WRITE,
      function(err) {
        // Make a new game
        var game = {
          round: 1,
          image: 'abc',
          waitingForScenarios: 0,
          reactorID: 1,
          reactorNickname: 'Brownie',
          hostID: 1,
          gameOver: 0,
          winningResponse: null,
          winningResponseSubmittedBy: null
        };
        var expectedRow = {
          id: 1,
          round: 1,
          image: 'abc',
          waitingForScenarios: 0,
          reactorID: 1,
          reactorNickname: 'Brownie',
          hostID: 1,
          gameOver: 0,
          winningResponse: null,
          winningResponseSubmittedBy: null,
          scores: {}
        };

        expect(err).toBe(null);

        DAO.newGame(wConn, game, function(err, result) {
          expect(wConn.getConn()).toBeDefined();
          expect(err).toBe(null);
          if (!err) {
            expect(result.insertId).toEqual(1);
            expect(result.affectedRows).toEqual(1);
          }

          DAO.getGame(wConn, 1, function(err, result) {
            expect(err).toBe(null);
            expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow));

            DAO.setGame(wConn, 1, {hostID: 3, round: 2}, function(err, result) {
              expect(err).toBe(null);
              if (!err) {
                expect(result.affectedRows).toEqual(1);
              }

              DAO.getGame(wConn, 1, function(err, result) {
                var expectedRow2 = {
                  id: 1,
                  round: 2,
                  image: 'abc',
                  waitingForScenarios: 0,
                  reactorID: 1,
                  reactorNickname: 'Brownie',
                  hostID: 3,
                  gameOver: 0,
                  winningResponse: null,
                  winningResponseSubmittedBy: null,
                  scores: {}
                };
                expect(err).toBe(null);
                expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow2));

                // Close database connections
                wConn.getConn().end();
                done();
              });
            });
          });
        });
      },
      DBConfig);
  });

  it('should be able to make and get a user', function(done) {
    // Connect to the database for the integration test
    var connUtils = require('../conn');
    var DAO = require('../DAO');
    var wConn = connUtils.getNewConnection(
      connUtils.Modes.WRITE,
      function(err) {
        // Make a new game
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

        expect(err).toBe(null);

        DAO.newUser(wConn, user, function(err, id) {
          expect(wConn.getConn()).toBeDefined();
          expect(err).toBe(null);
          if (!err) {
            expect(id).toEqual(1);
          }

          DAO.getUser(wConn, 1, function(err, result) {
            expect(err).toBe(null);
            expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow));

            DAO.setUser(wConn, 1, {}, function(err, result) {
              expect(err).toBe(null);
              expect(result).toBe(null);
              DAO.setUser(wConn, 1, {score: 3, game: 2}, function(err) {
                expect(err).toBe(null);

                DAO.getUser(wConn, 1, function(err, result) {
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
                  expect(err).toBe(null);
                  expect(JSON.stringify(result)).toEqual(JSON.stringify(expectedRow2));

                  DAO.newUser(wConn, user, function() {
                    DAO.newUser(wConn, user, function(err) {
                      expect(err).toBe(null);
                      DAO.getGameUsers(wConn, 2, function(err, users) {
                        expect(err).toBe(null);
                        expect(users).toEqual([1]);
                        DAO.getGameUsers(wConn, 1, function(err, users) {
                          expect(err).toBe(null);
                          expect(users).toEqual([2, 3]);

                          // Close database connections
                          wConn.getConn().end();
                          done();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      },
      DBConfig);
  });

});
