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

function getConnection2(callback, customConf) {
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

  connection.connect((err) => {
    callback(err, connection);
  });
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
  getNewConnection: function(mode: number, callback: (conn: mysql.Connection, cb: Function) => void, customConf: Object) {
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

  Modes: ConnectionModes,

  getNewConnectionPromise: function(mode: number, customConf?: Object): Promise<DBConn> {
    return new Promise(function(resolve, reject) {
      getConnection2(
        (err, conn) => (err ? reject(err) : resolve(new DBConn(conn, mode))),
        customConf
      );
    });
  },

  beginTransactionPromise: function(conn: DBConn): Promise<void> {
    return new Promise(function(resolve, reject) {
      conn.getConn().beginTransaction((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  commitTransactionPromise: function(conn: DBConn): Promise<void> {
    return new Promise(function(resolve, reject) {
      conn.getConn().commit((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  DBConn: DBConn
};

module.exports = ConnectionUtils;
