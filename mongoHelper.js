"use strict";

var Consts = require('./consts');
var MongoClient = require('mongodb').MongoClient;
var mongoHelper = {};

mongoHelper.insert = function(docToInsert, collection, callback) {
	MongoClient.connect(Consts.MONGO_DB_URL, function(errConnect, db) {
		if(errConnect) {
			console.error("insertIntoMongo - Could not connect to server with error: " + errConnect);
			callback(false);
			return;
		}
		db.collection(collection).insertOne(docToInsert, function(errInsert, r) {
			db.close();
			if(errInsert) {
				console.error("insertIntoMongo - error: " + errInsert);
				callback(false);
				return;
			}
			callback(true);
		});
	});
}

mongoHelper.upsert = function(docToFind, docToUpsert, collection, callback) {
	MongoClient.connect(Consts.MONGO_DB_URL, function(errConnect, db) {
		if(errConnect) {
			console.error("upsertIntoMongo - Could not connect to server with error: " + errConnect);
			callback(false);
			return;
		}
		db.collection(collection).update(docToFind, docToUpsert, {upsert: true}, function(errUpsert, r) {
			db.close();
			if(errUpsert) {
				console.error("upsertIntoMongo - error: " + errUpsert);
				callback(false);
				return;
			}
			callback(true);
		});
	});
}

mongoHelper.get = function(docToFind, collection, callback) {
	MongoClient.connect(Consts.MONGO_DB_URL, function(errConnect, db) {
		if(errConnect) {
			console.error("getFromMongo - Could not connect to server with error: " + errConnect);
			callback(null);
			return;
		}
		db.collection(collection).find(docToFind).limit(1).toArray(function(errFind, docs) {
			db.close();
			if (docs instanceof Array && docs.length == 1) {
				//console.log("getFromMongo - Found the document: " + JSON.stringify(docs[0]));
				callback(docs[0]);
			} else {
				console.log("getFromMongo - Could not find the document: " + errFind);
				callback(null);
			}
		});
	});
}

mongoHelper.getMultiple = function(docToFind, collection, callback) {
	MongoClient.connect(Consts.MONGO_DB_URL, function(errConnect, db) {
		if(errConnect) {
			console.error("getMultiple - Could not connect to server with error: " + errConnect);
			callback(null);
			return;
		}
		db.collection(collection).find(docToFind).limit(1).toArray(function(errFind, docs) {
			db.close();
			if (docs instanceof Array && docs.length >= 1) {
				callback(docs);
			} else {
				console.log("getMultiple - Could not find the document: " + errFind);
				callback(null);
			}
		});
	});
}

mongoHelper.delete = function(docToFind, collection, callback) {
	MongoClient.connect(Consts.MONGO_DB_URL, function(errConnect, db) {
		if(errConnect) {
			console.error("deleteFromMongo - Could not connect to server with error: " + errConnect);
			callback(false);
			return;
		}
		db.collection(collection).deleteMany(docToFind, function(err, results) {
			db.close();
			if (err) {
				console.log("deleteFromMongo - err: " + err);
				callback(false);
			} else {
				callback(true);
			}
		});
	});
}

module.exports = mongoHelper;
