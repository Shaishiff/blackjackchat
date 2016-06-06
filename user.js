"use strict";

var Consts = require('./consts');
var user = {};
var userData = {};

user.getUserBalance = function(userId, callback) {
	if (typeof userData[userId] === "undefined") {
		userData[userId] = {};
	}
	if (typeof userData[userId].balance === "undefined") {
		userData[userId].balance = Const.USER_INITIAL_BALANCE;
	}
	callback(userData[userId].balance);
}

user.updateUserBalance = function(userId, balanceChange, callback) {
	user.getUserBalance(userId, function(){
		userData[userId].balance += balanceChange;
		callback(userData[userId].balance);
	});
}

module.exports = user;