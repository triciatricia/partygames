'use strict';

var https = require('https');
var utils = require('./utils');

const POST_LIMIT = 10;
const HOSTNAME = 'www.reddit.com';
const PATH_BASE = '/r/reactiongifs/hot.json';

function linkIsGif(url) {
  // Return whether the url ends in '.gif'
  var gifSuffix = '.gif';
  return (url.indexOf(gifSuffix, url.length - gifSuffix.length) > -1);
}

let filterPosts = (posts) => {
  // Filter posts for gifs
  var filteredPosts = [];
  for (var i = 0; i < posts.length; i++ ) {
    if (linkIsGif(posts[i].data.url)) {
      filteredPosts.push(posts[i].data.url);
    }
  }
  return filteredPosts;
};

let fetchData = (cb, lastPostRetrieved) => {
  // Grab some gif urls from reddit
  // cb(urls, ID of lastPostRetrieved)
  // TODO Check for error
  let path = PATH_BASE + '?limit=' + POST_LIMIT.toString();
  if (lastPostRetrieved) {
    path += ('&after=' + lastPostRetrieved);
  }

  console.log('Retrieving reddit links from ' + HOSTNAME + path);

  let httpsOptions = {
    hostname: HOSTNAME,
    path: path
  };

  https.get(
    httpsOptions,
    (res) => {
      var data = '';
      res.on('data', (d) => {
        data += d;
      });
      res.on('end', () => {
        data = JSON.parse(data);
        let posts = data.data.children;
        let lastPostRetrieved = data.data.after;
        cb(filterPosts(posts), lastPostRetrieved);
      });
    }
  );
};

module.exports.getRandomGif = (cb) => {
  fetchData((posts) => {
    // TODO Change to callback
    if(posts.length >= 1) {
      cb(utils.randItem(posts));
    } else {
      // Try again
      fetchData((posts) => {
        if(posts.length >= 1) {
          cb(utils.randItem(posts));
        } else {
          // If no suitable gif is found, return the default.
          cb('http://i.imgur.com/rxkWqmt.gif');
        }
      });
    }
  });
};

module.exports.fetchData = fetchData;
