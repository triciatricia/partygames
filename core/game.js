'use strict';

var ConnUtils = require('./data/conn');
var DAO = require('./data/DAO');
var Gifs = require('./gifs');

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

/**
 * Returns a function to close the connection and call the callback
 */
function callbackThatClosesConn(conn, cb) {
  return (err, info) => {
    if (conn) {
      conn.getConn().end();
    }
    cb(err, info);
  };
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
async function getPlayerGameInfoWithConnPromise(conn, playerID, gameID) {
  return new Promise(async (resolve, reject) => {
    try {
      let gameInfo = await DAO.getGamePromise(conn, gameID);
      let playerInfo = await DAO.getUserPromise(conn, playerID);
      let userIDs = await DAO.getGameUsersPromise(conn, gameID);
      let scores = await getScoresWithConnPromise(conn, userIDs.slice(0));
      let choices = await getScenariosWithConnPromise(conn, userIDs.slice(0));

      gameInfo.scores = scores;
      gameInfo.choices = choices;

      resolve({
        gameInfo: gameInfo,
        playerInfo: playerInfo
      });
    } catch (err) {
      console.log(err);
      reject(err);
      return;
    }
  });
}

async function getGameInfoWithConnPromise(conn, gameID) {
  // Returns a promise to return {gameInfo: {}, playerInfo: null}
  return new Promise(async (resolve, reject) => {
    try {
      let gameInfo = await DAO.getGamePromise(conn, gameID);
      let userIDs = await DAO.getGameUsersPromise(conn, gameID);
      let scores = await getScoresWithConnPromise(conn, userIDs.slice(0));
      let choices = await getScenariosWithConnPromise(conn, userIDs.slice(0));

      gameInfo.scores = scores;
      gameInfo.choices = choices;

      resolve({
        gameInfo: gameInfo,
        playerInfo: null
      });
    } catch (err) {
      console.log(err);
      reject(err);
      return;
    }
  });
}

function updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, hostID) {
  // Update game info if all the users but the host have responded
  // cb(err)
  return new Promise(async (resolve, reject) => {
    if (userIDs.length == 0) {

      console.log('Scenarios are in for this round!');
      try {
        let res = await DAO.setGamePromise(conn, gameID, {waitingForScenarios: false});
        if (!res) {
          reject('Error checking game status');
        } else {
          resolve(null);
        }
      } catch (err) {
        reject(err);
      }

    } else {

      let nextID = userIDs.pop();
      let userInfo;
      try {
        userInfo = await DAO.getUserPromise(conn, nextID);

        // Check if not host and still hasn't submitted scenario
        if (!userInfo.submittedScenario && nextID != hostID) {
          resolve();
        } else {
          await updateIfDoneRespondingWithConnPromise(conn, gameID, userIDs, hostID);
        }

      } catch (err) {
        console.log('Cannot find user record.' + nextID.toString());
        reject('Cannot find user record.');
        return;
      }
    }
  });
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

async function getGameInfo(req, cb) {
  // cb(null, {gameInfo: ...})
  let conn;
  let newCb = callbackThatClosesConn(conn, cb);
  try {
    conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.READ);
    let info = await getGameInfoWithConnPromise(conn, req.gameID);
    newCb(null, info);
  } catch (err) {
    newCb(err, {});
  }
}

async function joinGame(req, cb) {
  // Get the gameID of a game and check if it's a valid
  // game.
  let gameID = getIDFromGameCode(req.gameCode);
  let conn;
  let newCb = callbackThatClosesConn(conn, cb);
  try {
    conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.READ);
    let gameInfo = await DAO.getGamePromise(conn, gameID);
    newCb(null, {gameInfo});
  } catch (err) {
    newCb(err, {});
  }
}

/**
 * Create a new game
 */
