/* @flow */
/* TODO:
  Fill in ResponseForm for alternate situations
  Add missing parts.
  Also fill in instructions.
  */

var React = require('react');
var ReactDOM = require('react-dom');
var GameUtils = require('./game-utils');

var GameStatus = React.createClass({
  propTypes: {
    round: React.PropTypes.number,
    score: React.PropTypes.number
  },
  render: function() {
    return (
      <div>
        Round: {this.props.round}
        <br />
        Score: {this.props.score}
      </div>
    );
  }
});

var Instructions = React.createClass({
  propTypes: {
    instructions: React.PropTypes.string,
    image: React.PropTypes.string
  },
  render: function() {
    return (
      <div>
        <p>{this.props.instructions}</p>
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
      <li>{this.props.choice}</li>
    );
  }
});

var ScenarioList = React.createClass({
  propTypes: {
    choices: React.PropTypes.array,
    reactorNickname: React.PropTypes.string
  },
  render: function() {
    var reactionChoices = [];
    for (var i = 0; i < this.props.choices.length; ++i) {
      reactionChoices.push(<ReactionChoice
        choice={this.props.choices[i]}
        key={i} />);
    }
    return (<div>
      <p>{this.props.reactorNickname}'s response when:</p>
      <ol type="A">{reactionChoices}</ol>
      </div>);
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
    } else if (this.props.gameInfo.waitingForReactor){
      if (this.props.playerInfo.id == this.props.gameInfo.reactorID) {
        return (<ScenarioList
          choices={this.props.gameInfo.choices}
          reactorNickname={this.props.gameInfo.reactorNickname} />);
      }
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
      <div>
        <Instructions
          instructions={GameUtils.getInstructions(this.props.gameInfo,
                                                  this.props.playerInfo)}
          image={this.props.gameInfo.image} />
        <ResponseForm
          gameInfo={this.props.gameInfo}
          playerInfo={this.props.playerInfo} />
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

var gameInfo = {
  id: 2,
  round: 2,
  image: 'http://i.imgur.com/rxkWqmt.gif',
  choices: ['he smells banana', 'he is released into the backyard',
    'he is jumping off the couch'],
  waitingForScenarios: false,
  waitingForReactor: true,
  reactorID: 3,
  reactorNickname: 'Cinna'
};

var playerInfo = {
  id: 3,
  nickname: 'Cinna',
  response: null,
  score: 1,
  game: 2
};

ReactDOM.render(
  <Container gameInfo={gameInfo} playerInfo={playerInfo} />,
  document.getElementById('container')
);
