"use strict";

var Consts = require('./consts');
var MongoHelper = require('./mongoHelper');
var View = require('./view');
var Utils = require('./utils');
var game = {};

var getGameData = function(userId, callback) {
	MongoHelper.get({userId : userId}, Consts.MONGO_DB_GAME_INFO_COL, callback);
}

var setGameData = function(gameData, callback) {
	MongoHelper.upsert({userId : gameData.userId}, gameData, Consts.MONGO_DB_GAME_INFO_COL, callback);
}

var decideOnNextMove = function(gameData) {
	console.log("decideOnNextMove");
	if (gameData[Consts.SIDES.player].cards.length < 2) {
		console.log("Deal the player a card since he has less than 2 cards");
		return Consts.GAME_NEXT_MOVE.player_card;
	} else if (gameData[Consts.SIDES.dealer].cards.length < 1) {
		console.log("Deal the dealer a card since he has less than 1 card");
		return Consts.GAME_NEXT_MOVE.dealer_card;
	} else if (gameData.state === Consts.GAME_STATE.ongoing) {
		console.log("Ask the player if he wants to hit or stay");
		return Consts.GAME_NEXT_MOVE.ask_player;
	} else if (gameData.state === Consts.GAME_STATE.finished) {
		console.log("Game is over");
		return Consts.GAME_NEXT_MOVE.game_over;
	} else if (gameData.state === Consts.GAME_STATE.player_hold) {
		console.log("Player has hold, it's the dealers turn");
		return Consts.GAME_NEXT_MOVE.dealer_card;
	} else {
		// This should not happen.
		console.error("decideOnNextMove - we should not reach this !");
	}
}

var addCard = function(gameData, newCard, side, callback) {
	gameData[side].cards.push(newCard);
	gameData[side].sum = 0;
	var numberOfAces = 0;
	for (var i = 0; i < gameData[side].cards.length; i++) {
		gameData[side].sum += (gameData[side].cards[i].rank === 14 ? 11 : (gameData[side].cards[i].rank > 10 ? 10 : gameData[side].cards[i].rank));
		if (gameData[side].cards[i].rank === 14) {
			numberOfAces++;
		}
	}
	if (gameData[side].sum > 21) {
		console.log("This side is over 21");
		// This side will be busted unless it has aces.
		while(numberOfAces > 0) {
			// Converting one ace from 11 to 1 = meaning 10 less points.
			console.log("Converting one ace from 11 to 1 = meaning 10 less points");
			gameData[side].sum -= 10;
			numberOfAces--;
			// Check if we're back to under 21.
			if (gameData[side].sum <= 21) break;
		}
		// Check again what's our sum.
		console.log("Check again what's our sum");
		if (gameData[side].sum > 21) {
			// This side is still busted...
			console.log("This side is still over 21 even after converting aces");
			gameData.state = Consts.GAME_STATE.finished;
			gameData.result = (side === Consts.SIDES.dealer ? Consts.GAME_RESULT.dealer_bust : Consts.GAME_RESULT.player_bust);
		}
	}
	if ((side === Consts.SIDES.player) && (gameData[Consts.SIDES.player].sum === 21)) {
		// Player has 21.
		// Dealer still needs to take cards.
		console.log("Player has 21, Dealer still needs to take cards");
		gameData.state = Consts.GAME_STATE.player_hold;
	} else if (side === Consts.SIDES.dealer) {
		// This card was the dealers card but he's not busted yet.
		// We need to decide what to do.
		if (gameData[Consts.SIDES.player].sum === 21 &&
			gameData[Consts.SIDES.player].cards.length === 2 &&
			gameData[Consts.SIDES.dealer].cards.length === 2) {
			// Blackjack !
			console.log("Player blackjack !");
			gameData.state = Consts.GAME_STATE.finished;
			gameData.result = Consts.GAME_RESULT.player_wins_with_blackjack;
		} else if (gameData.state === Consts.GAME_STATE.ongoing) {
			// User is still taking cards. Nothing to do right now.
		} else if (gameData.state === Consts.GAME_STATE.player_hold) {
			if (gameData[Consts.SIDES.dealer].sum < 17) {
				// The dealer needs to take another card.
				console.log("The dealer needs to take another card");
			} else {
				// Game is done. Need to check who won.
				console.log("Game is done. Need to check who won");
				gameData.state = Consts.GAME_STATE.finished;
				if (gameData[Consts.SIDES.dealer].sum > gameData[Consts.SIDES.player].sum) {
					// Dealer won.
					gameData.result = Consts.GAME_RESULT.dealer_wins;
				} else if (gameData[Consts.SIDES.dealer].sum < gameData[Consts.SIDES.player].sum) {
					// Player won.
					gameData.result = Consts.GAME_RESULT.player_wins;
				} else {
					// Draw.
					gameData.result = Consts.GAME_RESULT.draw;
				}
			}
		}
	}
	setGameData(gameData, function() {
		callback(gameData, decideOnNextMove(gameData));
	});
}

