/**
 * Helper for testing async Functions
 * See https://github.com/jasmine/jasmine/issues/923
 */
function testAsync(runAsync) {
  return (done) => {
    runAsync().then(done, done.fail);
  };
}

/**
 * Actually tests that we can successfully make a DB connection
 */
describe ('Test async connection', function() {
  it('should be able to make a connection', testAsync(
    async function() {
      let connUtils = require('../conn');
      let rConn;
      try {
        rConn = await connUtils.getNewConnectionPromise(connUtils.Modes.READ);
        rConn.getConn().end();
      } catch (err) {
        expect(err).toBeNull();
      }
    }));
});

describe('MakeConnectionIntegrationTest', function() {
  /**
   * This is hardly a unit test.
   *
   * It opens a real connection using data as specified in ./local_conf
   * including the DB user, pass, host, name.
   *
   * If this fails, either the code is wrong or your mysql setup is not working
   */

  it('should be able to make a connection', function(done) {
    var connUtils = require('../conn');
    var rConn = connUtils.getNewConnection(connUtils.Modes.READ, function(err) {
      rConn.getConn().end();
      expect(err).toBe(null);
      done();
    });
  });

  it('should not allow invalid modes', function() {
    var connUtils = require('../conn');
    expect(function() {
      connUtils.getNewConnection('read');
    }).toThrow();

    expect(function() {
      connUtils.getNewConnection('write');
    }).toThrow();
  });

});
