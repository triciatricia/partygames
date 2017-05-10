'use strict';

/* @flow */

const ConnUtils = require('./data/conn');
const DAO = require('./data/DAO');
const Gifs = require('./gifs');

import type {GameInfo} from './data/DAO';

let Game = {};

const defaultPlayerInfo = {
  id: null,
  nickname: null,
  response: null,
  score: 0,
  game: null,
  submittedScenario: false
};

const defaultGame = {
  round: null,
  gameOver: 0,
  image: null,
  hostID: null,
  reactorID: null
};  // TODO change this to a real default

/* function generateGameCode(id) {
  return id.toString();
} */

Game._getIDFromGameCode = (code: string): number => {
  return parseInt(code);
};

/**
 * Promise to return a random reaction image url.
 */
Game._getNextImagePromise = (
  lastPostRetrieved?: string
): Promise<{gifUrl: string, lastPostRetrieved: string}> => {
  return new Promise((resolve, reject) => {
    Gifs.getRandomGif((err, gifUrl, lastPostRetrieved) => {
      if (err) {
        reject(err);
      } else if (!gifUrl) {
        reject('Cannot find a gif');
      } else {
        resolve({gifUrl, lastPostRetrieved});
      }
    },
  lastPostRetrieved);
  });
};

Game._getScoresWithConnPromise = async (
  conn: ConnUtils.DBConn,
  userIDs: Array<number>
): Promise<Object> => {
  // return scores = {nickname: score} for the userIDs given
  const info = await DAO.getUsersPropPromise(conn, userIDs, ['nickname', 'score']);

  let scores = {};
  for (const id in info) {
    scores[info[id].nickname] = info[id].score;
  }

  return scores;
};

Game._getScenariosWithConnPromise = async (
  conn: ConnUtils.DBConn,
  userIDs: Array<number>
): Promise<Object> => {
  // return scenarios, as in: {userID: scenario}
  const info = await DAO.getUsersPropPromise(conn, userIDs, ['response']);

  let scenarios = {};
  for (const id in info) {
    if (info[id].response) {
      scenarios[id] = info[id].response;
    }
  }

  return scenarios;
};

/**
 * Returns a promise to return a player info object
 */
Game._getPlayerGameInfoWithConnPromise = async (
  conn: ConnUtils.DBConn,
  playerID: number,
  gameID: number
): Promise<Object> => {
  let [gameInfo, playerInfo, userIDs] = await Promise.all([
    DAO.getGamePromise(conn, gameID),
    DAO.getUserPromise(conn, playerID),
    DAO.getGameUsersPromise(conn, gameID)
  ]);
  const [scores, choices] = await Promise.all([
    Game._getScoresWithConnPromise(conn, userIDs.slice(0)),
    Game._getScenariosWithConnPromise(conn, userIDs.slice(0))
  ]);

  gameInfo.scores = scores;
  gameInfo.choices = choices;

  return({
    gameInfo: gameInfo,
    playerInfo: playerInfo
  });
};

Game._getGameInfoWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number
): Promise<{gameInfo: GameInfo, playerInfo: ?Object}> => {
  // Returns a promise to return {gameInfo: {}, playerInfo: null}
  let [gameInfo, userIDs] = await Promise.all([
    DAO.getGamePromise(conn, gameID),
    DAO.getGameUsersPromise(conn, gameID)
  ]);
  const [scores, choices] = await Promise.all([
    Game._getScoresWithConnPromise(conn, userIDs.slice(0)),
    Game._getScenariosWithConnPromise(conn, userIDs.slice(0))
  ]);

  gameInfo.scores = scores;
  gameInfo.choices = choices;

  return {
    gameInfo: gameInfo,
    playerInfo: null
  };
};

Game._updateIfDoneRespondingWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number,
  userIDs: Array<number>,
  reactorID: number
): Promise<?string> => {
  // Update game info if all the users but the host have responded
  // cb(err)
  if (userIDs.length == 0) {
    console.log('Scenarios are in for this round!');

    const res = await DAO.setGamePromise(conn, gameID, {waitingForScenarios: false});
    if (!res) {
      return 'Error checking game status';
    }
    return;

  } else {

    const nextID = userIDs.pop();
    const userInfo = await DAO.getUserPromise(conn, nextID);

    // Check if not reactor and still hasn't submitted scenario
    if (!userInfo.submittedScenario && nextID != reactorID) {
      return;
    } else {
      await Game._updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, reactorID);
    }
  }
};

Game._checkAllResponsesInWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number
): Promise<?string> => {
  // Update if everyone but reactor done submitting response

  const [gameInfo, userIDs] = await Promise.all([
    DAO.getGamePromise(conn, gameID),
    DAO.getGameUsersPromise(conn, gameID)
  ]);
  return await Game._updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, gameInfo.reactorID);
};

Game._getGameInfoPromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: ?Object}> => {
  // Promise to return game info (and player info if the player ID is given)
  if (req.playerID) {
    let info = await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
    console.log(info);
    if (info.gameInfo.waitingForScenarios) {
      await Game._checkAllResponsesInWithConnPromise(conn, req.gameID);
      return await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
    }
    return info;
  }
  return await Game._getGameInfoWithConnPromise(conn, req.gameID);
};

