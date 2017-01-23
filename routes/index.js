'use strict';

var express = require('express');
var router = express.Router();
const game = require('../core/game.js');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'MRW' });
});

/* POST for game api */
router.post('/api/game', async (req, res) => {
  if (req.body.hasOwnProperty('action') && req.body.action != 'getGameInfo') {
    console.log('Game API request:', req.body);
  }

  try {

    let info = await game.processRequest(req.body);
    if (req.body.hasOwnProperty('action') && req.body.action != 'getGameInfo') {
      console.log('Sending info:', info);
    }
    res.json({
      result: {
        gameInfo: info.gameInfo,
        playerInfo: info.playerInfo
      },
      errorMessage: null
    });

  } catch(err) {

    console.log('Sending error:', err);
    res.json({
      errorMessage: err.message
    });

  }
  /*
  game.processRequest(
    req.body,
    (err, info) => {
      console.log('Sending info:', info);
      if (err) {
        console.log('Sending error:', err);
        res.json({
          errorMessage: err
        });
      } else {

      }
    }
  ); */
});

module.exports = router;
