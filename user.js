"use strict";

var Consts = require('./consts');
var MongoHelper = require('./mongoHelper');
var user = {};

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
		MongoHelper.upsert({userId : userId}, {userId: userId, balance: balance}, Consts.MONGO_DB_USER_BALANCE_COL, callback);
	});
}

module.exports = user;