/**
 * Currently only creates a mySQL connection
 */

var conf = require('../../conf');
var utils = require('../utils');
var mysql = require('mysql');
var assert = require('assert');

function getConnection() {
  var connection = mysql.createConnection({
    host: conf.dbHost,
    user: conf.dbUser,
    password: conf.dbPass,
    name: conf.dbName
  });

  connection.connect();

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
  getNewConnection: function(mode) {
    assert(mode === ConnectionModes.READ || mode == ConnectionModes.WRITE);

    var connection = getConnection();

    return new DBConn(connection, mode);
  },

  Modes: ConnectionModes
};

module.exports = ConnectionUtils;
