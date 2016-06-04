"use strict";

var deck = {};

deck.getCard = function(userId, callback) {
	// TODO: implement logic to get next card from this specific user's deck.
	callback({
		suit: "H",
		rank: 7
	});
}

module.exports = deck;