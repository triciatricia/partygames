'use strict';

/* @flow */

const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');
const utils = require('./utils');

const POST_LIMIT = 10;
const HOSTNAME = 'www.reddit.com';
const PATH_BASE = '/r/reactiongifs/hot.json';

function linkIsGif(url: string): boolean {
  // Return whether the url ends in '.gif'
  return url.toLowerCase().endsWith('.gif');
}

function linkIsMp4(url: string): boolean {
  // Return whether the url ends in '.mp4'
  return url.toLowerCase().endsWith('.mp4');
}

function linkIsGifv(url: string): boolean {
  // Return whether the url ends in '.gifv'
  return url.toLowerCase().endsWith('.gifv');
}

async function vidFromGifvAsync(url: string): Promise<string> {
  // Get the video link from a gifv
  const dom = await JSDOM.fromURL(url);
  const sources = dom.window.document.querySelectorAll('source[type="video/mp4"]');

  if (sources.length === 1 &&
    sources[0].hasAttribute('src') &&
    linkIsMp4(sources[0].src)) {

    return sources[0].src;

  } else {

    console.log('error extracting video url from gifv');
    throw new Error('Error extracting video url from gifv');

  }
}

async function filterPostsAsync(posts: Array<{data: {url: string}}>): Promise<Array<string>> {
  // Filter posts for gifs (only use videos because they have smaller file sizes)
  let filteredPosts = [];
  for (let i = 0; i < posts.length; i++) {
    if (linkIsMp4(posts[i].data.url)) {

      filteredPosts.push(posts[i].data.url);

    } else if (linkIsGifv(posts[i].data.url)) {

      try {
        const vidUrl = await vidFromGifvAsync(posts[i].data.url);
        filteredPosts.push(vidUrl);
      } catch (error) {
        // Do nothing
        console.log(error);
      }

    }
  }
  return filteredPosts;
};

function fetchData(
  cb: (err: ?string, urls: Array<string>, lastPostRetrieved?: ?string) => void,
  lastPostRetrieved?: ?string
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
          filterPostsAsync(posts).then(filteredPosts => {
            cb(null, filteredPosts, lastPostRetrieved);
          });

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

export const getGifsAsync = (
  lastPostRetrieved: ?string
): Promise<[Array<string>, ?string]> => {
  return new Promise((resolve, reject) => {
    fetchData(
      (err: ?string, posts: Array<string>, newLastPostRetrieved: ?string) => {
        if (posts.length >= 1) {
          resolve([posts, newLastPostRetrieved]);
        } else {
          // Try again
          fetchData((err, posts, newLastPostRetrieved) => {
            if (err) {
              reject(err);
            } else if (posts.length >= 1) {
              resolve([posts, newLastPostRetrieved]);
            } else {
              // If no suitable gif is found, return the default.
              resolve([['http://i.imgur.com/rxkWqmt.gif'], newLastPostRetrieved]);
            }
          }, newLastPostRetrieved);
        }
      },
      lastPostRetrieved
    );
  });
};

module.exports.fetchData = fetchData;
