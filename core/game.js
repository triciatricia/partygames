'use strict';

/* @flow */

const ConnUtils = require('./data/conn');
const DAO = require('./data/DAO');
const Gifs = require('./gifs');

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

function getIDFromGameCode(code) {
  return parseInt(code);
}

/**
 * Promise to return a random reaction image url.
 */
function getNextImagePromise() {
  return new Promise((reject, resolve) => {
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
}

function getScoresWithConnPromise(conn, userIDs) {
  // return scores = {nickname: score} for the userIDs given
  return new Promise((resolve, reject) => {
    DAO.getUsersProp(conn, userIDs, ['nickname', 'score'], (err, info) => {
      if (err) {
        reject(err);
        return;
      }

      let scores = {};
      for (var id in info) {
        scores[info[id].nickname] = info[id].score;
      }

      resolve(scores);
    });
  });
}

function getScenariosWithConnPromise(conn, userIDs) {
  return new Promise(function(resolve, reject) {
    // return scenarios, as in: {userID: scenario}
    DAO.getUsersProp(conn, userIDs, ['response'], (err, info) => {
      if (err) {
        reject(err);
        return;
      }

      let scenarios = {};
      for (var id in info) {
        if (info[id].response) {
          scenarios[id] = info[id].response;
        }
      }

      resolve(scenarios);
    });
  });
}

/**
 * Returns a promise to return a player info object
 */
async function getPlayerGameInfoWithConnPromise(conn: ConnUtils.DBConn, playerID: number, gameID) {
  let gameInfo = await DAO.getGamePromise(conn, gameID);
  let playerInfo = await DAO.getUserPromise(conn, playerID);
  let userIDs = await DAO.getGameUsersPromise(conn, gameID);
  let scores = await getScoresWithConnPromise(conn, userIDs.slice(0));
  let choices = await getScenariosWithConnPromise(conn, userIDs.slice(0));

  gameInfo.scores = scores;
  gameInfo.choices = choices;

  return({
    gameInfo: gameInfo,
    playerInfo: playerInfo
  });
}

async function getGameInfoWithConnPromise(conn, gameID) {
  // Returns a promise to return {gameInfo: {}, playerInfo: null}
  let gameInfo = await DAO.getGamePromise(conn, gameID);
  let userIDs = await DAO.getGameUsersPromise(conn, gameID);
  let scores = await getScoresWithConnPromise(conn, userIDs.slice(0));
  let choices = await getScenariosWithConnPromise(conn, userIDs.slice(0));

  gameInfo.scores = scores;
  gameInfo.choices = choices;

  return({
    gameInfo: gameInfo,
    playerInfo: null
  });
}

async function updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, hostID) {
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
      await updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, hostID);
    }
  }
}

async function checkAllResponsesInWithConnPromise(conn, gameID) {
  // Update if everyone but reactor done submitting response
  return new Promise(async (resolve, reject) => {
    try {

      let gameInfo = await DAO.getGamePromise(conn, gameID);
      let hostID = gameInfo.hostID;

      let userIDs = await DAO.getGameUsersPromise(conn, gameID);
      let res = await updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, hostID);
      resolve(res);

    } catch (err) {
      reject(err);
    }
  });
}

async function getGameInfoPromise(req) {
  // Promise to return game info
  return new Promise(async (resolve, reject) => {
    let conn;

    try {
      conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.READ);
      let info = await getGameInfoWithConnPromise(conn, req.gameID);
      resolve(info);
    } catch (err) {
      reject('Error retrieving game info.');
    } finally {
      if (conn && conn.getConn) {
        conn.getConn().end();
      }
    }
  });
}

async function joinGamePromise(req) {
  // Get the gameID of a game and check if it's a valid
  // game.
  return new Promise(async (resolve, reject) => {
    let gameID = getIDFromGameCode(req.gameCode);
    let conn;

    try {
      conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.READ);
      let gameInfo = await DAO.getGamePromise(conn, gameID);
      resolve({gameInfo});
    } catch (err) {
      reject('Error joining game.');
    } finally {
      if (conn && conn.getConn) {
        conn.getConn().end();
      }
    }
  });
}

/**
 * Create a new game
 */
async function createNewGamePromise() {
  return new Promise(async (resolve, reject) => {
    let conn;

    try {

      conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);
      let res = await DAO.newGamePromise(conn, defaultGame);
      console.log('Creating game with ID ' + res.insertId);
      let gameInfo = await DAO.getGamePromise(conn, res.insertId);
      resolve({gameInfo, playerInfo: null});

    } catch (err) {

      reject('Error creating game. Please try again.');

    } finally {

      if (conn && conn.getConn) {
        conn.getConn().end();
      }

    }
  });
}

