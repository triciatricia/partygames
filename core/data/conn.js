/**
 * Currently only creates a mySQL connection
 */

var conf = require('../../conf');
var utils = require('../utils');
var mysql = require('mysql');
var assert = require('assert');

function getConnection(callback, customConf) {
  /**
   * customConf is an optional configuration
   * If null, it will use the default in ../../conf.js.
   */
  var connection;
  if (customConf) {
    connection = mysql.createConnection(customConf);
  } else {
    connection = mysql.createConnection({
      host: conf.dbHost,
      user: conf.dbUser,
      password: conf.dbPass,
      database: conf.dbName
    });
  }

  connection.connect(callback);

  return connection;
}

var ConnectionModes = {
  READ: 1,
  WRITE: 2
};

/**
 * @constructor
 */
function DBConn(conn, mode) {
  this.mode = mode;
  this.conn = conn;
}

utils.extend(DBConn.prototype, {
  getMode: function() {
    return this.mode;
  },

  getConn: function() {
    return this.conn;
  }
});

var ConnectionUtils = {
  getNewConnection: function(mode, callback, customConf) {
    /**
     * customConf is an optional object with parameters
     * host, user, password, and database.
     */
    assert(mode === ConnectionModes.READ || mode == ConnectionModes.WRITE);

    var connection = getConnection(callback, customConf);
    // assert(
    //   connection.state != 'disconnected',
    //   'New mysql connection should be connected to database.');

    return new DBConn(connection, mode);
  },

  Modes: ConnectionModes
};

module.exports = ConnectionUtils;
