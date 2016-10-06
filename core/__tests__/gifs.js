'use strict';

var gifs = require('../gifs');

describe('fetchData', function() {
  it('should return something', function(done) {
    gifs.fetchData(function(posts, lastPostRetrieved) {
      expect(posts).toBeDefined();
      expect(lastPostRetrieved).toBeDefined();

      gifs.fetchData(function(posts, lastPostRetrieved2) {
        expect(posts).toBeDefined();
        expect(lastPostRetrieved2).toBeDefined();
        expect(lastPostRetrieved2).not.toEqual(lastPostRetrieved);
        done();
      }, lastPostRetrieved);
    });
  });

});
