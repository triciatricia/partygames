/* @flow */

const React = require('react');
const ReactDOM = require('react-dom');
const GameUtils = require('./game-utils');

const GameStatus = React.createClass({
  propTypes: {
    round: React.PropTypes.number,
    score: React.PropTypes.number
  },
  render: function() {
    return (
      <div className='row'>
        <div className='col-md-12'>
          Round: {this.props.round}
          <br />
          Score: {this.props.score}
        </div>
      </div>
    );
  }
});

const ReactionImage = React.createClass({
  propTypes: {
    image: React.PropTypes.string
  },
  render: function() {
    return (
      <div>
        <img src={this.props.image} />
      </div>
    );
  }
});

const ReactionChoice = React.createClass({
  propTypes: {
    choice: React.PropTypes.string,
    key: React.PropTypes.number
  },
  render: function() {
    return (
      <div className='radio scenario'>
        <label><input type='radio' name='scenario'/>{this.props.choice}</label>
      </div>
    );
  }
});

const ReactionScenario = React.createClass({
  propTypes: {
    choice: React.PropTypes.string,
    key: React.PropTypes.number,
    wasChosen: React.PropTypes.bool,
    submittedBy: React.PropTypes.string
  },
  render: function() {
    if (this.props.wasChosen) {
      return (
        <div>
          <p className="chosen">
            {this.props.choice}
          </p>
          <strong className="pull-right form-control-static">
            {this.props.submittedBy} +1
          </strong>
        </div>
      );
    }

    return (
      <div>
        <p className="scenario">
          {this.props.choice}
        </p>
      </div>
    );
  }
});

const ScenarioList = React.createClass({
  propTypes: {
    choices: React.PropTypes.arrayOf(React.PropTypes.string),
    reactorNickname: React.PropTypes.string,
    winningResponse: React.PropTypes.number,
    winningResponseSubmittedBy: React.PropTypes.string,
    isReactor: React.PropTypes.bool
  },
  render: function() {
    let scenarios;
    let button;
    if (this.props.isReactor && this.props.winningResponse === null) {
      // have the reactor choose their favorite scenario
      scenarios = this.props.choices.map(
        (choice, i) => <ReactionChoice choice={choice} key={i} />
      );
      button = <button type="submit" className="btn btn-default">Submit</button>;
    } else {
      // display the scenarios as a list
      scenarios = this.props.choices.map(
        (choice, i) => {
          let submittedBy;
          if (i === this.props.winningResponse) {
            submittedBy = this.props.winningResponseSubmittedBy;
          }
          return (
            <ReactionScenario
              choice={choice}
              key={i}
              wasChosen={i == this.props.winningResponse}
              submittedBy={submittedBy} />
          );
        }
      );
      if (this.props.isReactor) {
        // allow the reactor to move the game to the next round
        button = <button type="submit" className="btn btn-default">Next</button>;
      }
    }
    return (
      <form>
        <label>{this.props.reactorNickname}'s response when:</label>
        {scenarios}
        {button}
      </form>
    );
  }
});

const ResponseForm = React.createClass({
  propTypes: {
    gameInfo: React.PropTypes.object,
    playerInfo: React.PropTypes.object
  },
  render: function() {
    if (this.props.gameInfo.waitingForScenarios) {
      if (this.props.playerInfo.id == this.props.gameInfo.reactorID) {
        return (
          <div>
            <p>Waiting for responses. Hold on tight!</p>
            <button type="submit" className="btn btn-default">Skip Image</button>
          </div>);
      }

      let buttonText = 'Submit Response';
      let helpMessage = '';
      let placeholder = 'Make up something';
      if (this.props.playerInfo.submittedScenario) {
        buttonText = 'Update Response';
        helpMessage = 'Your response is in!';
        placeholder = this.props.playerInfo.response;
      }
      return (
        <form>
          <div className="form-group">
            <p className='text-success'>{helpMessage}</p>
            <label>{this.props.gameInfo.reactorNickname}'s response when...</label>
            <input type="input" className="form-control" id="scenario"
              placeholder={placeholder} defaultValue={this.props.playerInfo.response}/>
          </div>
            <button type="submit" className="btn btn-default">{buttonText}</button>
        </form>
      );
    }

    /* if (this.props.playerInfo.id == this.props.gameInfo.reactorID ||
        this.props.gameInfo.winningResponse) { */
    return (
      <div>
        <p>{GameUtils.getInstructions(this.props.gameInfo,
                                      this.props.playerInfo)}</p>
        <ScenarioList
          choices={this.props.gameInfo.choices}
          reactorNickname={this.props.gameInfo.reactorNickname}
          winningResponse={this.props.gameInfo.winningResponse}
          winningResponseSubmittedBy={this.props.gameInfo.winningResponseSubmittedBy}
          isReactor={this.props.gameInfo.reactorID == this.props.playerInfo.id} />
      </div>
    );
  }
});

