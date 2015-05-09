var http = require('http');
var url = require('url');

function requestHandler(request, response) {
  var pathname = url.parse(request.url).pathname;

  console.log('Request', url.parse(request.url, true));

  response.writeHead(200, {'Content-Type': 'text/html'});
  response.write('<p>Request path: ' + pathname + '</p>');
  response.write('<p>Request method: ' + request.method + '</p>');
  response.write('<form action="/root" method="post"><input type="submit" value="go" /></form>');
  response.end();
}

/**
 * @param {number} port
 */
function start(port) {
  http.createServer(requestHandler).listen(port);
}

exports.start = start;
