'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const GameUtils = require('./game-utils');

const GameStatus = React.createClass({
  propTypes: {
    round: React.PropTypes.number,
    score: React.PropTypes.number,
    nickname: React.PropTypes.string,
    gameCode: React.PropTypes.number,
    leaveGame: React.PropTypes.func
  },
  render: function() {
    return (
      <div className="row">
        <div className="col-md-12">
          <div className="pull-left">
            <span id="nickname" >{this.props.nickname}</span>
            <br />
            Score: <span id="score">{this.props.score}</span>
          </div>
          <div className="pull-right text-right">
            Round: <span id="round" >{this.props.round}</span>
            <br />
            Game Code: <span>{this.props.gameCode}</span>
            <br />
            <button
              className="btn-link"
              id="leaveGameButton"
              style={{padding: 0}}
              onClick={this.props.leaveGame} >Leave Game</button>
          </div>
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
        <img id="gif" className="img-responsive" src={this.props.image} />
      </div>
    );
  }
});

const ReactionChoice = React.createClass({
  propTypes: {
    choice: React.PropTypes.string,
    id: React.PropTypes.string,
    isChecked: React.PropTypes.bool,
    onScenarioSelection: React.PropTypes.func
  },
  render: function() {
    return (
      <div className='radio scenario'>
        <label><input
          type='radio'
          value={this.props.id}
          checked={this.props.isChecked}
          onChange={this.props.onScenarioSelection} />{this.props.choice}</label>
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
    choices: React.PropTypes.object, // TODO randomize choice order
    reactorNickname: React.PropTypes.string,
    winningResponse: React.PropTypes.number,
    winningResponseSubmittedBy: React.PropTypes.string,
    isReactor: React.PropTypes.bool,
    chooseScenario: React.PropTypes.func,
    nextRound: React.PropTypes.func,
    endGame: React.PropTypes.func
  },
  getInitialState: function() {
    return {
      selectedScenario: null
    };
  },
  chooseScenario: function() {
    this.props.chooseScenario(this.state.selectedScenario);
  },
  render: function() {
    let scenarios;
    let button;
    let endGameButton;
    if (this.props.isReactor && this.props.winningResponse === null) {
      // have the reactor choose their favorite scenario
      scenarios = Object.getOwnPropertyNames(this.props.choices).map(
        (id) => {
          return (<ReactionChoice
            choice={this.props.choices[id]}
            id={id.toString()}
            key={id}
            isChecked={this.state.selectedScenario == id}
            onScenarioSelection={(event) => {
              this.setState({
                selectedScenario: event.target.value
              });
            }} />);
        }
      );
      button = <button
        type="button"
        className="btn btn-default"
        onClick={this.chooseScenario} >Submit</button>;
    } else {
      // display the scenarios as a list
      scenarios = Object.getOwnPropertyNames(this.props.choices).map(
        (id) => {
          let submittedBy;
          if (id === this.props.winningResponse) {
            submittedBy = this.props.winningResponseSubmittedBy;
          }
          return (
            <ReactionScenario
              choice={this.props.choices[id]}
              id={id.toString()}
              key={id}
              wasChosen={id == this.props.winningResponse}
              submittedBy={submittedBy} />
          );
        }
      );
      if (this.props.isReactor) {
        // allow the reactor to move the game to the next round
        button = <button
          type="button"
          className="btn btn-default"
          onClick={this.props.nextRound} >Next</button>;
        endGameButton = <button
          type="button"
          className="btn btn-default"
          onClick={this.props.endGame} >End Game</button>;
      }
    }
    return (
      <form>
        <label>{this.props.reactorNickname}&#39;s response when:</label>
        {scenarios}
        {button}
        {endGameButton}
      </form>
    );
  }
});

const ResponseForm = React.createClass({
  propTypes: {
    gameInfo: React.PropTypes.object,
    playerInfo: React.PropTypes.object,
    submitResponse: React.PropTypes.func,
    chooseScenario: React.PropTypes.func,
    nextRound: React.PropTypes.func,
    endGame: React.PropTypes.func,
    skipImage: React.PropTypes.func
  },
  submitResponse: function(e) {
    e.preventDefault();
    this.props.submitResponse(this.refs.response.value.trim());
  },
  render: function() {
    if (this.props.gameInfo.waitingForScenarios) {
      if (this.props.playerInfo.id == this.props.gameInfo.reactorID) {
        return (
          <div>
            <p></p>
            <p className="small">Waiting for responses. Hold on tight!</p>
            <button
              type="button"
              id="skipImageButton"
              className="btn btn-default"
              onClick={this.props.skipImage} >Skip Image</button>
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
        <form onSubmit={this.submitResponse}>
          <div className="form-group">
            <p className='text-success'>{helpMessage}</p>
            <label>{this.props.gameInfo.reactorNickname}&#39;s response when...</label>
            <input autoFocus type="input" className="form-control" id="scenario"
              placeholder={placeholder} defaultValue={this.props.playerInfo.response}
              ref="response" />
          </div>
            <button id="submitResponseButton" type="submit" className="btn btn-default">{buttonText}</button>
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
          isReactor={this.props.gameInfo.reactorID == this.props.playerInfo.id}
          chooseScenario={this.props.chooseScenario}
          nextRound={this.props.nextRound}
          endGame={this.props.endGame} />
      </div>
    );
  }
});

const RoundInfo = React.createClass({
  propTypes: {
    gameInfo: React.PropTypes.object,
    playerInfo: React.PropTypes.object,
    submitResponse: React.PropTypes.func,
    chooseScenario: React.PropTypes.func,
    nextRound: React.PropTypes.func,
    endGame: React.PropTypes.func,
    skipImage: React.PropTypes.func
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
            playerInfo={this.props.playerInfo}
            submitResponse={this.props.submitResponse}
            chooseScenario={this.props.chooseScenario}
            nextRound={this.props.nextRound}
            endGame={this.props.endGame}
            skipImage={this.props.skipImage} />
        </div>
      </div>
    );
  }
});

const WaitingToStart = React.createClass({
  propTypes: {
    isHost: React.PropTypes.bool,
    nPlayers: React.PropTypes.number,
    startGame: React.PropTypes.func,
    gameID: React.PropTypes.number,
    errorMessage: React.PropTypes.string
  },
  getInitialState: function() {
    return {
      isLoading: false
    };
  },
  startGame: function() {
    this.setState({
      isLoading: true
    });
    this.props.startGame();
  },
  render: function() {
    let button;
    if (this.props.isHost) {
      button = (
        <button id="startNowButton" type="button" onClick={this.startGame} className="btn btn-default">
          Start now!
        </button>
      );
    }
    if (this.state.isLoading && this.props.errorMessage == null) {
      button = (
        <button id="startNowButton" type="button" onClick={this.startGame} className="btn btn-default" disabled>
          Loading...
        </button>
      );
    }
    return (
      <div>
        <h2>Waiting to start!</h2>
        <p className="small">
          Game code: <span id="gameCode">{this.props.gameID}</span><br />
          <span className="text-muted">
            <span id="nPlayers">{this.props.nPlayers}</span> players have joined...</span>
        </p>
        {button}
        <p id="errorMessage" className={this.props.errorMessage ? "text-danger small" : "hidden"}>
          {this.props.errorMessage}
        </p>
      </div>
    );
  }
});

const NewGame = React.createClass({
  propTypes: {
    joinGame: React.PropTypes.func,
    createGame: React.PropTypes.func,
    errorMessage: React.PropTypes.string
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
  joinGame: function(e) {
    e.preventDefault();
    this.props.joinGame(this.refs.gameCodeInput.value.trim());
  },
  createGame: function() {
    this.props.createGame();
  },
  render: function() {
    return (
      <div className="row">
        <div className="col-sm-6">
          <h1>Hello!</h1>
          <p>Are you ready to react?</p>
          <form className="form-inline" onSubmit={this.joinGame}>
            <p className={this.props.errorMessage ? "form-group has-error" : "form-group"}>
              <input autoFocus type="gameCode" className='form-control' id="gameCode"
                placeholder="Enter code:" value={this.state.gameCode}
                ref="gameCodeInput" onChange={this.handleChange} />

              <button id="joinGameButton" type="submit" className="btn btn-default">
                Join Game
              </button>

              <span id="errorMessage" className={this.props.errorMessage ? "help-block" : "hidden"}>
                {this.props.errorMessage}
              </span>
            </p>

            <p></p>

            <p className="form-group">
              <button id="newGameButton" type="button" className="btn btn-primary btn-lg"
                onClick={this.createGame} >
                <span className="glyphicon glyphicon-plus" aria-hidden="true"></span>
                 &nbsp;&nbsp;New Game
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }
});

const NewPlayer = React.createClass({
  propTypes: {
    createPlayer: React.PropTypes.func,
    errorMessage: React.PropTypes.string
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
  createPlayer: function(e) {
    e.preventDefault();
    this.props.createPlayer(this.refs.nicknameInput.value.trim());
  },
  render: function() {
    return (
      <div className="row">
        <div className="col-sm-6">
          <form onSubmit={this.createPlayer}>
              <div className={this.props.errorMessage ? 'form-group has-error' : 'form-group'}>
                <input autoFocus type="text" className="form-control" id="nickname" value={this.state.nickname}
                  placeholder="What do you want to be called?" onChange={this.handleChange}
                  ref="nicknameInput" />
                <p id="errorMessage" className="help-block">{this.props.errorMessage}</p>
                <button type="submit" id="submitNicknameButton" className="btn btn-primary btn-lg">
                  Submit nickname
                </button>
              </div>
          </form>
        </div>
      </div>
    );
  }
});

const GameOver = React.createClass({
  propTypes: {
    gameInfo: React.PropTypes.object,
    playerInfo: React.PropTypes.object,
    startGame: React.PropTypes.func,
    errorMessage: React.PropTypes.string
  },
  getInitialState: function() {
    return {
      isLoading: false
    };
  },
  startGame: function() {
    this.setState({
      isLoading: true
    });
    this.props.startGame();
  },
  render: function() {
    /* Display scores in descending order */
    const scores = this.props.gameInfo.scores;
    let playersSorted = Object.keys(scores);
    playersSorted.sort((p1, p2) => (scores[p2] - scores[p1]));
    const highestScore = scores[playersSorted[0]];

    const scoreTable = playersSorted.map(
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

    let rematchButton = (<button
      type="button"
      id="rematchButton"
      className="btn btn-primary"
      onClick={this.startGame} >Again!</button>);
    if (this.state.isLoading && this.props.errorMessage == null) {
      rematchButton = (
        <button
          type="button"
          id="rematchButton"
          className="btn btn-primary"
          disabled
          onClick={this.startGame} >Loading...</button>
      );
    }

    return (
      <div className="jumbotron">
        <p>And we are done!</p>
        <ul id="scoreTable" className="list-unstyled">{scoreTable}</ul>
        {rematchButton}
        <p id="errorMessage" className={this.props.errorMessage ? "text-danger small" : "hidden"}>
          {this.props.errorMessage}
        </p>
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
          errorMessage: 'Cannot find game. Please check your game code.'
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
  leaveGame: function() {
    GameUtils.log('Leaving game');
    GameUtils.leaveGame(this.state.playerInfo.id, (err, gameInfo, playerInfo) => {
      if (err) {
        this.setState({
          errorMessage: 'Error leaving game.'
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
          errorMessage: err
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
  submitResponse: function(response) {
    GameUtils.log('Submitting response: ' + response);
    GameUtils.submitResponse(
      response,
      this.state.gameInfo.id,
      this.state.playerInfo.id,
      this.state.gameInfo.round,
      (err, gameInfo, playerInfo) => {
        if (err) {
          this.setState({
            errorMessage: 'Error submitting response. ' + err
          });
        } else {
          this.setState({
            gameInfo: gameInfo,
            playerInfo: playerInfo,
            errorMessage: null
          });
        }
      }
    );
  },
  chooseScenario: function(choiceID) {
    // Select your favorite response
    GameUtils.chooseScenario(
      choiceID,
      this.state.gameInfo.id,
      this.state.playerInfo.id,
      this.state.gameInfo.round,
      (err, gameInfo, playerInfo) => {
        if (err) {
          this.setState({
            errorMessage: 'Error submitting response. Please try again.'
          });
        } else {
          this.setState({
            gameInfo: gameInfo,
            playerInfo: playerInfo,
            errorMessage: null
          });
        }
      }
    );
  },
  pollGameInfo: function() {
    if (!this.state.gameInfo || !this.state.gameInfo.hasOwnProperty('id') ||
      !this.state.gameInfo.id || !this.state.playerInfo) {
      return;
    }
    GameUtils.getGameInfo(
      this.state.gameInfo.id,
      this.state.playerInfo.id,
      (err, gameInfo, playerInfo) => {
        if (err) {
          this.setState({
            errorMessage: err
          });
        } else {
          this.setState({
            gameInfo: gameInfo,
            playerInfo: playerInfo
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
  skipImage: function() {
    GameUtils.skipImage(
      this.state.gameInfo.id,
      this.state.playerInfo.id,
      (err, gameInfo, playerInfo) =>
        this.setState({
          errorMessage: err,
          gameInfo: gameInfo,
          playerInfo: playerInfo
        }));
  },
  nextRound: function() {
    GameUtils.nextRound(
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
  endGame: function() {
    GameUtils.endGame(
      this.state.gameInfo.id,
      this.state.playerInfo.id,
      (err, gameInfo, playerInfo) =>
        this.setState({
          errorMessage: err,
          gameInfo: gameInfo,
          playerInfo: playerInfo
        }));
  },
  componentDidMount: function() {
    this.pollGameInfo();
    setInterval(this.pollGameInfo, 1000);
  },
  render: function() {
    if (this.state.gameInfo === null) {
      return (
        <NewGame
          joinGame={this.joinGame}
          createGame={this.createGame}
          errorMessage={this.state.errorMessage} />
      );
    }
    if (this.state.playerInfo == null) {
      /* player hasn't been created */
      return (
        <NewPlayer createPlayer={this.createPlayer} errorMessage={this.state.errorMessage} />
      );
    }
    if (this.state.gameInfo.round !== null) {
      return (
        <div>
          <GameStatus
            round={this.state.gameInfo.round}
            score={this.state.playerInfo.score}
            nickname={this.state.playerInfo.nickname}
            gameCode={this.state.gameInfo.id}
            leaveGame={this.leaveGame} />
          <RoundInfo
            gameInfo={this.state.gameInfo}
            playerInfo={this.state.playerInfo}
            submitResponse={this.submitResponse}
            chooseScenario={this.chooseScenario}
            nextRound={this.nextRound}
            endGame={this.endGame}
            skipImage={this.skipImage} />
        </div>
      );
    }
    if (this.state.gameInfo.gameOver) {
      return (
        <GameOver
          gameInfo={this.state.gameInfo}
          playerInfo={this.state.playerInfo}
          startGame={this.startGame}
          errorMessage={this.state.errorMessage} />
      );
    }
    return (
      <WaitingToStart
        isHost={this.state.gameInfo.hostID == this.state.playerInfo.id}
        nPlayers={Object.keys(this.state.gameInfo.scores).length}
        startGame={this.startGame}
        gameID={this.state.gameInfo.id}
        errorMessage={this.state.errorMessage} />
    );

  }
});

ReactDOM.render(
  <div className="jumbotron">
    <Container />
  </div>,
  document.getElementById('container')
);
