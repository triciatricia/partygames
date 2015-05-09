var utils = require('./core/utils');
var localConf = require('./local_conf');

var conf = utils.merge(
  {}, // we'll have more settings in the future
  localConf
);

module.exports = conf;
