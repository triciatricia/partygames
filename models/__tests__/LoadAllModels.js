describe('LoadAllModels', function() {
  function test(modelSpec) {
    for (var key in modelSpec) {
      if (modelSpec.hasOwnProperty(key)) {
        var type = modelSpec[key].getType();
        expect(type).toBeDefined();
      }
    }
  }

  it('should be able to load all models', function() {
    test(require('../Games'));
    test(require('../Users'));
    test(require('../UserGame'));
  });
});

