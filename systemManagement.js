"use strict";

var Consts = require('./consts');
var MongoHelper = require('./mongoHelper');
var View = require('./view');
var User = require('./user');
var Game = require('./game');
var systemManagement = {};
var bot = null;

var addBalanceToUsers = function() {
	console.log("addBalanceToUsers");
	MongoHelper.get({}, Consts.MONGO_DB_SYSTEM_MANAGEMENT_COL, function(systemData) {
		if (!systemData) {
			systemData = {};
		}
		if (typeof systemData.lastBalanceUpdate !== "number") {
			systemData.lastBalanceUpdate = (new Date()).getTime();
		}
		MongoHelper.upsert({}, systemData, Consts.MONGO_DB_SYSTEM_MANAGEMENT_COL, function() {
			if ((new Date()).getTime() - systemData.lastBalanceUpdate >= Consts.INTERVAL_TO_REST_TO_MIN_BALANCE) {
				systemData.lastBalanceUpdate = (new Date()).getTime();
				MongoHelper.upsert({}, systemData, Consts.MONGO_DB_SYSTEM_MANAGEMENT_COL, function() {
					var docToFind;
					MongoHelper.getMultiple({ balance: { $lt: Consts.USER_MIN_BALANCE } }, Consts.MONGO_DB_USER_BALANCE_COL, function(docs) {
						if(docs) {
							for(var i=0; i < docs.length; i++) {
								(function(){
									var curDoc = docs[i];
									console.log(JSON.stringify(curDoc));
									User.setUserBalance(curDoc.userId, Consts.USER_MIN_BALANCE, function(res) {
										if (res) {
											var message = {channel: curDoc.userId};
											View.showUserBalanceHasBeenResetToMin(bot, message, Consts.USER_MIN_BALANCE);
										}
									});
								}());
							}
						}
					});
				});
			}
		});
	});
}

 var clearOldGames = function() {
 	console.log("clearOldGames");
	Game.getOldGamesData(Consts.TIME_FOR_GAME_TO_BE_CLOSED, function(docs) {
 		if(docs) {
 			for(var i=0; i < docs.length; i++) {
 				(function(){
 					var curDoc = docs[i];
 					console.log(JSON.stringify(curDoc));
 					var message = {channel: curDoc.userId};
 					Game.handleForfeitByTimeout(bot, message, curDoc, View.showNextMove);
 				}());
 			}
 		}
	});
}

systemManagement.init = function(botInstance) {
	bot = botInstance;
	setInterval(addBalanceToUsers, 1000*60);
	setInterval(clearOldGames, 1000*10);
}

module.exports = systemManagement;