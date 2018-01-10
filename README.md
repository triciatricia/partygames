#My Reaction When <img src='public/build/images/mrw_face_small.png' align='right' alt='logo' />

_A multiplayer party game with gifs!_

This repository holds the code for the back end and web application.

More information can be found in the [Github repo for the native mobile app](https://github.com/triciatricia/mrw-app).

### To run the server
Make sure you have these software:
- [Node.js](https://nodejs.org)
- [MySQL](https://www.mysql.com/) (or [MariaDB](https://mariadb.org/))
- [Babel](https://babeljs.io/) + [Gulp](https://gulpjs.com/) to transform the JavaScript
- [Selenium Standalone Server](http://www.seleniumhq.org/download/) if you want to run the integration tests

Make the database (`mysql -u root -p < spec/schema.sql`) and create a `local_conf.js` file to specify database login settings (see `local_conf_example.js` for an example).

Type `npm install` to install the node modules.

Type `gulp` to transform the JavaScript.

Type `npm start` to start the server.

#### Testing

Type `npm test` to run the unit tests using Jasmine.

End to end integration tests: Start the Selenium server (ie: `java -jar selenium-server-standalone-3.0.1.jar`). Run tests by typing `./node_modules/.bin/wdio wdio.conf.js`.
