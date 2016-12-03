const webdriverio = require('webdriverio');
const options = {
  user1: {
    desiredCapabilities: { browserName: 'firefox' }
  },
  user2: {
    desiredCapabilities: { browserName: 'firefox' }
  },
  user3: {
    desiredCapabilities: { browserName: 'firefox' }
  }
};
let client = webdriverio.multiremote(options);
let [client1, client2, client3] = [client.select('user1'), client.select('user2'), client.select('user3')]

describe('website', function() {

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

  beforeEach(function(done) {
    client.init().then(done);
  });

  it('test', function(done) {
    let gameCode;
    let clientCreateGame = (browserClient, nickname) => {
      return browserClient
        .waitForExist('#newGameButton', 1000)
        .click('#newGameButton')
        .waitForExist('#nickname', 5000)
        .setValue('#nickname', nickname)
        .click('#submitNicknameButton')
        .waitForExist('#gameCode', 5000)
        .getText('#gameCode')
        .then((code) => {
          expect(code.length).toBeGreaterThan(0);
          gameCode = code;
          console.log(nickname + ' created game');
        });
    };

    let clientJoinGame = (browserClient, nickname, code) => {
      return browserClient
        .waitForExist('#gameCode', 1000)
        .setValue('#gameCode', gameCode)
        .click('#joinGameButton')
        .waitForExist('#nickname', 5000)
        .setValue('#nickname', nickname)
        .click('#submitNicknameButton')
        .waitForExist('#gameCode', 5000)
        .getText('#gameCode')
        .then((siteCode) => {
          expect(siteCode).toEqual(code);
          console.log(nickname + ' joined game');
        });
    };

    let clientStartGame = (browserClient) => {
      return browserClient
        .waitForExist('#nPlayers', 1000)
        .getText('#nPlayers')
        .then((nPlayers) => {
          expect(nPlayers).toEqual('3');
        })
        .waitForExist('#startNowButton', 1000)
        .click('#startNowButton')
        .waitForExist('#round', 5000)
        .getText('#round')
        .then((round) => {
          expect(round).toEqual('1');
        })
        .waitForExist('#score', 1000)
        .getText('#score')
        .then((score) => {
          expect(score).toEqual('0');
        })
        .waitForExist('.img', 5000)
        .getAttribute('.img', 'src')
        .then((src) => {
          expect(src).toMatch('http://.+\.gif')
        });
    };

    client
      .url('http://localhost:3000')
      .getTitle()
      .then((title) => {
        expect(title.user1).toEqual('MRW');
      })
      .element('span*=New').getText()
      .then((text) => {
        expect(text.user1).toEqual('New Game');
      });

    clientCreateGame(client1, 'user1')
      .then(() => {
        clientJoinGame(client2, 'user2', gameCode)
          .then(() => {
            clientJoinGame(client3, 'user3', gameCode)
              .then(() => {
                clientStartGame(client1);
                done();
              });
          });
      });

  });

  afterEach(function(done) {
    client.end().then(done);
  });
});
