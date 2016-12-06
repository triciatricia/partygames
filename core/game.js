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
Game._getNextImagePromise = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    Gifs.getRandomGif((err, gifUrl) => {
      if (err) {
        reject(err);
      } else if (!gifUrl) {
        reject('Cannot find a gif');
      } else {
        resolve(gifUrl);
      }
    });
  });
};

Game._getScoresWithConnPromise = async (
  conn: ConnUtils.DBConn,
  userIDs: Array<number>
): Promise<Object> => {
  // return scores = {nickname: score} for the userIDs given
  let info = await DAO.getUsersPropPromise(conn, userIDs, ['nickname', 'score']);

  let scores = {};
  for (var id in info) {
    scores[info[id].nickname] = info[id].score;
  }

  return scores;
};

Game._getScenariosWithConnPromise = async (
  conn: ConnUtils.DBConn,
  userIDs: Array<number>
): Promise<Object> => {
  // return scenarios, as in: {userID: scenario}
  let info = await DAO.getUsersPropPromise(conn, userIDs, ['response']);

  let scenarios = {};
  for (var id in info) {
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
  let [scores, choices] = await Promise.all([
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
): Promise<{gameInfo: GameInfo, playerInfo: null}> => {
  // Returns a promise to return {gameInfo: {}, playerInfo: null}
  let [gameInfo, userIDs] = await Promise.all([
    DAO.getGamePromise(conn, gameID),
    DAO.getGameUsersPromise(conn, gameID)
  ]);
  let [scores, choices] = await Promise.all([
    Game._getScoresWithConnPromise(conn, userIDs.slice(0)),
    Game._getScenariosWithConnPromise(conn, userIDs.slice(0))
  ]);

  gameInfo.scores = scores;
  gameInfo.choices = choices;

  return({
    gameInfo: gameInfo,
    playerInfo: null
  });
};

Game._updateIfDoneRespondingWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number,
  userIDs: Array<number>,
  hostID: number
): Promise<?string> => {
  // Update game info if all the users but the host have responded
  // cb(err)
  if (userIDs.length == 0) {
    console.log('Scenarios are in for this round!');

    let res = await DAO.setGamePromise(conn, gameID, {waitingForScenarios: false});
    if (!res) {
      return 'Error checking game status';
    }
    return;

  } else {

    let nextID = userIDs.pop();
    let userInfo = await DAO.getUserPromise(conn, nextID);

    // Check if not host and still hasn't submitted scenario
    if (!userInfo.submittedScenario && nextID != hostID) {
      return;
    } else {
      await Game._updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, hostID);
    }
  }
};

Game._checkAllResponsesInWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number
): Promise<?string> => {
  // Update if everyone but reactor done submitting response

  let [gameInfo, userIDs] = await Promise.all([
    DAO.getGamePromise(conn, gameID),
    DAO.getGameUsersPromise(conn, gameID)
  ]);
  let hostID = gameInfo.hostID;
  return await Game._updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, hostID);
};

Game._getGameInfoPromise = async (req: Object, conn: ConnUtils.DBConn) => {
  // Promise to return game info
  return await Game._getGameInfoWithConnPromise(conn, req.gameID);
};

Game._joinGamePromise = async (req: Object, conn: ConnUtils.DBConn) => {
  // Get the gameID of a game and check if it's a valid
  // game.
  let gameID = Game._getIDFromGameCode(req.gameCode);
  return {gameInfo: await DAO.getGamePromise(conn, gameID)};
};

/**
 * Create a new game
 */
Game._createNewGamePromise = async () => {
  let conn;

  try {

    conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);
    let res = await DAO.newGamePromise(conn, defaultGame);
    console.log('Creating game with ID ' + res.insertId);
    let gameInfo = await DAO.getGamePromise(conn, res.insertId);
    return {gameInfo, playerInfo: null};

  } finally {
    if (conn && conn.getConn) {
      conn.getConn().end();
    }
  }
};

Game._nameAlreadyTaken = (name: string, gameInfo: GameInfo) => {
  // Check if there is a user with the same nickname in the game
  for (var n in gameInfo.scores) {
    if (n == name) {
      return true;
    }
  }

  return false;
}

Game._setHostWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number,
  playerID: number
): Promise<Object> => {
  let res = await DAO.setGamePromise(conn, gameID, {'hostID': playerID});
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

  let playerID = await DAO.newUserPromise(conn, playerInfo);
  return playerID;
};

Game._createPlayerPromise = async (req: Object, conn: ConnUtils.DBConn) => {
  // Create a player called req.nickname
  // in the game req.gameID
  let gameID = Game._getIDFromGameCode(req.gameID);

  conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);
  let gameInfo: GameInfo = (await Game._getGameInfoWithConnPromise(conn, gameID)).gameInfo;
  let playerID = await Game._addNewPlayerWithConnPromise(conn, gameID, gameInfo, req.nickname);

  if (gameInfo.hostID === null) {
    // Set the host to be the player.
    await Game._setHostWithConnPromise(conn, gameID, playerID);
  }
  return await Game._getPlayerGameInfoWithConnPromise(conn, playerID, gameID);
};

/**
 * Promise to return {gameInfo: {}, playerInfo: {}}
 */
Game._startGamePromise = async (req: Object, conn: ConnUtils.DBConn) => {
  let [info, image] = await Promise.all([
    Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID),
    Game._getNextImagePromise()
  ]);
  let [gameInfo, playerInfo] = [info.gameInfo, info.playerInfo];

  let gameChanges = {
    round: 1,
    image: image,
    waitingForScenarios: true,
    reactorID: req.playerID,
    reactorNickname: playerInfo.nickname
  };

  if (req.playerID != gameInfo.hostID) {
    throw new Error('Error starting game: You\'re not the host. Please wait for the host to start the game.');
  }

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
 * Promise to return {gameInfo: {}, playerInfo: {}}
 */
Game._submitResponsePromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  let info = await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
  if (!info || !info.gameInfo || info.gameInfo.round != req.round) {
    throw new Error('Error submitting response. Try again');
  }

  let playerChanges = {
    response: req.response,
    submittedScenario: true,
    roundOfLastResponse: req.round
  };

  await DAO.setUserPromise(conn, req.playerID, playerChanges);
  await Game._checkAllResponsesInWithConnPromise(conn, req.gameID);
  return await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
};

// Functions that call cb(err, res), where res = {gameInfo: [blah], playerInfo: [blah]}
const actions = {
  getGameInfo: Game._getGameInfoPromise,
  joinGame: Game._joinGamePromise,
  createPlayer: Game._createPlayerPromise,
  createNewGame: Game._createNewGamePromise,
  startGame: Game._startGamePromise,
  submitResponse: Game._submitResponsePromise
};

/**
 * Process requests to the server
 * req has the 'action' property to tell it what action to complete
 * Returns a promise to return {gameInfo: {}, playerInfo: {}}
 */
Game.processRequest = async (
  req: Object
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  if (!req.hasOwnProperty('action') || !actions.hasOwnProperty(req.action)) {
    throw new Error('Error while processing your information');
  }

  let conn;
  try {

    conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);
    return await actions[req.action](req, conn);

  } finally {

    // Close the connection
    if (conn && conn.getConn) {
      conn.getConn().end();
    }

  }
};

module.exports = Game;
