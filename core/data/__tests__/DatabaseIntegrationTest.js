/**
 * Integration test.
 * Make a connection and insert/get data from a test database.
 */

 var JSON = require('JSON');

 // Use a custom database configuration for these tests.
 DBConfig = {
  host: 'localhost',
  user: 'test',
  password: 'happytesting',
  database: 'partygamestest'
};

describe('DatabaseIntegrationTest', function() {

  it('should be able to insert a game', function(done) {
    // Setup: Connect to games table
    var mysql = require('mysql');
    var connection = mysql.createConnection(DBConfig);
    connection.connect(function(err) {
      if (err) {
        console.error('Error connecting to database for jasmine test setup: ' + err.stack);
        expect(err).toBe(null);
        connection.end();
        done();
        return;
      }

      // Setup: Truncate games table
      connection.query('TRUNCATE TABLE games', function(err) {
        if (err) {
          console.error('Error truncating mysql table for jasmine test setup: ' + err.stack);
          expect(err).toBe(null);
          connection.end();
          done();
          return;
        }

        // Connect to the database for the integration test
        var connUtils = require('../conn');
        var DAO = require('../DAO');
        var wConn = connUtils.getNewConnection(
          connUtils.Modes.WRITE,
          function(err) {
            // Try to make a new game
            // DAOs.newGame = function(DBConn, game, callback)
            var game = {
              roundNum: 1,
              hasStarted: 0,
              isCompleted: 1,
              lastImageRetrieved: 1,
              URLSuffix: 'abc',
              timeCreated: 123,
              host: 1
            };
            var expectedRow = {
              id: 1,
              roundNum: 1,
              hasStarted: 0,
              isCompleted: 1,
              lastImageRetrieved: 1,
              URLSuffix: 'abc',
              timeCreated: 123,
              host: 1
            };

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
                connection.end();

                done();
              });


            });
          },
          DBConfig);
      });
    });
  });

});