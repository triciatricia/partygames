'use strict';

/* @flow */

const ConnUtils = require('./data/conn');
const DAO = require('./data/DAO');
const Gifs = require('./gifs');

import {sendPushesIfActiveAsync} from './notifications';

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

/**
 * Promise to return a new reaction image url.
 */
Game._getNextImageAsync = async (
  imageQueue: Array<Image>,
  prevImage: ?Image,
  curImage: ?Image,
  lastPostRetrieved: ?string,
  gameId: string,
  reactorNickname: string,
  conn: ConnUtils.DBConn,
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
    const [nextImages, newLastPostRetrieved] = await Gifs.getGifsAsync(lastPostRetrieved);
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

  // Save the image to the database
  await DAO.newImageAsync(conn, image.url, gameId, image.id, reactorNickname);

  return({ imageQueue, image, lastPostRetrieved });
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

// Save the current time as the last time the app was active
Game._setActiveTimeAsync = async (
  conn: ConnUtils.DBConn,
  playerID: number,
): Promise<void> => {
  await DAO.setUserAsync(conn, playerID, {
    lastActiveTime: Date.now(),
  });
}

/**
 * Returns a promise to return a player info object
 */
Game._getPlayerGameInfoWithConnAsync = async (
  conn: ConnUtils.DBConn,
  playerID: number,
  gameID: string
): Promise<Object> => {
  let [gameInfo, playerInfo] = await Promise.all([
    DAO.getGameAsync(conn, gameID),
    DAO.getUserAsync(conn, playerID),
  ]);

  return({
    gameInfo: gameInfo,
    playerInfo: playerInfo
  });
};

Game._getGameInfoWithConnAsync = async (
  conn: ConnUtils.DBConn,
  gameID: string
): Promise<{gameInfo: GameInfo, playerInfo: ?Object}> => {
  // Returns a promise to return {gameInfo: {}, playerInfo: null}
  let gameInfo = await DAO.getGameAsync(conn, gameID);

  return {
    gameInfo: gameInfo,
    playerInfo: null
  };
};

Game._checkAllResponsesInWithConnAsync = async (
  conn: ConnUtils.DBConn,
  gameID: string
): Promise<?string> => {
  // Update if everyone but reactor done submitting response
  const [gameInfo, userIDs, responses] = await Promise.all([
    DAO.getGameAsync(conn, gameID),
    DAO.getGameUsersAsync(conn, gameID),
    DAO.getGameResponsesAsync(conn, gameID),
  ]);

  if (Object.keys(responses).length < userIDs.length - 1) {
    return;
  }

  console.log('Scenarios are in for this round!');
  await Game._goToChooseScenariosAsync(conn, gameID, userIDs.length, userIDs, gameInfo.roundStarted);
};

Game._goToChooseScenariosAsync = async (
  conn: ConnUtils.DBConn,
  gameID: string,
  nResponses: number,
  userIDs: Array<number>,
  roundStarted: number,
): Promise<void> => {
  let displayOrder = [];

  for (let i = 0; i < nResponses; i++) {
    displayOrder.push(i);
  }
  displayOrder = Game._shuffle(displayOrder);

  const res = await DAO.setGameAsync(conn, gameID, {
    waitingForScenarios: false,
    displayOrder: displayOrder.toString(),
    roundStarted: null,
  });
  if (!res) {
    throw Error('Error checking game status');
  }

  // Send push notifications to players with the app hidden
  await sendPushesIfActiveAsync(
    'The responses are in! Click here to see them.',
    conn,
    userIDs,
    roundStarted,
  );
};

Game._checkTimeUpWithConnAsync = async (
  conn: ConnUtils.DBConn,
  gameID: string
): Promise<?string> => {
  // Update if time's up
  const gameInfo = await DAO.getGameAsync(conn, gameID);
  const userIDs = await DAO.getGameUsersAsync(conn, gameID);
  if (gameInfo.timeLeft !== null && gameInfo.timeLeft < -3000 && gameInfo.responsesIn > 0) { // Allow 3 secs leeway
    return await Game._goToChooseScenariosAsync(conn, gameID, userIDs.length, userIDs, gameInfo.roundStarted);
  }
};

Game._getGameInfoAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: ?Object}> => {
  // Promise to return game info (and player info if the player ID is given)
  let info;
  if (req.playerID) {
    info = await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
    if (info.gameInfo.waitingForScenarios) {
      await Game._checkTimeUpWithConnAsync(conn, req.gameID);
      await Game._checkAllResponsesInWithConnAsync(conn, req.gameID);
      return await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
    }
  } else {
    info = await Game._getGameInfoWithConnAsync(conn, req.gameID);
  }

  if (info.gameInfo.gameOver) {
    info.gameInfo.gameImages = await DAO.getGameImagesAsync(conn, req.gameID, info.gameInfo.firstImageID);
  }

  return info;
};

