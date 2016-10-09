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
  console.log('Game API request:', req.body);
  let error = null; // TODO validate

  if (error) {
    console.log('Failed game API request:', req.body, error);
    return res.json({
      result: null,
      errorMessage: error
    });
  }

  try {
    let info = await game.processRequest(req.body);
    console.log('Sending info:', info);
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
      errorMessage: err
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