game.startNewGame = function(userId, bet, callback) {
	var gameData = {};
	gameData.userId = userId;
	gameData.bet = bet;
	gameData.state = Consts.GAME_STATE.ongoing;
	gameData.result = Consts.GAME_RESULT.undecided;
	gameData[Consts.SIDES.dealer] = {};
	gameData[Consts.SIDES.dealer].cards = [];
	gameData[Consts.SIDES.player] = {};
	gameData[Consts.SIDES.player].cards = [];
	setGameData(gameData, function() {
		callback();
	});
}

game.handleNewCard = function(userId, newCard, side, callback) {
	getGameData(userId, function(gameData) {
		addCard(gameData, newCard, side, callback);
	});
}

game.handleUserHit = function(userId, callback) {
	getGameData(userId, function(gameData) {
		if ((typeof gameData === "undefined") || (gameData.state !== Consts.GAME_STATE.ongoing)) {
			// This should not happen...
			console.log("handleUserHit - got this in an irrelevant state.")
			callback(false);
		} else {
			callback(true);
		}
	});
}

game.handleUserStay = function(userId, callback) {
	console.log("handleUserStay");
	getGameData(userId, function(gameData) {
		if (typeof gameData === "undefined" || gameData.state !== Consts.GAME_STATE.ongoing) {
			// This should not happen...
			console.log("handleUserStay - got this in an irrelevant state.")
			callback(false);
		} else {
			gameData.state = Consts.GAME_STATE.player_hold;
			setGameData(gameData, function() {
				callback(true);
			});
		}
	});
}

game.getGameState = function(userId, callback) {
	getGameData(userId, function(gameData) {
		if (gameData && typeof gameData !== "undefined" && typeof gameData.state !== "undefined") {
			callback(gameData.state);
		} else {
			callback(null);
		}
	});
}

game.cardToString = function(card) {
	return "" + card.suit + "_" + card.rank;
}

var createRandomCard = function(gameData) {
	var randomSuit = Utils.randomFromArray(Consts.DECK_SUITS);
	var randomRank = Utils.randomFromArray(Consts.DECK_RANKS);
	var randomCard = {
		suit: randomSuit,
		rank: randomRank
	};
	if (!isPossibleCard(gameData, randomCard)) {
		// This card has already being dealt too many times.
		console.log("This card has already being dealt too many times: " + game.cardToString(randomCard));
		return createRandomCard(gameData);
	} else {
		// New card which can be dealt.
		return randomCard;
	}
}

var isPossibleCard = function(gameData, newCard) {
	var timesCardWadDealt = 0;
	for (var i = 0; i < gameData[Consts.SIDES.dealer].cards.length; i++) {
		var dealtCard = gameData[Consts.SIDES.dealer].cards[i];
		timesCardWadDealt += ((dealtCard.suit === newCard.suit) && (dealtCard.rank === newCard.rank));
	}
	for (var i = 0; i < gameData[Consts.SIDES.player].cards.length; i++) {
		var dealtCard = gameData[Consts.SIDES.player].cards[i];
		timesCardWadDealt += ((dealtCard.suit === newCard.suit) && (dealtCard.rank === newCard.rank));
	}
	return (timesCardWadDealt < Consts.NUMBER_OF_DECKS);
}

game.getCardFromDeck = function(userId, callback) {
	getGameData(userId, function(gameData) {
		var newCard = createRandomCard(gameData);
		console.log("New card to be dealt: " + game.cardToString(newCard));
		newCard.imageUrl = Consts.CARDS_IMAGE_BASE_URL + game.cardToString(newCard) + ".png";
		callback(newCard);
	});
}

module.exports = game;