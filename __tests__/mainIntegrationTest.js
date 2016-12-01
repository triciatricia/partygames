var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'firefox' } };
var client = webdriverio.remote(options);

describe('website', function() {

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

  beforeEach(function(done) {
    client.init().then(done);
  });

  it('test', function(done) {
    client
      .url('http://localhost:3000')
      .getTitle()
      .then((title) => {
        expect(title).toEqual('MRW');
      })
      .element('span*=New').getText()
      .then((text) => {
        expect(text).toEqual('New Game');
      })
      .then(done);
  });

  afterEach(function(done) {
    client.end().then(done);
  });
});
