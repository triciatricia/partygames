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
 * Tests that we can successfully make a DB connection
 */
describe ('Make connection integration test', function() {
  it('should be able to make a connection', testAsync(
    async function() {
      let connUtils = require('../conn');
      let rConn;
      try {
        rConn = await connUtils.getNewConnectionAsync(connUtils.Modes.READ);
        rConn.getConn().end();
      } catch (err) {
        expect(err).toBeNull();
      }
    }));
});
