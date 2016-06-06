"use strict";

var Consts = require('./consts');
var Sentences = require('./sentences');
var MongoHelper = require('./mongoHelper');
var HttpHelper = require('./httpHelper');
var userInfoCache = {};
var utils = {};

utils.isArray = function(arr) {
  return (arr instanceof Array);
}

utils.randomFromArray = function(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

utils.shuffleArray = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

utils.getCardImage = function(cardFromDeck, callback) {
  var cardImageUrl = Consts.CARDS_IMAGE_BASE_URL + cardFromDeck + ".png";
  callback(cardImageUrl);
}

utils.getSentence = function(sentenceKey) {
  if (typeof Sentences[sentenceKey] === "undefined") return "";
  if (typeof Sentences[sentenceKey] === "string") return Sentences[sentenceKey];
  return "";
}

utils.isNormalIntegerFromMinToMax = function(str, min, max) {
  // This will work only from 0 to 9 (min/max).
  var regExStr = "[" + min + "-" + max + "]";
  var bRegEx = (new RegExp(regExStr, "i")).test(str);
  console.log("Output of regex test: " + regExStr + " => " + bRegEx + " - for str: " + str);
  return bRegEx;
}

utils.getUserInfo = function(userId, callback) {
  if (typeof userInfoCache[userId] !== "undefined" &&
    typeof userInfoCache[userId].info !== "undefined" &&
    typeof userInfoCache[userId].info.first_name === "string" &&
    typeof userInfoCache[userId].info.last_name === "string" &&
    typeof userInfoCache[userId].info.gender === "string") {
    console.log("getUserInfo - Have the user info in the cache.");
    callback(userInfoCache[userId].info);
    return;
  }
  console.log("getUserInfo - Don't have the user info in the cache, getting it from Mongo.");
  MongoHelper.getUserInfoFromMongo(userId, function(mongoUserInfo) {
    if (typeof mongoUserInfo !== "undefined" &&
      mongoUserInfo.first_name &&
      mongoUserInfo.last_name &&
      mongoUserInfo.gender) {
      console.log("getUserInfo - Got the user info from Mongo.");
      userInfoCache[userId] = {};
      userInfoCache[userId].info = {};
      userInfoCache[userId].info = mongoUserInfo;
      callback(mongoUserInfo);
    } else {
      console.log("getUserInfo - Can't find the user info in the Mongo, calling the facebook API.");
      HttpHelper.httpGetJson(Consts.FACEBOOK_USER_PROFILE_API.replace("<USER_ID>", userId), function(fbUserInfo) {
        if (typeof fbUserInfo === "undefined") {
          console.log("getUserInfo - Can't get the user info from the facebook API.");
          callback(null);
        } else {
          console.log("getUserInfo - Got the user info from the facebook API.");
          fbUserInfo.user_id = userId;
          if (typeof userInfoCache[userId] === "undefined") {
            userInfoCache[userId] = {};
          }
          userInfoCache[userId].info = fbUserInfo;
          MongoHelper.insertUserInfoToMongo(fbUserInfo, callback);
        }
      });
    }
  });
}

module.exports = utils;