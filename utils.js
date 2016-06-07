"use strict";

var Consts = require('./consts');
var Sentences = require('./sentences');
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

module.exports = utils;