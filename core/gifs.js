'use strict';

/* @flow */

const https = require('https');
const utils = require('./utils');

const POST_LIMIT = 10;
const HOSTNAME = 'www.reddit.com';
const PATH_BASE = '/r/reactiongifs/hot.json';

function linkIsGif(url: string): boolean {
  // Return whether the url ends in '.gif'
  const gifSuffix = '.gif';
  return (url.indexOf(gifSuffix, url.length - gifSuffix.length) > -1);
}

function filterPosts(posts: Array<{data: {url: string}}>): Array<string> {
  // Filter posts for gifs
  let filteredPosts = [];
  for (let i = 0; i < posts.length; i++ ) {
    if (linkIsGif(posts[i].data.url)) {
      filteredPosts.push(posts[i].data.url);
    }
  }
  return filteredPosts;
};

function fetchData(
  cb: (err: ?string, urls: Array<string>, lastPostRetrieved?: string) => void,
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

  const httpsOptions = {
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
        try {
          const parsedData = JSON.parse(data);
          const posts = parsedData.data.children;
          const lastPostRetrieved = parsedData.data.after;
          cb(null, filterPosts(posts), lastPostRetrieved);

        } catch (err) {

          if (data.indexOf('servers are busy right now')) {
            cb('Servers are busy. Please try again in a minute.', [], lastPostRetrieved);
          }
          cb('Error getting an image. Please try again in a minute.', [], lastPostRetrieved);

        }
      });
    }
  );
};

module.exports.getRandomGif = (
  cb: (err: ?string, url: ?string, lastPostRetrieved?: string) => void,
  lastPostRetrieved?: string
) => {
  fetchData(
    (err: ?string, posts: Array<string>, newLastPostRetrieved: string) => {
      // TODO Change to callback
      if (posts.length >= 1) {
        cb(null, utils.randItem(posts), newLastPostRetrieved);
      } else {
        // Try again
        fetchData((err, posts, newLastPostRetrieved) => {
          if (err) {
            cb(err, null, newLastPostRetrieved);
          } else if (posts.length >= 1) {
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
