"use strict";

var Consts = require('./consts');
var Sentences = require('./sentences');
var MongoHelper = require('./mongoHelper');
var HttpHelper = require('./httpHelper');
var Deck = require('./deck');
var userInfoCache = {};
var utils = {};

utils.getCardImage = function(cardFromDeck, callback) {
  var cardImageUrl = Consts.CARDS_IMAGE_BASE_URL + cardFromDeck + ".png";
  callback(cardImageUrl);
}

utils.getUserLang = function(userId) {
  if (userInfoCache[userId] && userInfoCache[userId].lang) {
    return userInfoCache[userId].lang;
  } else {
    return "";
  }
}

utils.setUserLang = function(userId, lang) {
  if (typeof userInfoCache[userId] === "undefined") {
    userInfoCache[userId] = {};
  }
  userInfoCache[userId].lang = lang;
}

utils.getSentence = function(sentenceKey) {
  if (typeof Sentences[sentenceKey] === "undefined") return "";
  if (typeof Sentences[sentenceKey] === "string") return Sentences[sentenceKey];
  return "";
}

utils.getLatLonFromAddress = function(address, callback) {
  console.log("Finding lat and lon for address: " + address);
  var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + address;
  url += "&key=" + process.env.GOOGLE_API_KEY;
  HttpHelper.httpGetJson(url, function(jsonResponse) {
    console.log("" + jsonResponse);
    console.log("" + jsonResponse.status);
    console.log("" + jsonResponse.results);
    console.log("" + jsonResponse.results.length);
    console.log("" + jsonResponse.results[0].geometry);
    console.log("" + jsonResponse.results[0].geometry.location);
    if (jsonResponse &&
      jsonResponse.status &&
      jsonResponse.status == "OK" &&
      jsonResponse.results &&
      jsonResponse.results.length > 0 &&
      jsonResponse.results[0].geometry &&
      jsonResponse.results[0].geometry.location &&
      jsonResponse.results[0].geometry.location.lat &&
      jsonResponse.results[0].geometry.location.lng) {
      var lat = jsonResponse.results[0].geometry.location.lat;
      var lng = jsonResponse.results[0].geometry.location.lng;
      console.log("Found lat and long from address: " + lat + "," + lng)
      callback(lat, lng);
    } else {
      callback(null, null);
    }
  });
}

utils.isUserRequestedToStop = function(userText) {
  if (typeof userText !== "string") return false;
  var bStop = (Sentences.user_requested_to_stop.indexOf(userText) != -1);
  if (bStop) {
    console.log("User requested to stop: " + userText);
  }
  return bStop;
}

utils.isNormalIntegerFromMinToMax = function(str, min, max) {
  // This will work only from 0 to 9 (min/max).
  var regExStr = "[" + min + "-" + max + "]";
  var bRegEx = (new RegExp(regExStr, "i")).test(str);
  console.log("Output of regex test: " + regExStr + " => " + bRegEx + " - for str: " + str);
  return bRegEx;
}

utils.getTimeDbNameFromText = function(userText) {
  console.log("getTimeDbNameFromText - " + userText);
  if (utils.isNormalIntegerFromMinToMax(userText, 1, Consts.TIMES.length)) {
    return Consts.TIMES[parseInt(userText) - 1].db_name;
  }
  for(var i = 0; i < Consts.TIMES.length; i++) {
    var time = Consts.TIMES[i];
    console.log("getTimeDbNameFromText: " + JSON.stringify(time));
    if (time.title_en == userText ||
      time.title == userText ||
      time.payload == userText) {
      return time.db_name;
    }
  }
  console.log("getTimeDbNameFromText - could not find user text: " + userText);
  return Consts.INVALID_NUM;
}

utils.getCategoryDbNameFromText = function(userText) {
  console.log("getCategoryDbNameFromText - " + userText);
  if (utils.isNormalIntegerFromMinToMax(userText, 1, Consts.CATEGORIES.length)) {
    return Consts.CATEGORIES[parseInt(userText) - 1].db_name;
  }
  for(var i = 0; i < Consts.CATEGORIES.length; i++) {
    var cat = Consts.CATEGORIES[i];
    if (cat.title_en == userText ||
      cat.title == userText ||
      cat.payload == userText) {
      return cat.db_name;
    }
  }
  console.log("getCategoryDbNameFromText - could not find user text: " + userText);
  return "";
}

// Compute the edit distance between the two given strings
// Taken from: https://gist.github.com/andrei-m/982927
utils.getEditDistance = function(a, b) {
  if(a.length == 0) return b.length;
  if(b.length == 0) return a.length;
  var matrix = [];
  // increment along the first column of each row
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }
  // increment each column in the first row
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }
  // Fill in the rest of the matrix
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) == a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                       Math.min(matrix[i][j-1] + 1, // insertion
                       matrix[i-1][j] + 1)); // deletion
      }
    }
  }
  return matrix[b.length][a.length];
};

utils.changeDateFormat = function(str) {
  // "10/06/2016 22:00" -> "06/10/2016 22:00"
  var date = str.split(" ")[0];
  var hour = str.split(" ")[1];
  var date_new_format = date.split("/")[1] + "/" + date.split("/")[0] + "/" + date.split("/")[2];
  return date_new_format + " " + hour;
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
          userInfoCache[userId].info = fbUserInfo;
          MongoHelper.insertUserInfoToMongo(fbUserInfo, callback);
        }
      });
    }
  });
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

module.exports = utils;