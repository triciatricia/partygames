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
    console.log('1');
    user1.click('#startNowButton');
    user1.waitForExist('#round');
    expect(user1.getText('#round')).toEqual('1');
    user1.waitForExist('#score');
    console.log('2');
    expect(user1.getText('#score')).toEqual('0');
    user1.waitForExist('#gif');
    console.log('3');
    let gif = user1.getAttribute('#gif', 'src');
    expect(gif).toMatch('http://.+\.gif');
    console.log('started game');

  });
});
