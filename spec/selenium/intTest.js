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
    // Try to use the same name (should error)
    user2.setValue('#nickname', 'user1');
    user2.click('#submitNicknameButton');
    user2.waitForExist('#errorMessage');
    console.log(user2.getText('#errorMessage'));
    expect(user2.getText('#errorMessage')).toEqual(
      'user1 is already taken. Please use another name.',
      'Should display error for having same name.'
    );
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
    expect(gif).toMatch('https?://.+\.(gif)|(mp4)');
    console.log('started game');

    // Submit responses
    user2.waitForExist('#score');
    expect(user2.getText('#score')).toEqual('0');
    user2.waitForExist('#round');
    expect(user2.getText('#round')).toEqual('1');
    user2.waitForExist('#gif');
    expect(user2.getAttribute('#gif', 'src')).toEqual(
      gif,
      'User 1 and user 2 should see the same gif'
    );
    user3.waitForExist('#gif');
    expect(user3.getAttribute('#gif', 'src')).toEqual(gif);
    user1.waitForExist('#skipImageButton');
    user1.click('#skipImageButton');
    user2.waitUntil(() => user2.getAttribute('#gif', 'src') != gif);
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
    let chosenResponse = user1.getText('div.radio.scenario:nth-child(' + idx.toString() + ') label span');
    console.log(user1.getText('div.radio.scenario:nth-child(' + idx.toString() + ') label span'));
    user1.click('button=Submit');
    console.log('Chose response');

    // See the chosen response and score updates
    user1.waitForExist('p.chosen');
    expect(user1.getText('p.chosen')).toEqual(chosenResponse);
    user1.waitForExist('button=Next');
    user2.waitForExist('p.chosen');
    expect(user2.getText('p.chosen')).toEqual(chosenResponse);
    user3.waitForExist('p.chosen');
    expect(user3.getText('p.chosen')).toEqual(chosenResponse);
    expect(user1.getText('#score')).toEqual('0');
    if (chosenResponse == 'response B user2') {
      expect(user2.getText('#score')).toEqual('1');
      expect(user3.getText('#score')).toEqual('0');
    } else {
      expect(user3.getText('#score')).toEqual('1');
      expect(user2.getText('#score')).toEqual('0');
    }

    // Go to the next round
    user1.waitForExist('button=Next');
    user1.click('button=Next');
    user1.waitForExist('#submitResponseButton');
    user1.waitForExist('#round');
    expect(user1.getText('#round')).toEqual('2', 'Get to next round');

    // Submit responses
    user1.waitForExist('#scenario');
    user1.setValue('#scenario', 'response user1');
    user1.click('#submitResponseButton');
    console.log('Submitted response');

    user3.waitForExist('#scenario');
    user3.setValue('#scenario', 'response user3');
    user3.click('#submitResponseButton');
    console.log('Submitted response');

    // Choosing favorite
    user2.waitForExist('div.radio.scenario');
    scenarios = user2.getText('div.radio.scenario');
    expect(scenarios).toContain('response user1', 'Should have user1\'s response');
    expect(scenarios).toContain('response user3', 'Should have user3\'s response');
    expect(scenarios.length).toEqual(2);
    user1.waitForExist('p.scenario');
    expect(user1.getText('p.scenario')).toEqual(scenarios);
    user3.waitForExist('p.scenario');
    expect(user3.getText('p.scenario')).toEqual(scenarios);
    user1.waitForExist('p*=is choosing their favorite scenario');
    expect(user1.getText('p*=is choosing their favorite scenario'))
      .toEqual('user2 is choosing their favorite scenario. Hold tight!');
    idx = scenarios.indexOf('response user1') + 2;
    user2.click('div.radio.scenario:nth-child(' + idx.toString() + ') label input');
    chosenResponse = user2.getText('div.radio.scenario:nth-child(' + idx.toString() + ') label span');
    user2.click('button=Submit');
    console.log('Chose response');

    // See the chosen response and score updates
    user2.waitForExist('p.chosen');
    expect(user2.getText('p.chosen')).toEqual(chosenResponse);
    user2.waitForExist('button=Next');
    user1.waitForExist('p.chosen');
    user3.waitForExist('p.chosen');
    expect(user1.getText('#score')).toEqual('1', 'Score of user1 should be 1');
    expect(user2.getText('#score')).toEqual('0', 'Score of user2 should be 0');
    expect(user3.getText('#score')).toEqual('1', 'Score of user3 should be 1');

    // End game
    user2.waitForExist('button=End Game');
    user2.click('button=End Game');
    console.log('Ended game');
    user1.waitForExist('#scoreTable');
    let scores = user1.getText('#scoreTable li');
    expect(scores.length).toEqual(3, 'There should be 3 items in the score table');
    expect(scores).toContain('1 user1', 'User1 should be in the score table');
    expect(scores).toContain('1 user3', 'User3 should be in the score table');
    expect(scores[2]).toEqual('0 user2', 'User2 should be last in the score table');

    // rematch
    user3.waitForExist('#rematchButton');
    user3.click('#rematchButton');
    user1.waitForExist('#round');
    expect(user1.getText('#round')).toEqual('1', 'Round should be reset to 1');
    user1.waitForExist('#score');
    expect(user1.getText('#score')).toEqual('0', 'Score should be reset to 0');
    user1.waitForExist('#gif');
    user2.waitForExist('#score');
    expect(user2.getText('#score')).toEqual('0', 'Score should be reset to 0');
    user3.waitForExist('#score');
    expect(user3.getText('#score')).toEqual('0', 'Score should be reset to 0');

    // Submit response
    user2.waitForExist('#scenario');
    user2.setValue('#scenario', 'response user2 rematch');
    user2.click('#submitResponseButton');
    console.log('User2 Submitted response');

    // Leave game
    user1.waitForExist('#leaveGameButton');
    user1.click('#leaveGameButton');
    console.log('User1 left game');
    user1.waitForExist('#newGameButton');

    user3.waitForExist('div.radio.scenario');
    scenarios = user3.getText('div.radio.scenario');
    expect(scenarios).toEqual('response user2 rematch', 'Should have user2\'s response');
    // (Only one scenario, so it should not be a list)

    user3.click('#leaveGameButton');
    console.log('User3 left game');
    user3.waitForExist('#newGameButton');
    user2.waitForExist('p=user2, read this list out loud and pick your favorite!');

    user2.debug();

  });
});
