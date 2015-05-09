describe('Conf', function() {
  function expectDBFieldsDefined(conf) {
    expect(typeof conf.dbHost).toBe('string');
    expect(typeof conf.dbUser).toBe('string');
    expect(typeof conf.dbPass).toBe('string');
    expect(typeof conf.dbName).toBe('string');
  }

  it('should be able to load local conf', function() {
    var localConf = require('../local_conf');

    expect(localConf).toBeDefined();
    expectDBFieldsDefined(localConf);
  });

  it('should be able to load main conf', function() {
    var conf = require('../conf');
    
    expect(conf).toBeDefined();
    expectDBFieldsDefined(conf);
  });
});

