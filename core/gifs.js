'use strict';

/* @flow */

var https = require('https');
var utils = require('./utils');

const POST_LIMIT = 10;
const HOSTNAME = 'www.reddit.com';
const PATH_BASE = '/r/reactiongifs/hot.json';

function linkIsGif(url: string): boolean {
  // Return whether the url ends in '.gif'
  var gifSuffix = '.gif';
  return (url.indexOf(gifSuffix, url.length - gifSuffix.length) > -1);
}

function filterPosts(posts: Array<{data: {url: string}}>): Array<string> {
  // Filter posts for gifs
  var filteredPosts = [];
  for (var i = 0; i < posts.length; i++ ) {
    if (linkIsGif(posts[i].data.url)) {
      filteredPosts.push(posts[i].data.url);
    }
  }
  return filteredPosts;
};

function fetchData(
  cb: (urls: Array<string>, lastPostRetrieved: string) => void,
  lastPostRetrieved?: string
): void {
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
      let data = '';
      res.on('data', (d: string) => {
        data += d;
      });
      res.on('end', () => {
        let parsedData = JSON.parse(data);
        let posts = parsedData.data.children;
        let lastPostRetrieved = parsedData.data.after;
        cb(filterPosts(posts), lastPostRetrieved);
      });
    }
  );
};

module.exports.getRandomGif = (
  cb: (err: ?string, url: string, lastPostRetrieved: string) => void,
  lastPostRetrieved?: string
) => {
  fetchData(
    (posts: Array<string>, newLastPostRetrieved: string) => {
      // TODO Change to callback
      if(posts.length >= 1) {
        cb(null, utils.randItem(posts), newLastPostRetrieved);
      } else {
        // Try again
        fetchData((posts, newLastPostRetrieved) => {
          if(posts.length >= 1) {
            cb(null, utils.randItem(posts), newLastPostRetrieved);
          } else {
            // If no suitable gif is found, return the default.
            cb(null, 'http://i.imgur.com/rxkWqmt.gif', newLastPostRetrieved);
          }
        }, newLastPostRetrieved);
      }
    },
    lastPostRetrieved
  );
};

module.exports.fetchData = fetchData;
