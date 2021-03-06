'use strict';

var gifs = require('../gifs');

describe('fetchData', function() {
  var originalTimeout;
  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });

  it('should return something', function(done) {
    gifs.fetchData(function(err, posts, lastPostRetrieved) {
      expect(posts).toBeDefined();
      expect(lastPostRetrieved).toBeDefined();

      gifs.fetchData(function(err, posts, lastPostRetrieved2) {
        expect(posts).toBeDefined();
        expect(lastPostRetrieved2).toBeDefined();
        expect(lastPostRetrieved2).not.toEqual(lastPostRetrieved);
        done();
      }, lastPostRetrieved);
    });
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

});
