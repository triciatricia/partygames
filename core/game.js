'use strict';

/* @flow */

const ConnUtils = require('./data/conn');
const DAO = require('./data/DAO');
const Gifs = require('./gifs');

import type { GameInfo, Image } from './data/DAO';

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
Game._getNextImagePromise = async (
  imageQueue: Array<Image>,
  prevImage: ?Image,
  curImage: ?Image,
  lastPostRetrieved: ?string
): Promise<{
  imageQueue: Array<Image>,
  image: Image,
  lastPostRetrieved?: ?string
}> => {
  // Return current image if the image to be skipped was already skipped.
  if (prevImage && curImage && prevImage.id < curImage.id) {
    return({ imageQueue: imageQueue, image: curImage, lastPostRetrieved: lastPostRetrieved });
  }

  const IMAGE_QUEUE_SIZE = 3;
  const MAX_TRIES = 4;

  let ntries = 0;
  while (imageQueue.length < IMAGE_QUEUE_SIZE + 1) {
    if (ntries > MAX_TRIES) {
      throw new Error('Cannot find more gifs.');
    }

    // Fetch more gifs
    const [nextImages, newLastPostRetrieved] = await Gifs.getGifs(lastPostRetrieved);
    let lastGifId = 0;
    if (imageQueue && imageQueue.length > 0) {
      lastGifId = imageQueue[0].id;
    }
    if (prevImage && (imageQueue == null || imageQueue.length == 0)) {
      // There was a previous gif but the queue is out.
      lastGifId = prevImage.id;
    }

    // Asign IDs to the next images
    let imageQueueToPrepend = [];
    for (let id = lastGifId + nextImages.length; id > lastGifId; id --) {
      imageQueueToPrepend.push({
        url: nextImages[id - lastGifId - 1],
        id: id
      });
    }
    imageQueue = imageQueueToPrepend.concat(imageQueue).slice(-IMAGE_QUEUE_SIZE - 1);
    lastPostRetrieved = newLastPostRetrieved;
    ntries += 1;
  }

  let image = imageQueue.pop();

  while (prevImage && prevImage.id >= image.id && imageQueue.length > 0) {
    // In case multiple images were skipped.
    image = imageQueue.pop();
  }

  return({ imageQueue, image, lastPostRetrieved });
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

/**
 * Shuffle an array
 */
Game._shuffle = <T>(arr: Array<T>): Array<T> => {
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    let rand = Math.floor(Math.random() * (i + 1));
    let temp = arr[i];
    arr[i] = arr[rand];
    arr[rand] = temp;
  }
  return arr;
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
      // Insert '_' before each id so it doesn't default to ordering responses by id.
      scenarios[Game._choiceIDFromPlayerID(id)] = info[id].response;
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

  let displayOrder = gameInfo.displayOrder ? gameInfo.displayOrder.split(',') : null;
  const keys = Object.getOwnPropertyNames(choices);
  let orderedChoices = {};
  for (let i in displayOrder) {
    let j = parseInt(displayOrder[i]);
    if (j < keys.length) {
      orderedChoices[keys[j]] = choices[keys[j]];
    }
  }

  gameInfo.scores = scores;
  gameInfo.choices = orderedChoices;
  gameInfo.responsesIn = Object.keys(choices).length;

  gameInfo.winningResponse = Game._choiceIDFromPlayerID(gameInfo.winningResponse);

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

  let displayOrder = gameInfo.displayOrder ? gameInfo.displayOrder.split(',') : null;
  const keys = Object.getOwnPropertyNames(choices);
  let orderedChoices = {};
  let nResponses = choices.length;
  for (let i in displayOrder) {
    let j = parseInt(displayOrder[i]);
    if (j < keys.length) {
      orderedChoices[keys[j]] = choices[keys[j]];
    }
  }

  gameInfo.scores = scores;
  gameInfo.choices = orderedChoices;

  gameInfo.winningResponse = Game._choiceIDFromPlayerID(gameInfo.winningResponse);
  gameInfo.nResponses = nResponses;

  return {
    gameInfo: gameInfo,
    playerInfo: null
  };
};

Game._updateIfDoneRespondingWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number,
  userIDs: Array<number>,
  reactorID: number,
  nPlayers: number
): Promise<?string> => {
  // Update game info if all the users but the host have responded
  // cb(err)
  if (userIDs.length == 0) {
    console.log('Scenarios are in for this round!');
    return await Game._goToChooseScenarios(conn, gameID, nPlayers);

  } else {

    const nextID = userIDs.pop();
    const userInfo = await DAO.getUserPromise(conn, nextID);

    // Check if not reactor and still hasn't submitted scenario
    if (!userInfo.submittedScenario && nextID != reactorID) {
      return;
    } else {
      await Game._updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, reactorID, nPlayers);
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
  return await Game._updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, gameInfo.reactorID, userIDs.length);
};

