/**
 * Local configuration overrides that are ignored by git.
 *
 * Use this to store local overrides or sensitive configuration data like
 * usernames and passwords.
 *
 * Copy to local_conf.js to use this file.
 */
var conf = {
  dbHost: 'localhost',
  dbUser: 'user',
  dbPass: 'pw',
  dbName: 'partygames',
  isProduction: false,
  charset: 'utf8mb4',
};

module.exports = conf;
