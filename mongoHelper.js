"use strict";

var Consts = require('./consts');
var MongoClient = require('mongodb').MongoClient;
var mongoHelper = {};

var insertIntoMongo = function(docToInsert, collection, callback) {
	MongoClient.connect(Consts.MONGO_DB_URL, function(errConnect, db) {
		if(errConnect) {
			console.error("insertIntoMongo - Could not connect to server with error: " + errConnect);
			callback(false);
			return;
		}
		db.collection(collection).insertOne(docToInsert, function(errInsert, r) {
			db.close();
			if(!errInsert) {
				console.error("insertIntoMongo - Insert complete with error: " + errInsert);
				callback(false);
				return;
			}
			callback(true);
		});
	});
}

var upsertIntoMongo = function(docToFind, docToUpsert, collection, callback) {
	MongoClient.connect(Consts.MONGO_DB_URL, function(errConnect, db) {
		if(errConnect) {
			console.error("upsertIntoMongo - Could not connect to server with error: " + errConnect);
			callback(false);
			return;
		}
		db.collection(collection).update(docToInsert, docToUpsert, {upsert: true}, function(errUpsert, r) {
			db.close();
			if(!errUpsert) {
				console.error("upsertIntoMongo - Upsert complete with error: " + errUpsert);
				callback(false);
				return;
			}
			callback(true);
		});
	});
}

var getFromMongo = function(docToFind, collection, callback) {
	MongoClient.connect(Consts.MONGO_DB_URL, function(errConnect, db) {
		if(errConnect) {
			console.error("getFromMongo - Could not connect to server with error: " + errConnect);
			callback();
			return;
		}
		db.collection(collection).find(docToFind).limit(1).toArray(function(errFind, docs) {
			db.close();
			if (docs instanceof Array && docs.length == 1) {
				console.log("getFromMongo - Found the document: " + JSON.stringify(docs[0]));
				callback(docs[0]);
			} else {
				console.log("getFromMongo - Could not find the document: " + errFind);
				callback();
			}
		});
	});
}

mongoHelper.insertUserInfoToMongo = function(userInfo, callback) {
	insertIntoMongo(userInfo, Consts.MONGO_DB_USER_INFO_COL, callback);
}

mongoHelper.getUserInfoFromMongo = function(userId, callback) {
 	getFromMongo({user_id : userId}, Consts.MONGO_DB_USER_INFO_COL, callback);
}

mongoHelper.upsertUserInfoToMongo = function(userId, userInfo, callback) {
	upsertIntoMongo({user_id : userId}, userInfo, Consts.MONGO_DB_USER_INFO_COL, callback);
}

module.exports = mongoHelper;