Game._joinGameAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: ?Object}> => {
  // Get the gameID of a game and check if it's a valid
  // game.
  const gameID = req.gameCode;
  try {
    return {
      gameInfo: await DAO.getGameAsync(conn, gameID),
      playerInfo: null
    };
  } catch (err) {
    throw new Error('Cannot find game. Please check your game code.');
  }
};

/**
 * Create a new game
 */
Game._createNewGameAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: ?Object}> => {
  const res = await DAO.newGameAsync(conn, defaultGame);
  console.log('Creating game with ID ' + res.insertId);
  const gameInfo = await DAO.getGameAsync(conn, res.insertId);
  return {gameInfo, playerInfo: null};
};

Game._heartImageAsync = async (
  req: {url: string, playerID: number, gameID: string},
  conn: ConnUtils.DBConn,
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  await DAO.increaseHeartCountAsync(conn, req.url);
  return await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
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

Game._setHostWithConnAsync = async (
  conn: ConnUtils.DBConn,
  gameID: string,
  playerID: number
): Promise<Object> => {
  const res = await DAO.setGameAsync(conn, gameID, {'hostID': playerID});
  if (!res || !res.changedRows) {
    throw new Error('Error setting ' + playerID.toString() + ' as host.');
  }
  return res;
};

/**
 * Returns a promise to make a new player and return the playerID
 */
Game._addNewPlayerWithConnAsync = async (
  conn: ConnUtils.DBConn,
  gameID: string,
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

  const playerID = await DAO.newUserAsync(conn, playerInfo);
  return playerID;
};

Game._createPlayerAsync = async (
  req: {gameID: string, nickname: string, pushToken?: string},
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  // Create a player called req.nickname
  // in the game req.gameID
  // req.pushToken (optional) can specify a token for push notifications.
  const gameID = req.gameID;
  const gameInfo: GameInfo = (await Game._getGameInfoWithConnAsync(conn, gameID)).gameInfo;
  const playerID = await Game._addNewPlayerWithConnAsync(conn, gameID, gameInfo, req.nickname);

  if (req.pushToken) {
    console.log('Setting push token ' + req.pushToken);
    await DAO.setUserAsync(conn, playerID, {
      ExpoPushToken: req.pushToken,
    });
  }

  if (gameInfo.hostID === null) {
    // Set the host to be the player.
    await Game._setHostWithConnAsync(conn, gameID, playerID);
  }
  return await Game._getPlayerGameInfoWithConnAsync(conn, playerID, gameID);
};

/**
 * Promise to return {gameInfo: {}, playerInfo: {}}
 */
Game._startGameAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  let info = await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
  const [gameInfo, playerInfo] = [info.gameInfo, info.playerInfo];

  let [imageInfo, userIDs] = await Promise.all([
    Game._getNextImageAsync(
      gameInfo.imageQueue,
      gameInfo.image,
      gameInfo.image,
      gameInfo.gifUrl,
      gameInfo.id,
      playerInfo.nickname,
      conn,
    ),
    DAO.getGameUsersAsync(conn, req.gameID)
  ]);

  let newFirstImageID = imageInfo.image.id;

  const gameChanges = {
    round: 1,
    firstImageID: newFirstImageID,
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
    (userID) => DAO.setUserAsync(conn, userID, {
      response: null,
      submittedScenario: false,
      score: 0
    })
  ));

  let res = await DAO.setGameAsync(conn, req.gameID, gameChanges);
  if (!res) {
    throw new Error('Error starting game');
  } else {
    return await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
  }
};

