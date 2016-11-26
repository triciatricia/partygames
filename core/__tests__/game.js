'use strict';

let game = require('../game');
let Gifs = require('../gifs');

describe('_getIDFromGameCode', () => {
  it('should convert game code to ID', () => {
    expect(game._getIDFromGameCode('10')).toEqual(10);
    expect(game._getIDFromGameCode('010')).toEqual(10);
  });
});

describe('_getNextImagePromise', () => {
  beforeEach(() => {
    let mockGif = (cb) => {
      cb(null, 'http://fake.gif');
    };
    spyOn(Gifs, 'getRandomGif').and.callFake(mockGif);
  });

  it('should call Gifs.getRandomGif', (done) => {
    let testCall = (res) => {
      expect(res).toBeDefined();
      expect(Gifs.getRandomGif).toHaveBeenCalled();
    };

    let fail = () => {
      expect(true).toBe(false);
      done();
    };

    game._getNextImagePromise()
      .then(testCall)
      .catch(fail)
      .then(done);
  });
});
