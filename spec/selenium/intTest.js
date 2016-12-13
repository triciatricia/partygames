'use strict';

describe('website', () => {
  it('test', () => {

    // Open page
    // browser.url('http://localhost:3000');
    // expect(browser.getTitle().user1).toEqual('MRW');
    // expect(browser.element('span*=New').getText().user1).toEqual('New Game');

    // Create game
    user1.url('http://localhost:3000');
    user1.waitForExist('#newGameButton');
    user1.click('#newGameButton');
    user1.waitForExist('#nickname');
    user1.setValue('#nickname', 'user1');
    user1.click('#submitNicknameButton');
    user1.waitForExist('#gameCode');
    let gameCode = user1.getText('#gameCode');
    expect(gameCode).not.toBeNull();
    console.log('user1 started');

    // Join game
    user2.url('http://localhost:3000');
    user2.waitForExist('#gameCode');
    user2.setValue('#gameCode', gameCode);
    user2.click('#joinGameButton');
    user2.waitForExist('#nickname');
    user2.setValue('#nickname', 'user2');
    user2.click('#submitNicknameButton');
    user2.waitForExist('#gameCode');
    expect(user2.getText('#gameCode')).toEqual(gameCode);
    user2.waitForExist('#nPlayers');
    expect(user2.getText('#nPlayers')).toEqual('2');;
    console.log('user2 joined');

    user3.url('http://localhost:3000');
    user3.waitForExist('#gameCode');
    user3.setValue('#gameCode', gameCode);
    user3.click('#joinGameButton');
    user3.waitForExist('#nickname');
    user3.setValue('#nickname', 'user3');
    user3.click('#submitNicknameButton');
    user3.waitForExist('#gameCode');
    expect(user3.getText('#gameCode')).toEqual(gameCode);
    user3.waitForExist('#nPlayers');
    expect(user3.getText('#nPlayers')).toEqual('3');;
    console.log('user3 joined');

    // Start game
    user1.waitForExist('#startNowButton');
    user1.click('#startNowButton');
    user1.waitForExist('#round');
    expect(user1.getText('#round')).toEqual('1');
    user1.waitForExist('#score');
    expect(user1.getText('#score')).toEqual('0');
    user1.waitForExist('#gif');
    let gif = user1.getAttribute('#gif', 'src');
    expect(gif).toMatch('https?://.+\.gif');
    console.log('started game');

    // Submit responses
    user2.waitForExist('#score');
    expect(user2.getText('#score')).toEqual('0');
    user2.waitForExist('#round');
    expect(user2.getText('#round')).toEqual('1');
    user2.waitForExist('#gif');
    expect(user2.getAttribute('#gif', 'src')).toEqual(gif);
    user2.waitForExist('#scenario');
    user2.setValue('#scenario', 'response A user2');
    user2.click('#submitResponseButton');
    console.log('Submitted response');

    // Change response
    user2.waitUntil(() => {
      return user2.getText('.text-success') == 'Your response is in!';
    }, 1000, 'Expect feedback after response submitted.');
    expect(user2.getText('#submitResponseButton')).toEqual('Update Response');
    user2.setValue('#scenario', 'response B user2');
    user2.click('#submitResponseButton');
    console.log('Submitted response');

    // Submit responses
    user3.waitForExist('#score');
    expect(user3.getText('#score')).toEqual('0');
    user3.waitForExist('#round');
    expect(user3.getText('#round')).toEqual('1');
    user3.waitForExist('#gif');
    expect(user3.getAttribute('#gif', 'src')).toEqual(gif);
    user3.waitForExist('#scenario');
    user3.setValue('#scenario', 'response user3');
    user3.click('#submitResponseButton');
    console.log('Submitted response');

    // Choosing favorite
    user1.waitForExist('div.radio.scenario');
    let scenarios = user1.getText('div.radio.scenario');
    expect(scenarios).toContain('response B user2');
    expect(scenarios).toContain('response user3');
    expect(scenarios.length).toEqual(2);
    user2.waitForExist('p.scenario');
    expect(user2.getText('p.scenario')).toEqual(scenarios);
    user3.waitForExist('p.scenario');
    expect(user3.getText('p.scenario')).toEqual(scenarios);
    user2.waitForExist('p*=is choosing their favorite scenario');
    expect(user2.getText('p*=is choosing their favorite scenario'))
      .toEqual('user1 is choosing their favorite scenario. Hold tight!');
    let idx = scenarios.indexOf('response user3') + 2;
    user1.click('div.radio.scenario:nth-child(' + idx.toString() + ') label input');
    console.log(user1.getText('div.radio.scenario:nth-child(' + idx.toString() + ') label span'));
    user1.click('button=Submit');
    console.log('Chose response');

  });
});