Game._joinGamePromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: ?Object}> => {
  // Get the gameID of a game and check if it's a valid
  // game.
  const gameID = Game._getIDFromGameCode(req.gameCode);
  return {
    gameInfo: await DAO.getGamePromise(conn, gameID),
    playerInfo: null
  };
};

/**
 * Create a new game
 */
Game._createNewGamePromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: ?Object}> => {
  const res = await DAO.newGamePromise(conn, defaultGame);
  console.log('Creating game with ID ' + res.insertId);
  const gameInfo = await DAO.getGamePromise(conn, res.insertId);
  return {gameInfo, playerInfo: null};
};

Game._nameAlreadyTaken = (name: string, gameInfo: GameInfo) => {
  // Check if there is a user with the same nickname in the game
  for (const n in gameInfo.scores) {
    if (n == name) {
      return true;
    }
  }

  return false;
};

Game._setHostWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number,
  playerID: number
): Promise<Object> => {
  const res = await DAO.setGamePromise(conn, gameID, {'hostID': playerID});
  if (!res || !res.changedRows) {
    throw new Error('Error setting ' + playerID.toString() + ' as host.');
  }
  return res;
};

/**
 * Returns a promise to make a new player and return the playerID
 */
Game._addNewPlayerWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number,
  gameInfo: GameInfo,
  nickname: string
): Promise<number> => {
  if (Game._nameAlreadyTaken(nickname, gameInfo)) {
    throw new Error(nickname + ' is already taken. Please use another name.');
  }

  let playerInfo = {};
  Object.assign(playerInfo, defaultPlayerInfo);
  playerInfo.nickname = nickname;
  playerInfo.game = gameID;

  const playerID = await DAO.newUserPromise(conn, playerInfo);
  return playerID;
};

Game._createPlayerPromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  // Create a player called req.nickname
  // in the game req.gameID
  const gameID = Game._getIDFromGameCode(req.gameID);
  const gameInfo: GameInfo = (await Game._getGameInfoWithConnPromise(conn, gameID)).gameInfo;
  const playerID = await Game._addNewPlayerWithConnPromise(conn, gameID, gameInfo, req.nickname);

  if (gameInfo.hostID === null) {
    // Set the host to be the player.
    await Game._setHostWithConnPromise(conn, gameID, playerID);
  }
  return await Game._getPlayerGameInfoWithConnPromise(conn, playerID, gameID);
};

/**
 * Promise to return {gameInfo: {}, playerInfo: {}}
 */
Game._startGamePromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  const [info, imageInfo, userIDs] = await Promise.all([
    Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID),
    Game._getNextImagePromise(),
    DAO.getGameUsersPromise(conn, req.gameID)
  ]);
  const [gameInfo, playerInfo] = [info.gameInfo, info.playerInfo];

  const gameChanges = {
    round: 1,
    image: imageInfo.gifUrl,
    waitingForScenarios: true,
    reactorID: req.playerID,
    reactorNickname: playerInfo.nickname,
    lastGif: imageInfo.lastPostRetrieved
  };

  if (req.gameID != playerInfo.game) {
    throw new Error('Error starting game: Couldn\'t find player in game.');
  }

  await Promise.all(userIDs.map(
    (userID) => DAO.setUserPromise(conn, userID, {
      response: null,
      submittedScenario: false,
      score: 0
    })
  ));

  let res = await DAO.setGamePromise(conn, req.gameID, gameChanges);
  if (!res) {
    throw new Error('Error starting game');
  } else {
    return({
      gameInfo: gameInfo,
      playerInfo: playerInfo
    });
  }
};

/**
 * Change the gif
 */
Game._skipImagePromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  const info = await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
  const imageInfo = await Game._getNextImagePromise(info.gameInfo.lastGif);

  await DAO.setGamePromise(conn, req.gameID, {
    image: imageInfo.gifUrl,
    lastGif: imageInfo.lastPostRetrieved
  });

  return await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
};

/**
 * Promise to return {gameInfo: {}, playerInfo: {}}
 */
Game._submitResponsePromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  const info = await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
  if (!info || !info.gameInfo || info.gameInfo.round != req.round) {
    throw new Error('Error submitting response. Try again');
  }

  const playerChanges = {
    response: req.response,
    submittedScenario: true,
    roundOfLastResponse: req.round
  };

  await DAO.setUserPromise(conn, req.playerID, playerChanges);
  await Game._checkAllResponsesInWithConnPromise(conn, req.gameID);
  return await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
};

/**
 * Choose the scenario.
 */