/**
 * Change the gif
 */
Game._skipImageAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  const info = await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
  const imageInfo = await Game._getNextImageAsync(
    info.gameInfo.imageQueue,
    req.image ? req.image : info.gameInfo.image,
    info.gameInfo.image,
    info.gameInfo.lastGif,
    info.gameInfo.id,
    info.gameInfo.reactorNickname,
    conn,
  );

  if (req.image && imageInfo.image.id > req.image.id) {
    // The image has been skipped for the first time in this game.
    await DAO.skipImageAsync(conn, req.image.url, req.gameID, req.image.id);
  }

  await DAO.setGameAsync(conn, req.gameID, {
    image: imageInfo.image,
    imageQueue: imageInfo.imageQueue,
    lastGif: imageInfo.lastPostRetrieved,
    roundStarted: Date.now(),
  });

  return await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
};

/**
 * Promise to return {gameInfo: {}, playerInfo: {}}
 */
Game._submitResponseAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  if (!req.response || req.response.trim().length === 0) {
    throw new Error('Please submit a non-blank response.')
  }

  const info = await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
  if (!info || !info.gameInfo || info.gameInfo.round != req.round) {
    throw new Error('Error submitting response. Try again');
  }

  const playerChanges = {
    response: req.response,
    submittedScenario: true,
    roundOfLastResponse: req.round
  };

  await DAO.setUserAsync(conn, req.playerID, playerChanges);
  await Game._checkAllResponsesInWithConnAsync(conn, req.gameID);
  return await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
};

/**
 * Get the player ID from the choice ID
 */
Game._playerIDFromChoiceID = (choiceID: string) => {
  return parseInt(choiceID.substring(1));
};

/**
 * Choose the scenario.
 */
Game._chooseScenarioAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  if (req.choiceID === null) {
    throw new Error('Please pick your favorite scenario.');
  }
  const info = await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);

  let winningID = Game._playerIDFromChoiceID(req.choiceID);

  if (!info || !info.gameInfo || info.gameInfo.round != req.round) {
    throw new Error('Error submitting response. Try again');
  }
  if (info.gameInfo.reactorID != info.playerInfo.id) {
    throw new Error('Please wait for the reactor to choose their favorite scenario.');
  }

  const userIDs = await DAO.getGameUsersAsync(conn, req.gameID);
  if (userIDs.indexOf(winningID) == -1 || req.playerID == winningID) {
    throw new Error('Error submitting response.');
  }

  const winnerInfo = await DAO.getUserAsync(conn, winningID);
  await DAO.setUserAsync(conn, winningID, {
    score: winnerInfo.score + 1
  });
  await Promise.all([
    DAO.setGameAsync(conn, info.gameInfo.id, {
      winningResponseSubmittedBy: winnerInfo.nickname,
      winningResponse: winningID
    }),
    DAO.setImageScenarioAsync(conn, info.gameInfo.id,
      info.gameInfo.image.id, winnerInfo.response)
    ]);

  return await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
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
Game._nextRoundAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  const [info, userIDs] = await Promise.all([
    Game._getGameInfoWithConnAsync(conn, req.gameID),
    DAO.getGameUsersAsync(conn, req.gameID)
  ]);
  const gameInfo = info.gameInfo;
  if (req.playerID != gameInfo.reactorID) {
    throw new Error('Error moving to the next round: Wait up!');
  }

  // Get the next reactor
  const nextReactor = Game._getNextReactor(userIDs, gameInfo.reactorID);
  if (!nextReactor) {
    throw new Error('Error moving to the next round: No players left.');
  }
  const nextReactorNickname = (await DAO.getUserAsync(conn, nextReactor)).nickname;

  const imageInfo = await Game._getNextImageAsync(
    gameInfo.imageQueue,
    gameInfo.image,
    gameInfo.image,
    gameInfo.lastGif,
    gameInfo.id,
    nextReactorNickname,
    conn,
  );

  // Remove responses from people and set submittedScenario to false
  await Promise.all(userIDs.map(
    (userID) => DAO.setUserAsync(conn, userID, {
      response: null,
      submittedScenario: false
    })
  ));

  await DAO.setGameAsync(conn, req.gameID, {
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

  return await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
};

/**
 * End the game.
 **/
Game._endGameAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: GameInfo, playerInfo: Object}> => {
  const [info, userIDs] = await Promise.all([
    Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID),
    DAO.getGameUsersAsync(conn, req.gameID)
  ]);

  if (req.gameID != info.playerInfo.game) {
    throw new Error('Error ending game: Player not in game.');
  }

  // Remove responses from people and set submittedScenario to false
  await Promise.all(userIDs.map(
    (userID) => DAO.setUserAsync(conn, userID, {
      response: null,
      submittedScenario: false
    })
  ));

  await DAO.setGameAsync(conn, req.gameID, {
    round: null,
    image: null,
    waitingForScenarios: false,
    reactorID: null,
    reactorNickname: null,
    winningResponse: null,
    winningResponseSubmittedBy: null,
    gameOver: true,
  });

  return await Game._getPlayerGameInfoWithConnAsync(conn, req.playerID, req.gameID);
};