async function createNewGame(req, cb) {
  let conn;
  let newCb = callbackThatClosesConn(conn, cb);
  try {
    conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);
    let res = await DAO.newGamePromise(conn, defaultGame);
    console.log('Creating game with ID ' + res.insertId);
    let gameInfo = await DAO.getGamePromise(conn, res.insertId);
    newCb(null, {gameInfo});
  } catch (err) {
    newCb(err, {});
  }
}

async function createPlayer(req, cb) {
  // Create a player called req.nickname
  // in the game req.gameID
  let gameID = getIDFromGameCode(req.gameID);
  let conn;
  let newCb = callbackThatClosesConn(conn, cb);
  try {
    conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);
    let info = await getGameInfoWithConnPromise(conn, gameID);
    let gameInfo = info.gameInfo;

    // Check if there is a user with the same nickname in the game
    for (var name in gameInfo.scores) {
      if (name == req.nickname) {
        newCb(req.nickname + ' is already taken. Please use another name.', {});
        return;
      }
    }

    let playerInfo = {};
    Object.assign(playerInfo, defaultPlayerInfo);
    playerInfo.nickname = req.nickname;
    playerInfo.game = gameID;

    let playerID = await DAO.newUserPromise(conn, playerInfo);

    if (gameInfo.hostID === null) {
      // Set the host to be the player.
      let res = await DAO.setGamePromise(conn, gameID, {'hostID': playerID});
      if (!res.changedRows) {
        newCb('Error setting ' + playerID.toString() + ' as host.', {});
        return;
      }
    }

    newCb(null, await getPlayerGameInfoWithConnPromise(conn, playerID, gameID));
  } catch (err) {
    newCb(err, {});
  }
}

async function startGame(req, cb) {
  let conn;
  let newCb = callbackThatClosesConn(conn, cb);
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
      newCb('Error starting game: You\'re not the host. Please wait for the host to start the game.');
      return;
    }

    let res = await DAO.setGamePromise(conn, req.gameID, gameChanges);
    if (!res) {
      newCb('Error starting game');
    } else {
      newCb(null, {
        gameInfo: gameInfo,
        playerInfo: playerInfo
      });
    }
  } catch (err) {
    newCb(err.toString(), {});
  }
}

async function submitResponse(req, cb) {
  let conn;
  let newCb = callbackThatClosesConn(conn, cb);
  try {
    conn = await ConnUtils.getNewConnectionPromise(ConnUtils.Modes.WRITE);

    let info = await getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
    if (!info || !info.gameInfo || info.gameInfo.round != req.round) {
      newCb('Error submitting response. Try again', {});
      return;
    }

    let playerChanges = {
      response: req.response,
      submittedScenario: true,
      roundOfLastResponse: req.round
    };

    let res = await DAO.setUserPromise(conn, req.playerID, playerChanges);
    if (!res) {
      newCb('Error submitting response.', {});
      return;
    }

    let res2 = await checkAllResponsesInWithConnPromise(conn, req.gameID);
    // res2 should be null
    if (!res2) {
      let info = await getPlayerGameInfoWithConnPromise(conn, req.playerID, req.gameID);
      newCb(null, {
        gameInfo: info.gameInfo,
        playerInfo: info.playerInfo
      });
    }
  } catch (err) {
    newCb('Error submitting response', {});
  }
}

// Functions that call cb(err, res), where res = {gameInfo: [blah], playerInfo: [blah]}
const actions = {
  getGameInfo,
  joinGame,
  createPlayer,
  createNewGame,
  startGame,
  submitResponse
};

function processRequest(req: Object, cb: (err: string, res: ?Object) => void) {
  // Process requests to the server
  // req has the 'action' property to tell it what action to complete
  // cb(err, res)
  // req = {gameInfo: ..., playerInfo: ...}

  if (!req.hasOwnProperty('action') || !actions.hasOwnProperty(req.action)) {
    return cb('Error while processing your information');
  }

  actions[req.action](req, (err, info) => {
    let res = {
      'gameInfo': null,
      'playerInfo': null
    };
    Object.assign(res, info);
    cb(err, res);
  });

}

module.exports = {
  processRequest
};