Game._chooseScenarioPromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  const info = await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);

  if (!info || !info.gameInfo || info.gameInfo.round != req.round) {
    throw new Error('Error submitting response. Try again');
  }
  if (info.gameInfo.reactorID != info.playerInfo.id) {
    throw new Error('Please wait for the reactor to choose their favorite scenario.');
  }

  const userIDs = await DAO.getGameUsersPromise(conn, req.gameID);
  if (userIDs.indexOf(parseInt(req.choiceID)) == -1 || req.playerID == req.choiceID) {
    throw new Error('Error submitting response.');
  }

  const winnerInfo = await DAO.getUserPromise(conn, req.choiceID);
  await DAO.setUserPromise(conn, req.choiceID, {
    score: winnerInfo.score + 1
  });
  await DAO.setGamePromise(conn, info.gameInfo.id, {
    winningResponseSubmittedBy: winnerInfo.nickname,
    winningResponse: req.choiceID
  });

  return await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
};

/**
 * Choose the next user.
 */
Game._getNextReactor = (users: Array<number>, oldReactor: number) => {
  if (users.length == 0) {
    return;
  }
  const oldIdx = users.indexOf(oldReactor);
  if (oldIdx == users.length - 1) {
    return users[0];
  }
  return users[oldIdx + 1];
};

/**
 * Advance to the next round.
 **/
Game._nextRoundPromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  const [info, userIDs] = await Promise.all([
    Game._getGameInfoWithConnPromise(conn, req.gameID),
    DAO.getGameUsersPromise(conn, req.gameID)
  ]);
  const gameInfo = info.gameInfo;
  if (req.playerID != gameInfo.reactorID) {
    throw new Error('Error moving to the next round: Wait up!');
  }

  const imageInfo = await Game._getNextImagePromise(gameInfo.lastGif);

  // Get the next reactor
  const nextReactor = Game._getNextReactor(userIDs, gameInfo.reactorID);
  if (!nextReactor) {
    throw new Error('Error moving to the next round: No players left.');
  }
  const nextReactorNickname = (await DAO.getUserPromise(conn, nextReactor)).nickname;

  // Remove responses from people and set submittedScenario to false
  await Promise.all(userIDs.map(
    (userID) => DAO.setUserPromise(conn, userID, {
      response: null,
      submittedScenario: false
    })
  ));

  await DAO.setGamePromise(conn, req.gameID, {
    round: gameInfo.round + 1,
    image: imageInfo.gifUrl,
    waitingForScenarios: true,
    reactorID: nextReactor,
    reactorNickname: nextReactorNickname,
    winningResponse: null,
    winningResponseSubmittedBy: null,
    lastGif: imageInfo.lastPostRetrieved
  });

  return await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
};

/**
 * End the game.
 **/
Game._endGamePromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  const [info, userIDs] = await Promise.all([
    Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID),
    DAO.getGameUsersPromise(conn, req.gameID)
  ]);

  if (req.gameID != info.playerInfo.game) {
    throw new Error('Error ending game: Player not in game.');
  }

  // Remove responses from people and set submittedScenario to false
  await Promise.all(userIDs.map(
    (userID) => DAO.setUserPromise(conn, userID, {
      response: null,
      submittedScenario: false
    })
  ));

  await DAO.setGamePromise(conn, req.gameID, {
    round: null,
    image: null,
    waitingForScenarios: false,
    reactorID: null,
    reactorNickname: null,
    winningResponse: null,
    winningResponseSubmittedBy: null,
    gameOver: true
  });

  return await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
};

/**
 * Leave the game the user is in.
 * Doesn't reset the other info under the player in the database.
 * But will send a blank player and game. (So the user can start over.)
 **/
Game._leaveGamePromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: null, playerInfo: null}> => {
  const playerInfo = await DAO.getUserPromise(conn, req.playerID);
  await DAO.leaveGamePromise(conn, req.playerID, playerInfo.game);
  return {gameInfo: null, playerInfo: null};
};

// Functions that call cb(err, res), where res = {gameInfo: [blah], playerInfo: [blah]}
const actions = {
  getGameInfo: Game._getGameInfoPromise,
  joinGame: Game._joinGamePromise,
  createPlayer: Game._createPlayerPromise,
  createNewGame: Game._createNewGamePromise,
  startGame: Game._startGamePromise,
  skipImage: Game._skipImagePromise,
  submitResponse: Game._submitResponsePromise,
  chooseScenario: Game._chooseScenarioPromise,
  nextRound: Game._nextRoundPromise,
  endGame: Game._endGamePromise,
  leaveGame: Game._leaveGamePromise
};

/**
 * Process requests to the server
 * req has the 'action' property to tell it what action to complete
 * Returns a promise to return {gameInfo: {}, playerInfo: {}}
 */
Game.processRequest = async (
  req: Object
): Promise<?{gameInfo: GameInfo, playerInfo: ?Object}> => {
  if (!req.hasOwnProperty('action') || !actions.hasOwnProperty(req.action)) {
    throw new Error('Error while processing your information');
  }

  let conn;
  try {

    conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);
    await ConnUtils.beginTransactionPromise(conn);
    const info = await actions[req.action](req, conn);
    await ConnUtils.commitTransactionPromise(conn);
    return info;

  } catch (err) {

    console.log(err);
    if (conn && conn.getConn) {
      conn.getConn().rollback();
    }
    throw err;

  } finally {

    // Close the connection
    if (conn && conn.getConn) {
      conn.getConn().end();
    }

  }
};

module.exports = Game;