const RoundInfo = React.createClass({
  propTypes: {
    gameInfo: React.PropTypes.object,
    playerInfo: React.PropTypes.object
  },
  render: function() {
    return (
      <div className='row'>
        <div className='col-md-6'>
          <ReactionImage
            image={this.props.gameInfo.image} />
        </div>
        <div className='col-md-6'>
          <ResponseForm
            gameInfo={this.props.gameInfo}
            playerInfo={this.props.playerInfo} />
        </div>
      </div>
    );
  }
});

const WaitingToStart = React.createClass({
  propTypes: {
    isHost: React.PropTypes.bool,
    nPlayers: React.PropTypes.number,
    startGame: React.PropTypes.func
  },
  render: function() {
    let button;
    if (this.props.isHost) {
      button = (
        <button type="button" onClick={this.props.startGame} className="btn btn-default">
          Start now!
        </button>
      );
    }
    return (
      <div>
        <p>Waiting to start!</p>
        <p>{this.props.nPlayers} players have joined... </p>
        {button}
      </div>
    );
  }
});

const NewGame = React.createClass({
  propTypes: {
    joinGame: React.PropTypes.func,
    createGame: React.PropTypes.func
  },
  getInitialState: function() {
    return {
      gameCode: ''
    };
  },
  handleChange: function() {
    this.setState({
      gameCode: this.refs.gameCodeInput.value.trim()
    });
  },
  joinGame: function() {
    // TODO: Code validation, Disable button if submitted and not invalid
    this.props.joinGame(this.refs.gameCodeInput.value.trim());
  },
  createGame: function() {
    this.props.createGame();
  },
  render: function() {
    return (
      <div className="jumbotron">
        <h1>Hello!</h1>
        <p>Are you ready to react?</p>
        <form>
          <div className="row">
            <div className="form-group col-xs-6">
              <input type="gameCode" className="form-control" id="gameCode"
                placeholder="Enter code:" value={this.state.gameCode}
                ref="gameCodeInput" onChange={this.handleChange} />
              <button type="button" className="btn btn-default"
                onClick={this.joinGame} >
                Join Game
              </button>
            </div>
          </div>
          <div className="row">
            <div className="form-group col-xs-6">
              <button type="button" className="btn btn-primary btn-lg"
                onClick={this.createGame} >
                <span className="glyphicon glyphicon-plus" aria-hidden="true"></span>
                 &nbsp;&nbsp;New Game
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
});

const NewPlayer = React.createClass({
  propTypes: {
    createPlayer: React.PropTypes.func
  },
  getInitialState: function() {
    return {
      nickname: ''
    };
  },
  handleChange: function() {
    this.setState({
      nickname: this.refs.nicknameInput.value
    });
  },
  createPlayer: function() {
    this.props.createPlayer(this.refs.nicknameInput.value.trim());
  },
  render: function() {
    return (
      <div className="jumbotron">
        <form>
          <div className="row">
            <div className="form-group col-xs-6">
              <input type="text" className="form-control" id="nickname" value={this.state.nickname}
                placeholder="What do you want to be called?" onChange={this.handleChange}
                ref="nicknameInput" />
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-lg"
            onClick={this.createPlayer}>
            Submit nickname
          </button>
        </form>
      </div>
    );
  }
});

const GameOver = React.createClass({
  propTypes: {
    gameInfo: React.PropTypes.object,
    playerInfo: React.PropTypes.object
  },
  render: function() {
    /* Display scores in descending order */
    let scores = this.props.gameInfo.scores;
    let playersSorted = Object.keys(scores);
    playersSorted.sort((p1, p2) => (scores[p2] - scores[p1]));
    let highestScore = scores[playersSorted[0]];

    let scoreTable = playersSorted.map(
      player => {
        if (scores[player] == highestScore) {
          return (
            <strong key={player}><li>{scores[player]} {player}</li></strong>
          );
        } else {
          return (
            <li key={player}>{scores[player]} {player}</li>
          );
        }
      }
    );

    let againButton;
    if (this.props.playerInfo.id == this.props.gameInfo.hostID) {
      againButton = (
        <button type="button" className="btn btn-primary">
          Again!
        </button>
      );
    }

    return (
      <div className="jumbotron">
        <p>And we're done!</p>
        <ul className="list-unstyled">{scoreTable}</ul>
        {againButton}
      </div>
    );
  }
});

const Container = React.createClass({
  getInitialState: function() {
    return {
      gameInfo: null,
      playerInfo: null,
      errorMessage: null
    };
  },
  joinGame: function(gameCode) {
    GameUtils.log('Joining game', gameCode);
    GameUtils.joinGame(gameCode, (err, gameInfo, playerInfo) => {
      if (err) {
        this.setState({
          errorMessage: 'Cannot join game'
        });
      } else {
        this.setState({
          gameInfo: gameInfo,
          playerInfo: playerInfo,
          errorMessage: null
        });
      }
    });
  },
  createGame: function() {
    GameUtils.log('Creating new game');
    GameUtils.createGame((err, gameInfo, playerInfo) => {
      if (err) {
        this.setState({
          errorMessage: 'Error creating a new game'
        });
      } else {
        this.setState({
          gameInfo: gameInfo,
          playerInfo: playerInfo,
          errorMessage: null
        });
      }
    });
  },
  createPlayer: function(nickname) {
    GameUtils.log('Creating new player');
    GameUtils.createPlayer(nickname, this.state.gameInfo.id, (err, gameInfo, playerInfo) => {
      if (err) {
        this.setState({
          errorMessage: 'Error creating new player'
        });
      } else {
        this.setState({
          gameInfo: gameInfo,
          playerInfo: playerInfo,
          errorMessage: null
        });
      }
    });
  },
  pollGameInfo: function() {
    if (!(this.state.gameInfo && this.state.gameInfo.hasOwnProperty('id') && this.state.gameInfo.id)) {
      return;
    }
    GameUtils.getGameInfo(
      this.state.gameInfo.id,
      (err, res) => {
        if (err) {
          this.setState({
            errorMessage: err
          });
        } else {
          this.setState({
            gameInfo: res
          });
        }
      }
    );
  },
  startGame: function() {
    GameUtils.startGame(
      this.state.gameInfo.id,
      this.state.playerInfo.id,
      (err, gameInfo, playerInfo) => {
        this.setState({
          errorMessage: err,
          gameInfo: gameInfo,
          playerInfo: playerInfo
        });
      });
  },
  componentDidMount: function() {
    this.pollGameInfo();
    setInterval(this.pollGameInfo, 1000);
  },
  render: function() {
    if (this.state.gameInfo === null) {
      return (
        <NewGame joinGame={this.joinGame} createGame={this.createGame} />
      );
    }
    if (this.state.gameInfo.round !== null) {
      return (
        <div>
          <GameStatus
            round={this.state.gameInfo.round}
            score={this.state.playerInfo.score} />
          <RoundInfo
            gameInfo={this.state.gameInfo}
            playerInfo={this.state.playerInfo} />
        </div>
      );
    }
    if (this.state.gameInfo.gameOver) {
      return (
        <GameOver
          gameInfo={this.state.gameInfo}
          playerInfo={this.state.playerInfo} />
      );
    }
    if (this.state.playerInfo.id !== null) { // Should change to something else indicating waiting to start.
      return (
        <WaitingToStart
          isHost={this.state.gameInfo.hostID == this.state.playerInfo.id}
          nPlayers={Object.keys(this.state.gameInfo.scores).length}
          startGame={this.startGame} />
      );
    }
    /* player hasn't been created */
    return (
      <NewPlayer createPlayer={this.createPlayer} />
    );
  }
});

ReactDOM.render(
  <Container />,
  document.getElementById('container')
);
