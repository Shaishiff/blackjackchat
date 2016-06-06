"use strict";

var Consts = require('./consts');
var Utils = require('./utils');
var deck = {};
var cardsDealt = {};

deck.cardToString = function(card) {
	return "" + card.suit + "_" + card.rank;
}

var createRandomCard = function(cardsDealtForThisGame) {
	var randomSuit = Utils.randomFromArray(Consts.DECK_SUITS);
	var randomRank = Utils.randomFromArray(Consts.DECK_RANKS);
	var randomCard = {
		suit: randomSuit,
		rank: randomRank
	};
	if (typeof cardsDealtForThisGame[randomCard.suit] === "undefined") {
		cardsDealtForThisGame[randomCard.suit] = {};
	}
	if (typeof cardsDealtForThisGame[randomCard.suit][randomCard.rank] === "undefined") {
		cardsDealtForThisGame[randomCard.suit][randomCard.rank] = 0;
	}
	if (cardsDealtForThisGame[randomCard.suit][randomCard.rank] === Consts.NUMBER_OF_DECKS) {
		// This card has already being dealt too many times.
		return createRandomCard(cardsDealtForThisGame);
	} else {
		// New card which can be dealt.
		cardsDealtForThisGame[randomCard.suit][randomCard.rank]++;
		return randomCard;
	}
}

var getCardsDealt = function(userId, callback) {
	if (typeof cardsDealt[userId] === "undefined") {
		cardsDealt[userId] = {};
		cardsDealt[userId].userId = userId;
	}
	callback(cardsDealt[userId]);
}

var addCardWhichWasDealt = function(cardsDealt, callback) {
	callback();
}

deck.getCard = function(userId, callback) {
	getCardsDealt(userId, function(cardsDealt) {
		var newCard = createRandomCard(cardsDealt);
		console.log("New card to be dealt: " + deck.cardToString(newCard));
		addCardWhichWasDealt(cardsDealt, function() {
			callback(newCard);
		});
	});
}

module.exports = deck;