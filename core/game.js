'use strict';

var Utils = require('./utils');
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

function getNextImage(cb) {
  // Return a random reaction image url.
  Gifs.getRandomGif(cb);
}

function getScoresWithConn(conn, userIDs, cb) {
  // cb(err, scores)
  // scores = {nickname: score} for the userIDs
  DAO.getUsersProp(conn, userIDs, ['nickname', 'score'], (err, info) => {
    if (err) {
      cb(err, {});
      return;
    }

    let scores = {};
    for (var id in info) {
      scores[info[id].nickname] = info[id].score;
    }

    cb(null, scores);
  });
}

function getScenariosWithConn(conn, userIDs, cb) {
  // cb(err, {userID: scenario})
  DAO.getUsersProp(conn, userIDs, ['response'], (err, info) => {
    if (err) {
      cb(err, {});
      return;
    }

    let scenarios = {};
    for (var id in info) {
      if (info[id].response) {
        scenarios[id] = info[id].response;
      }
    }

    cb(null, scenarios);
  });
}

function getPlayerGameInfoWithConn(conn, playerID, gameID, cb) {
  // cb(err, {gameInfo: blah, playerInfo: blah})
  DAO.getGame(conn, gameID, (err, gameInfo) => {
    if (err) {
      cb('Cannot find game record.', {});
      return;
    }

    DAO.getUser(conn, playerID, (err, playerInfo) => {
      if (err) {
        cb('Cannot find user record.', {});
        return;
      }

      // For now, get every user's scores.
      // TODO In the future, don't update score info as often if it takes too much time.
      DAO.getGameUsers(conn, gameID, (err, userIDs) => {
        if (err) {
          cb('Cannot find game users in record.', {});
          return;
        }

        getScoresWithConn(conn, userIDs.slice(0), (err, scores) => {
          // scores = {nickname: score}
          if (err) {
            cb('Error retrieving scores', {});
            return;
          }

          getScenariosWithConn(
            conn,
            userIDs,
            (err, choices) => {
              if (err) {
                console.log(err);
                cb(err);
                return;
              }

              gameInfo.scores = scores;
              gameInfo.choices = choices;

              cb(null, {
                gameInfo: gameInfo,
                playerInfo: playerInfo
              });
            });
        });
      });
    });
  });
}

function getGameInfoWithConn(conn, gameID, cb) {
  // cb(err, {gameInfo: blah})
  DAO.getGame(conn, gameID, (err, gameInfo) => {
    if (err) {
      cb('Cannot find game record.', {});
      return;
    }

    DAO.getGameUsers(conn, gameID, (err, userIDs) => {
      if (err) {
        cb('Cannot find game users in record.', {});
        return;
      }

      getScoresWithConn(conn, userIDs.slice(0), (err, scores) => {
        // scores = {nickname: score}
        if (err) {
          cb('Error retrieving scores', {});
          return;
        }

        getScenariosWithConn(
          conn,
          userIDs,
          (err, choices) => {
            if (err) {
              console.log(err);
              cb(err);
              return;
            }

            gameInfo.scores = scores;
            gameInfo.choices = choices;

            cb(null, {
              gameInfo: gameInfo
            });
          });
      });
    });
  });
}

function doneRespondingWithConn(conn, gameID, cb) {
  // Update the game info since the scenaios are in
  DAO.setGame(
    conn,
    gameID,
    {
      waitingForScenarios: false
    },
    cb);
}

function updateIfDoneRespondingWithConn(conn, gameID, userIDs, hostID, cb) {
  // Update game info if all the users but the host have responded
  // cb(err)
  if (userIDs.length == 0) {

    console.log('Scenarios are in for this round!');
    doneRespondingWithConn(conn, gameID, cb);

  } else {

    let nextID = userIDs.pop();
    DAO.getUser(conn, nextID, (err, userInfo) => {
      if (err) {
        console.log('Cannot find user record.' + nextID.toString());
        cb('Cannot find user record.', []);
        return;
      }

      // Check if not host and still hasn't submitted scenario
      if (!userInfo.submittedScenario && nextID != hostID) {
        cb();
        return;
      }

      updateIfDoneRespondingWithConn(conn, gameID, userIDs, hostID, cb);
    });
  }
}

function checkAllResponsesInWithConn(conn, gameID, cb) {
  // Update if everyone but reactor done submitting response
  // cb(err)
  DAO.getGame(conn, gameID, (err, gameInfo) => {
    if (err) {
      console.log('Cannot find game record.');
      cb('Cannot find game record.');
      return;
    }

    let hostID = gameInfo.hostID;

    DAO.getGameUsers(conn, gameID, (err, userIDs) => {
      if (err) {
        console.log('Cannot find game users in record.');
        cb('Cannot find game users in record.');
        return;
      }

      updateIfDoneRespondingWithConn(conn, gameID, userIDs, hostID, (err) => {
        if (err) {
          console.log('Error retrieving player info');
          cb('Error retrieving player info');
          return;
        }
        cb();
      });
    });
  });
}

