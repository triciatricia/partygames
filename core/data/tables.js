/**
 * Table names and unique ID column names.
 */

 const Tables = {
 	game: {
 		tableName: 'games',
 		gameIDName: 'ID',
 	},
 	users: {
 		tableName: 'users',
 		userIDName: 'ID',
 	},
 	usergame: {
 		tableName: 'usergame',
 	},
  images: {
    tableName: 'images',
  },
  gameimage: {
    tableName: 'gameimage',
  }
 };

 module.exports = Tables;
