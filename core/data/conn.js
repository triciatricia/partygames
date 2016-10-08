'use strict';

/* @flow */

/**
 * Currently only creates a mySQL connection
 */

const assert = require('assert');
const conf = require('../../conf');
const mysql = require('mysql');

function getConnection(callback, customConf) {
  /**
   * customConf is an optional configuration
   * If null, it will use the default in ../../conf.js.
   */
  let connection;
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

const ConnectionModes = {
  READ: 1,
  WRITE: 2
};

/**
 * @constructor
 */
function DBConn(conn, mode: number) {
  this.mode = mode;
  this.conn = conn;
}

Object.assign(DBConn.prototype, {
  getMode: function() {
    return this.mode;
  },

  getConn: function() {
    return this.conn;
  }
});

const ConnectionUtils = {
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
