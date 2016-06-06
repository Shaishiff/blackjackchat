"use strict";

var Consts = require('./consts');
var MongoHelper = require('./mongoHelper');
var View = require('./view');
var game = {};
var gamesData = {};

var getGameData = function(userId, callback) {
	callback(gamesData[userId]);
}

var setGameData = function(gameData, callback) {
	gamesData[gameData.userId] = gameData;
	callback(true);
}

var decideOnNextMove = function(gameData) {
	console.log("decideOnNextMove");
	if (gameData[Consts.SIDES.player].cards.length < 2) {
		return Consts.GAME_NEXT_MOVE.player_card;
	} else if (gameData[Consts.SIDES.dealer].cards.length < 1) {
		return Consts.GAME_NEXT_MOVE.dealer_card;
	} else if (gameData.state === Consts.GAME_STATE.ongoing) {
		return Consts.GAME_NEXT_MOVE.ask_player;
	} else if (gameData.state === Consts.GAME_STATE.finished) {
		return Consts.GAME_NEXT_MOVE.game_over;
	} else if (gameData.state === Consts.GAME_STATE.player_hold) {
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
	if (side === Consts.SIDES.dealer) {
		// This card was the dealers card but he's not busted yet.
		// We need to decide what to do.
		if (gameData.state === Consts.GAME_STATE.ongoing) {
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

game.handleUserStay = function(userId, callback) {
	getGameData(userId, function(gameData) {
		if (typeof gameData === "undefined" || gameData.state !== Consts.GAME_STATE.ongoing) {
			// This should not happen...
			callback(false);
		} else {
			gameData.state = Consts.GAME_STATE.player_hold;
			setGameData(gameData, function() {
				callback(true);
			});
		}
	});
}

module.exports = game;