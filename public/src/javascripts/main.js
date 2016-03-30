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
      <div className='radio'>
        <label><input type='radio' name='scenario'/>{this.props.choice}</label>
      </div>
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
    return (<form>
        <label>{this.props.reactorNickname}'s response when:</label>
        {reactionChoices}
        <button type="submit" className="btn btn-default">Submit</button>
      </form>);
  }
});

var ResponseForm = React.createClass({
  propTypes: {
    instructions: React.PropTypes.string,
    gameInfo: React.PropTypes.object,
    playerInfo: React.PropTypes.object
  },
  render: function() {
    if (this.props.gameInfo.waitingForScenarios) {
      return (<div></div>);
    } else if (this.props.gameInfo.waitingForReactor){
      if (this.props.playerInfo.id == this.props.gameInfo.reactorID) {
        return (
          <div>
            <p>{this.props.instructions}</p>
            <ScenarioList
            choices={this.props.gameInfo.choices}
            reactorNickname={this.props.gameInfo.reactorNickname} />
          </div>);
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
      <div className='row'>
        <div className='col-md-6'>
          <ReactionImage
            image={this.props.gameInfo.image} />
        </div>
        <div className='col-md-6'>
          <ResponseForm
            instructions={GameUtils.getInstructions(this.props.gameInfo,
                                                    this.props.playerInfo)}
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
