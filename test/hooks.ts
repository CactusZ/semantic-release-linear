// Restores the default sandbox after every test
exports.mochaHooks = {
  afterEach() {
    sinon.restore();
  },
};
