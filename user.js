"use strict";

var Consts = require('./consts');
var MongoHelper = require('./mongoHelper');
var HttpHelper = require('./httpHelper');
var Mixpanel = require('mixpanel');
var mixpanelInstance = Mixpanel.init(process.env.MIXPANEL_TOKEN);
var user = {};

user.getAndSetUsersFirstGame = function(userId, callback) {
	user.getUserInfo(userId, function(userInfo) {
		if(userInfo) {
			if (userInfo.userPlayed) {
				callback(false);
			} else {
				userInfo.userPlayed = true;
				user.setUserInfo(userInfo, function() {
					callback(true);
				});
			}
		} else {
			// Should not happen.
			callback(false);
		}
	});
}

user.getUserInfo = function(userId, callback) {
	MongoHelper.get({userId : userId}, Consts.MONGO_DB_USER_INFO_COL, function(docFound) {
		if (!docFound) {
			callback(null);
		} else {
			callback(docFound);
		}
	});
}

user.setUserInfo = function(userInfo, callback) {
	MongoHelper.upsert({userId : userInfo.userId}, userInfo, Consts.MONGO_DB_USER_INFO_COL, callback);
}

user.createUserInfo = function(userId, callback) {
	user.getUserInfo(userId, function(userInfo) {
		if (userInfo) {
			callback(false);
			return;
		}
		HttpHelper.getJson(Consts.FACEBOOK_USER_PROFILE_API.replace("<USER_ID>", userId), function(fbUserInfo) {
			if (!fbUserInfo) {
				console.error("createUserInfo - Can't get the user info from the facebook API.");
				callback(false);
			} else {
				var userInfo = {
					userId: userId,
					created: (new Date()).getTime(),
					createdStr: (new Date()).toString(),
					firstName: fbUserInfo.first_name,
					lastName: fbUserInfo.last_name,
					profilePic: fbUserInfo.profile_pic,
					locale: fbUserInfo.locale,
					timezone: fbUserInfo.timezone,
					gender: fbUserInfo.gender
				};
				user.setUserInfo(userInfo, function(res) {
					if (res) {
						mixpanelInstance.people.set(userInfo.userId, {
							$distinct_id: userInfo.userId,
							$first_name: userInfo.firstName,
							$last_name: userInfo.lastName,
							$created: userInfo.createdStr,
							$timezone: userInfo.timezone,
							profilePic: userInfo.profilePic,
							locale: userInfo.locale,
							gender: userInfo.gender,
							game_started: 0,
							total_bets: 0,
							total_won: 0,
							total_lost: 0,
							dealer_bust: 0,
							player_bust: 0,
							dealer_wins: 0,
							player_wins: 0,
							player_wins_with_blackjack: 0,
							draw: 0
						});
						mixpanelInstance.track('new_user', {
							$distinct_id: userInfo.userId,
							$created: userInfo.createdStr,
							$timezone: userInfo.timezone,
							locale: userInfo.locale,
							gender: userInfo.gender
						});
					}
					callback(res);
				});
			}
		});
	});
}

user.getUserBalance = function(userId, callback) {
	MongoHelper.get({userId : userId}, Consts.MONGO_DB_USER_BALANCE_COL, function(docFound) {
		if (!docFound) {
			MongoHelper.insert({userId: userId, balance: Consts.USER_INITIAL_BALANCE}, Consts.MONGO_DB_USER_BALANCE_COL, function() {
				callback(Consts.USER_INITIAL_BALANCE);
			});
		} else {
			callback(docFound.balance);
		}
	});
}

user.updateUserBalance = function(userId, balanceChange, callback) {
	user.getUserBalance(userId, function(balance) {
		balance += balanceChange;
		MongoHelper.upsert({userId : userId}, {userId: userId, balance: balance, lastChange: (new Date()).getTime()}, Consts.MONGO_DB_USER_BALANCE_COL, callback);
	});
}

user.setUserBalance = function(userId, newBalance, callback) {
	MongoHelper.upsert({userId : userId}, {userId: userId, balance: newBalance, lastChange: (new Date()).getTime()}, Consts.MONGO_DB_USER_BALANCE_COL, callback);
}

module.exports = user;