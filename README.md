partygames
=========

Games to play at parties. Instead of staring at your phone, you can interact with others while staring at your phone.

## Webserver setup

* Install nginx and proxy requests to node: http://cuppster.com/2011/05/12/diy-node-js-server-on-amazon-ec2/. Add the following to /etc/nginx/sites-enabled/default:

  ```
  location /api/ {
      proxy_pass http://127.0.0.1:8124/;
  }
  ```
* When you want to run the API server with node, `cd` to `server/` and run `node index.js 8124` (the port you chose above)

## Unit tests

* Install jasmine-node: https://github.com/mhevery/jasmine-node
* Add tests to `__tests__` folders
* Run `find . -name __tests__ | xargs jasmine-node --matchall` to run all tests in that directory (recursively)