/**
 * Leave the game the user is in.
 * Doesn't reset the other info under the player in the database.
 * But will send a blank player and game. (So the user can start over.)
 **/
Game._leaveGameAsync = async (
  req: Object,
  conn: ConnUtils.DBConn
): Promise<{gameInfo: null, playerInfo: null}> => {
  const playerInfo = await DAO.getUserAsync(conn, req.playerID);
  const gameInfo = await DAO.getGameAsync(conn, playerInfo.game);
  if (req.playerID == gameInfo.reactorID) {
    req.gameID = playerInfo.game;
    await Game._nextRoundAsync(req, conn);
  }
  await DAO.leaveGameAsync(conn, req.playerID, playerInfo.game);
  return {gameInfo: null, playerInfo: null};
};

// Functions that call cb(err, res), where res = {gameInfo: [blah], playerInfo: [blah]}
const actions = {
  getGameInfo: Game._getGameInfoAsync,
  joinGame: Game._joinGameAsync,
  createPlayer: Game._createPlayerAsync,
  createNewGame: Game._createNewGameAsync,
  heartImage: Game._heartImageAsync,
  startGame: Game._startGameAsync,
  skipImage: Game._skipImageAsync,
  submitResponse: Game._submitResponseAsync,
  chooseScenario: Game._chooseScenarioAsync,
  nextRound: Game._nextRoundAsync,
  endGame: Game._endGameAsync,
  leaveGame: Game._leaveGameAsync
};

/**
 * Process requests to the server
 * req has the 'action' property to tell it what action to complete
 * Returns a promise to return {gameInfo: {}, playerInfo: {}}
 */
Game.processRequestAsync = async (
  req: Object
): Promise<?{gameInfo: GameInfo, playerInfo: ?Object}> => {
  if (!req.action || !actions.hasOwnProperty(req.action)) {
    throw new Error('Error while processing your information');
  }

  let conn;
  try {

    conn = await ConnUtils.getNewConnectionAsync(ConnUtils.Modes.WRITE);
    await ConnUtils.beginTransactionAsync(conn);

    // Update the last active time if the app is active
    if (req.playerID && req.appIsActive) {
      await Game._setActiveTimeAsync(conn, req.playerID);
    }

    const info = await actions[req.action](req, conn);
    await ConnUtils.commitTransactionAsync(conn);
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
