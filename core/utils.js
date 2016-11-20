'use strict';

/* @flow */

function id<T>(x: T): T {
  return x;
}

function functionThatReturns<T>(x: T): () => T {
  return function() {
    return x;
  };
}

/**
 * @param {string} word
 */
function capitalizeFirst(word: string): string {
  return word.charAt(0).toUpperCase() + word.substr(1);
}

function merge(): Object {
  var ret = {};

  for (var i = 0; i < arguments.length; ++i) {
    var obj = arguments[i];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        ret[key] = obj[key];
      }
    }
  }

  return ret;
}

/**
 * Return a random integer between min and max inclusive
 */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Return a random item in an array
 */
function randItem<T>(arr: Array<T>): T {
  return arr[randInt(0, arr.length - 1)];
}

module.exports = {
  id,
  functionThatReturns,
  capitalizeFirst,
  merge,
  randInt,
  randItem
};