function nameAlreadyTaken(name, gameInfo) {
  // Check if there is a user with the same nickname in the game
  for (var n in gameInfo.scores) {
    if (n == name) {
      return true;
    }
  }

  return false;
}

function setHostWithConnPromise(conn, gameID, playerID) {
  return new Promise(async (resolve, reject) => {
    let res = await DAO.setGamePromise(conn, gameID, {'hostID': playerID});
    if (!res.changedRows) {
      reject('Error setting ' + playerID.toString() + ' as host.');
    } else {
      resolve(res);
    }
  });
}

/**
 * Returns a promise to make a new player and return the playerID
 */
function addNewPlayerWithConnPromise(conn, gameID, gameInfo, nickname) {
  return new Promise(async (resolve, reject) => {
    try {
      if (nameAlreadyTaken(nickname, gameInfo)) {
        reject(nickname + ' is already taken. Please use another name.');
        return;
      }

      let playerInfo = {};
      Object.assign(playerInfo, defaultPlayerInfo);
      playerInfo.nickname = nickname;
      playerInfo.game = gameID;

      let playerID = await DAO.newUserPromise(conn, playerInfo);
      resolve(playerID);
    } catch (err) {
      reject('Error creating new player in database.');
    }
  });
}

async function createPlayerPromise(req) {
  // Create a player called req.nickname
  // in the game req.gameID
  return new Promise(async (resolve, reject) => {
    let gameID = getIDFromGameCode(req.gameID);
    let conn;

    try {

      conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);
      let gameInfo = (await getGameInfoWithConnPromise(conn, gameID)).gameInfo;
      let playerID = await addNewPlayerWithConnPromise(conn, gameID, gameInfo, req.nickname);

      if (gameInfo.hostID === null) {
        // Set the host to be the player.
        await setHostWithConnPromise(conn, gameID, playerID);
      }

      resolve(await getPlayerGameInfoWithConnPromise(conn, playerID, gameID));

    } catch (err) {

      console.log(err);
      reject('Error creating a new user. Please try again. ' + err.toString());

    } finally {

      if (conn && conn.getConn) {
        conn.getConn().end();
      }

    }
  });

}

/**
 * Promise to return {gameInfo: {}, playerInfo: {}}
 */
async function startGamePromise(req) {
  return new Promise(async (resolve, reject) => {
    let conn;

    try {
      conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);

      let info = await getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
      let image = await getNextImagePromise();
      let gameInfo = info.gameInfo;
      let playerInfo = info.playerInfo;

      let gameChanges = {
        round: 1,
        image: image,
        waitingForScenarios: true,
        reactorID: req.playerID,
        reactorNickname: playerInfo.nickname
      };

      if (req.playerID != gameInfo.hostID) {
        reject('Error starting game: You\'re not the host. Please wait for the host to start the game.');
        return;
      }

      let res = await DAO.setGamePromise(conn, req.gameID, gameChanges);
      if (!res) {
        reject('Error starting game');
      } else {
        resolve({
          gameInfo: gameInfo,
          playerInfo: playerInfo
        });
      }
    } catch (err) {

      reject(err.toString());

    } finally {

      if (conn && conn.getConn) {
        conn.getConn().end();
      }

    }
  });
}

/**
 * Promise to return {gameInfo: {}, playerInfo: {}}
 */
async function submitResponsePromise(req) {
  return new Promise(async (resolve, reject) => {
    let conn;

    try {

      conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);

      let info = await getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
      if (!info || !info.gameInfo || info.gameInfo.round != req.round) {
        reject('Error submitting response. Try again');
        return;
      }

      let playerChanges = {
        response: req.response,
        submittedScenario: true,
        roundOfLastResponse: req.round
      };

      await DAO.setUserPromise(conn, req.playerID, playerChanges);
      await checkAllResponsesInWithConnPromise(conn, req.gameID);
      let newInfo = await getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
      resolve(newInfo);

    } catch (err) {

      reject('Error submitting response');

    } finally {

      if (conn && conn.getConn) {
        conn.getConn().end();
      }

    }
  });
}

// Functions that call cb(err, res), where res = {gameInfo: [blah], playerInfo: [blah]}
const actions = {
  getGameInfo: getGameInfoPromise,
  joinGame: joinGamePromise,
  createPlayer: createPlayerPromise,
  createNewGame: createNewGamePromise,
  startGame: startGamePromise,
  submitResponse: submitResponsePromise
};

/**
 * Process requests to the server
 * req has the 'action' property to tell it what action to complete
 * Returns a promise to return {gameInfo: {}, playerInfo: {}}
 */
function processRequest(req: Object) {
  return new Promise(async (resolve, reject) => {
    if (!req.hasOwnProperty('action') || !actions.hasOwnProperty(req.action)) {
      reject('Error while processing your information');
      return;
    }

    try {
      resolve(await actions[req.action](req));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  processRequest
};
