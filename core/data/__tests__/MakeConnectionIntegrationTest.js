/**
 * Actually tests that we can successfully make a DB connection
 */

describe('MakeConnectionIntegrationTest', function() {
  /**
   * This is hardly a unit test.
   *
   * It opens a real connection using data as specified in ./local_conf
   * including the DB user, pass, host, name.
   *
   * If this fails, either the code is wrong or your mysql setup is not working
   */
  it('should be able to make a connection', function() {
    var connUtils = require('../conn');
    var rConn = connUtils.getNewConnection(connUtils.Modes.READ);

    expect(rConn.getConn()).toBeDefined();

    rConn.getConn().end();
  });

  it('should not allow invalid modes', function() {
    var connUtils = require('../conn');
    expect(function() {
      connUtils.getNewConnection('read')
    }).toThrow();

    expect(function() {
      connUtils.getNewConnection('write')
    }).toThrow();
  });

});