Game._goToChooseScenarios = async (
  conn: ConnUtils.DBConn,
  gameID: number,
  nResponses: number
): Promise<?string> => {
  let displayOrder = [];

  for (let i = 0; i < nResponses; i++) {
    displayOrder.push(i);
  }
  displayOrder = Game._shuffle(displayOrder);

  const res = await DAO.setGamePromise(conn, gameID, {
    waitingForScenarios: false,
    displayOrder: displayOrder.toString(),
    roundStarted: null,
  });
  if (!res) {
    return 'Error checking game status';
  }
};

Game._checkTimeUpWithConnPromise = async (
  conn: ConnUtils.DBConn,
  gameID: number
): Promise<?string> => {
  // Update if time's up
  const gameInfo = await DAO.getGamePromise(conn, gameID);
  const userIDs = await DAO.getGameUsersPromise(conn, gameID);
  const choices = await Game._getScenariosWithConnPromise(conn, userIDs.slice(0));
  let nResponses = Object.keys(choices).length;
  if (gameInfo.timeLeft !== null && gameInfo.timeLeft < -3000 && nResponses > 0) { // Allow 3 secs leeway
    return await Game._goToChooseScenarios(conn, gameID, userIDs.length);
  }
};

Game._getGameInfoPromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: ?Object}> => {
  // Promise to return game info (and player info if the player ID is given)
  if (req.playerID) {
    let info = await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
    if (info.gameInfo.waitingForScenarios) {
      await Game._checkTimeUpWithConnPromise(conn, req.gameID);
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
  try {
    return {
      gameInfo: await DAO.getGamePromise(conn, gameID),
      playerInfo: null
    };
  } catch (err) {
    throw new Error('Cannot find game. Please check your game code.');
  }
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

  if (nickname.length === 0) {
    throw new Error('Please enter a non-blank name.');
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
  let info = await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);

  let [imageInfo, userIDs] = await Promise.all([
    Game._getNextImagePromise(info.gameInfo.imageQueue, info.gameInfo.image, info.gameInfo.image, info.gameInfo.gifUrl),
    DAO.getGameUsersPromise(conn, req.gameID)
  ]);

  const [gameInfo, playerInfo] = [info.gameInfo, info.playerInfo];

  const gameChanges = {
    round: 1,
    image: imageInfo.image,
    imageQueue: imageInfo.imageQueue,
    waitingForScenarios: true,
    reactorID: req.playerID,
    reactorNickname: playerInfo.nickname,
    lastGif: imageInfo.lastPostRetrieved,
    roundStarted: Date.now(),
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
    return await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
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
  const imageInfo = await Game._getNextImagePromise(
    info.gameInfo.imageQueue,
    req.image ? req.image : info.gameInfo.image,
    info.gameInfo.image,
    info.gameInfo.lastGif
  );

  await DAO.setGamePromise(conn, req.gameID, {
    image: imageInfo.image,
    imageQueue: imageInfo.imageQueue,
    lastGif: imageInfo.lastPostRetrieved,
    roundStarted: Date.now(),
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
  if (!req.response || req.response.trim().length === 0) {
    throw new Error('Please submit a non-blank response.')
  }

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
 * Get the player ID from the choice ID
 */
Game._playerIDFromChoiceID = (choiceID: string) => {
  return parseInt(choiceID.substring(1));
};

Game._choiceIDFromPlayerID = (playerID: number | string) => {
  return playerID && '_' + playerID;
};

/**
 * Choose the scenario.
 */
Game._chooseScenarioPromise = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  if (req.choiceID === null) {
    throw new Error('Please pick your favorite scenario.');
  }
  const info = await Game._getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);

  let winningID = Game._playerIDFromChoiceID(req.choiceID);

  if (!info || !info.gameInfo || info.gameInfo.round != req.round) {
    throw new Error('Error submitting response. Try again');
  }
  if (info.gameInfo.reactorID != info.playerInfo.id) {
    throw new Error('Please wait for the reactor to choose their favorite scenario.');
  }

  const userIDs = await DAO.getGameUsersPromise(conn, req.gameID);
  if (userIDs.indexOf(winningID) == -1 || req.playerID == winningID) {
    throw new Error('Error submitting response.');
  }

  const winnerInfo = await DAO.getUserPromise(conn, winningID);
  await DAO.setUserPromise(conn, winningID, {
    score: winnerInfo.score + 1
  });
  await DAO.setGamePromise(conn, info.gameInfo.id, {
    winningResponseSubmittedBy: winnerInfo.nickname,
    winningResponse: winningID
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

  const imageInfo = await Game._getNextImagePromise(gameInfo.imageQueue, gameInfo.image, gameInfo.image, gameInfo.lastGif);

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
    image: imageInfo.image,
    imageQueue: imageInfo.imageQueue,
    waitingForScenarios: true,
    reactorID: nextReactor,
    reactorNickname: nextReactorNickname,
    winningResponse: null,
    winningResponseSubmittedBy: null,
    lastGif: imageInfo.lastPostRetrieved,
    roundStarted: Date.now(),
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
  const gameInfo = await DAO.getGamePromise(conn, playerInfo.game);
  if (req.playerID == gameInfo.reactorID) {
    req.gameID = playerInfo.game;
    await Game._nextRoundPromise(req, conn);
  }
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
  if (!req.action || !actions.hasOwnProperty(req.action)) {
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
