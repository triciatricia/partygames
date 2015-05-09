exports.id = function(x) {
  return x;
};

exports.functionThatReturns = function(x) {
  return function() {
    return x;
  };
};

/**
 * @param {string} word
 */
exports.capitalizeFirst = function(word) {
  return word.charAt(0).toUpperCase() + word.substr(1);
};

exports.merge = function() {
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
 * Copies everything to the first argument
 */
exports.extend = function(dest) {
  for (var i = 1; i < arguments.length; ++i) {
    var obj = arguments[i];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        dest[key] = obj[key];
      }
    }
  }
};
