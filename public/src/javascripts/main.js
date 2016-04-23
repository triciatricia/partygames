/* @flow */
/* TODO:
  Fill in ResponseForm for alternate situations
  Add missing parts.
  Also fill in instructions.
  */

var React = require('react');
var ReactDOM = require('react-dom');
var GameUtils = require('./game-utils');
var SampleGameScenarios = require('./sample-game-scenarios');

var GameStatus = React.createClass({
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

var ReactionImage = React.createClass({
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

var ReactionChoice = React.createClass({
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

var ReactionScenario = React.createClass({
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
    } else {
      return (
        <div>
          <p className="scenario">
            {this.props.choice}
          </p>
        </div>
      );
    }
  }
});

var ScenarioList = React.createClass({
  propTypes: {
    choices: React.PropTypes.arrayOf(React.PropTypes.string),
    reactorNickname: React.PropTypes.string,
    winningResponse: React.PropTypes.number,
    winningResponseSubmittedBy: React.PropTypes.string
  },
  render: function() {
    var scenarios = [];
    var button;
    if (this.props.winningResponse) {
      /* winning response has already been decided */
      for (var i = 0; i < this.props.choices.length; ++i) {
        var submittedBy;
        if (i == this.props.winningResponse) {
          submittedBy = this.props.winningResponseSubmittedBy;
        }
        scenarios.push(<ReactionScenario
          choice={this.props.choices[i]}
          key={i}
          wasChosen={i == this.props.winningResponse}
          submittedBy={submittedBy} />);
      }
      button = <button type="submit" className="btn btn-default">Next</button>;
    } else {
      for (var j = 0; j < this.props.choices.length; ++j) {
        scenarios.push(<ReactionChoice
          choice={this.props.choices[j]}
          key={j} />);
      }
      button = <button type="submit" className="btn btn-default">Submit</button>;
    }
    return (<form>
        <label>{this.props.reactorNickname}'s response when:</label>
        {scenarios}
        {button}
      </form>);
  }
});

var ResponseForm = React.createClass({
  propTypes: {
    gameInfo: React.PropTypes.object,
    playerInfo: React.PropTypes.object
  },
  render: function() {
    if (this.props.gameInfo.waitingForScenarios) {
      return (<div></div>);
    } else if (this.props.playerInfo.id == this.props.gameInfo.reactorID) {
      return (
        <div>
          <p>{GameUtils.getInstructions(this.props.gameInfo,
                                        this.props.playerInfo)}</p>
          <ScenarioList
          choices={this.props.gameInfo.choices}
          reactorNickname={this.props.gameInfo.reactorNickname}
          winningResponse={this.props.gameInfo.winningResponse}
          winningResponseSubmittedBy={this.props.gameInfo.winningResponseSubmittedBy} />
        </div>);
    } else {
      return (<div></div>);
    }
  }
});

var RoundInfo = React.createClass({
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

var Container = React.createClass({
  propTypes: {
    gameInfo: React.PropTypes.object,
    playerInfo: React.PropTypes.object
  },
  render: function() {
    return (
      <div>
        <GameStatus
          round={this.props.gameInfo.round}
          score={this.props.playerInfo.score}/>
        <RoundInfo
          gameInfo={this.props.gameInfo}
          playerInfo={this.props.playerInfo}/>
      </div>
    );
  }
});

var gameInfo = SampleGameScenarios.scenarios[1].gameInfo;
var playerInfo = SampleGameScenarios.scenarios[1].playerInfo;

ReactDOM.render(
  <Container gameInfo={gameInfo} playerInfo={playerInfo} />,
  document.getElementById('container')
);
