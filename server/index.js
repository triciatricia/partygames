var server = require('./server');

var port = process.argv[2] || 8124;

console.log('Listening to port', port);

server.start(port);