function getGameInfo(req, cb) {
  // cb(null, {gameInfo: ...})
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.READ,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      getGameInfoWithConn(conn, req.gameID,
        (err, info) => {
          if (err) {
            conn.getConn().end();
          } else {
            conn.getConn().end();
            cb(null, info);
          }
        });
    });
}

function joinGame(req, cb) {
  // Get the gameID of a game and check if it's a valid
  // game.
  let gameID = getIDFromGameCode(req.gameCode);
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.READ,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      DAO.getGame(conn, gameID, (err, res) => {
        if (err) {
          cb(err, {});
        } else {
          cb(null, {
            gameInfo: res
          });
        }
        conn.getConn().end();
      });
    });
}

function createNewGame(req, cb) {
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.WRITE,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      DAO.newGame(conn, defaultGame, (err, res) => {
        if (err) {
          conn.getConn().end();
          cb(err);
          return;
        }

        console.log('Creating game with ID ' + res.insertId);

        DAO.getGame(conn, res.insertId, (err, res) => {
          if (err) {
            conn.getConn().end();
            cb(err);
            return;
          }

          conn.getConn().end();
          cb(null, {
            gameInfo: res
          });
        });
      });
    }
  );
}

function createPlayer(req, cb) {
  // Create a player called req.nickname
  // in the game req.gameID
  let gameID = getIDFromGameCode(req.gameID);
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.WRITE,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      getGameInfoWithConn(conn, gameID, (err, info) => {
        let gameInfo = info.gameInfo;
        if (err) {
          conn.getConn().end();
          cb('Cannot find game record for code ' + gameID + '. ' + err, {});
          return;
        }

        // Check if there is a user with the same nickname in the game
        for (var name in gameInfo.scores) {
          if (name == req.nickname) {
            conn.getConn().end();
            cb(req.nickname + ' is already taken. Please use another name.', {});
            return;
          }
        }

        let playerInfo = {};
        Utils.extend(playerInfo, defaultPlayerInfo);
        playerInfo.nickname = req.nickname;
        playerInfo.game = gameID;

        DAO.newUser(conn, playerInfo, (err, playerID) => {
          if (err) {
            conn.getConn().end();
            cb('Error creating player.', {});
            return;
          }

          if (gameInfo.hostID === null) {

            // Set the host to be the player.
            DAO.setGame(conn, gameID, {'hostID': playerID}, (err) => {
              if (err) {
                console.log('Error setting player ' + playerID + ' as host of game ' + gameID);
              }

              getPlayerGameInfoWithConn(conn, playerID, gameID, (err, info) => {
                conn.getConn().end();
                cb(err, info);
              });
            });

          } else {
            getPlayerGameInfoWithConn(conn, playerID, gameID, (err, info) => {
              conn.getConn().end();
              cb(err, info);
            });
          }
        });
      });
    });
}

function startGame(req, cb) {
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.WRITE,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      getPlayerGameInfoWithConn(conn, req.playerID, req.gameID, (err, info) => {
        getNextImage((image) => {

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
            conn.getConn().end();
            cb('Error starting game: You\'re not the host. Please wait for the host to start the game.');
            return;
          }

          DAO.setGame(conn, req.gameID, gameChanges, (err) => {
            if (err) {
              conn.getConn().end();
              cb('Error starting game');
              return;
            }

            cb(null, {
              gameInfo: gameInfo,
              playerInfo: playerInfo
            });
            conn.getConn().end();
          });
        });
      });
    });
}

function submitResponse(req, cb) {
  var conn = ConnUtils.getNewConnection(
    ConnUtils.Modes.WRITE,
    (err) => {
      if (err) {
        conn.getConn().end();
        cb(err);
        return;
      }

      getPlayerGameInfoWithConn(conn, req.playerID, req.gameID, (err, info) => {
        if (err) {
          conn.getConn().end();
          cb('Error submitting response.');
          return;
        }

        if (info.gameInfo.round != req.round) {
          conn.getConn().end();
          cb('Error submitting response.');
          return;
        }

        let playerChanges = {
          response: req.response,
          submittedScenario: true,
          roundOfLastResponse: req.round
        };

        DAO.setUser(conn, req.playerID, playerChanges, (err) => {
          if (err) {
            conn.getConn().end();
            cb('Error submitting response.');
            return;
          }

          checkAllResponsesInWithConn(conn, req.gameID, (err) =>  {
            if (err) {
              conn.getConn().end();
              cb('Error submitting response.');
              return;
            }

            getPlayerGameInfoWithConn(conn, req.playerID, req.gameID, (err, info) => {
              if (err) {
                conn.getConn().end();
                cb('Error submitting response.');
                return;
              }

              cb(null, {
                gameInfo: info.gameInfo,
                playerInfo: info.playerInfo
              });
              conn.getConn().end();
            });
          });
        });
      });
    });
}

// Functions that call cb(err, res), where res = {gameInfo: [blah], playerInfo: [blah]}
const actions = {
  getGameInfo: getGameInfo,
  joinGame: joinGame,
  createPlayer: createPlayer,
  createNewGame: createNewGame,
  startGame: startGame,
  submitResponse: submitResponse
};

module.exports.processRequest = (req, cb) => {
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
    Utils.extend(res, info);
    cb(err, res);
  });

};
