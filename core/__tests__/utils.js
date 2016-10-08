'use strict';

var utils = require('../utils');

describe('functionThatReturns', function() {
  it('should return a function returning the argument', function() {
    var thingReturned = {hi: 'lol'};
    var newFun = utils.functionThatReturns(thingReturned);

    expect(newFun).toBeDefined();
    expect(typeof(newFun)).toEqual('function');
    expect(newFun()).toBe(thingReturned);
  });

});

describe('capitalizeFirst', function() {
  it('should capitalize the first letter', function() {
    expect(utils.capitalizeFirst('abcd')).toEqual('Abcd');
    expect(utils.capitalizeFirst('a')).toEqual('A');
    expect(utils.capitalizeFirst('ABCD')).toEqual('ABCD');
    expect(utils.capitalizeFirst('')).toEqual('');
  });

  it('should not change the original word', function() {
    var toCap = 'abcd';
    utils.capitalizeFirst(toCap);
    expect(toCap).toEqual('abcd');
  });

});

describe('merge', function() {
  it('should merge objects', function() {
    var src1 = {a: 1, b: 2};
    var src2 = {c: 3};

    let returned = utils.merge(src1, src2);
    expect(returned).toEqual({a: 1, b: 2, c: 3});

    // Should not change original objects.
    expect(src1).toEqual({a: 1, b: 2});
    expect(src2).toEqual({c: 3});
  });

});

describe('extend', function() {
  function testExtend() {
    var dst = {a : 'test', b: 'lol'};
    var src = {b : 'wtf', d: 'xd'};
    var src2 = {b : 'replacewtf', c : 'thirdthing'};

    Object.assign(dst, src, src2);

    // dst modified
    expect(dst).toEqual({
      a: 'test',
      b: 'replacewtf', // replaced by src
      c: 'thirdthing',
      d: 'xd'
    });

    // src not modified
    expect(src).toEqual({
      b: 'wtf',
      d: 'xd'
    });

    // src2 not modified
    expect(src2).toEqual({
      b: 'replacewtf',
      c: 'thirdthing'
    });
  }

  it('should extend', testExtend);

  it('should not copy keys from prototype', function() {
    Object.prototype.junk = 'smiley';
    testExtend();
    delete Object.prototype.junk;

    expect(Object.prototype.junk).toBeUndefined();
  });

});
