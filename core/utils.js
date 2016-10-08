module.exports.id = function(x) {
  return x;
};

module.exports.functionThatReturns = function(x) {
  return function() {
    return x;
  };
};

/**
 * @param {string} word
 */
module.exports.capitalizeFirst = function(word) {
  return word.charAt(0).toUpperCase() + word.substr(1);
};

module.exports.merge = function() {
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
};

/**
 * Return a random integer between min and max inclusive
 */
module.exports.randInt = function(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
};

/**
 * Return a random item in an array
 */
module.exports.randItem = function(arr) {
  return arr[this.randInt(0, arr.length - 1)];
};
