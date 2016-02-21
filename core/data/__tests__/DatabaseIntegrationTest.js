/**
 * Integration test.
 * Make a connection and insert/get data from a test database.
 * TODO: Test getGame.
 */

 "use strict";

 //var JSON = require('JSON');

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

      // Setup: Truncate games table
      connection.query('TRUNCATE TABLE games', function(err) {
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
          isCompleted: 1,
          lastImage: 1,
          gameCode: 'abc',
          timeCreated: 123,
          host: 1,
          reactor: 1,
          images: 'xyz'
        };
        var expectedRow = {
          id: 1,
          round: 1,
          isCompleted: 1,
          lastImage: 1,
          gameCode: 'abc',
          timeCreated: 123,
          host: 1,
          reactor: 1,
          images: 'xyz'
        };

        expect(err).toBe(null);

        DAO.newGame(wConn, game, function(err, result) {
          expect(wConn.getConn()).toBeDefined();
          expect(err).toBe(null);
          expect(result.insertId).toEqual(1);
          expect(result.affectedRows).toEqual(1);

          connection.query('SELECT * FROM games', function(err, result) {
            expect(err).toBe(null);
            expect(result.length).toEqual(1);
            expect(JSON.stringify(result[0])).toEqual(JSON.stringify(expectedRow));

            // Close database connections
            wConn.getConn().end();
            done();
          });
        });
      },
      DBConfig);
  });

  it('should be able to make and get a game', function(done) {
    // Connect to the database for the integration test
    var connUtils = require('../conn');
    var DAO = require('../DAO');
    var wConn = connUtils.getNewConnection(
      connUtils.Modes.WRITE,
      function(err) {
        // Make a new game
        var game = {
          round: 1,
          isCompleted: 1,
          lastImage: 1,
          gameCode: 'abc',
          timeCreated: 123,
          host: 1,
          reactor: 1,
          images: 'xyz'
        };
        var expectedRow = {
          id: 1,
          round: 1,
          isCompleted: 1,
          lastImage: 1,
          gameCode: 'abc',
          timeCreated: 123,
          host: 1,
          reactor: 1,
          images: 'xyz'
        };

        expect(err).toBe(null);

        DAO.newGame(wConn, game, function(err, result) {
          expect(wConn.getConn()).toBeDefined();
          expect(err).toBe(null);
          expect(result.insertId).toEqual(1);
          expect(result.affectedRows).toEqual(1);

          DAO.getGame(wConn, game, function(err, result) {
            expect(err).toBe(null);
            expect(result).toEqual(expectedRow);

            // Close database connections
            wConn.getConn().end();
            done();
          });
        });
      },
      DBConfig);
  });

});