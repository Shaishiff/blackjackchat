"use strict";

var Consts = require('./consts');
var Utils = require('./utils');
var FacebookHelper = require('./facebookHelper');
var Game = require('./game');
var Deck = require('./deck');
var User = require('./user');
var view = {};

view.buildShouldIDealYouInButtons = function() {
  console.log("buildShouldIDealYouInButtons");
  var buttons = [];
  buttons.push({
    type: "postback",
    title: "Yes",
    payload: "showDealYouInResponse-yes"
  });
  buttons.push({
    type: "postback",
    title: "No",
    payload: "showDealYouInResponse-no"
  });
  return buttons;
}

view.buildShouldIDealYouIn = function() {
	return FacebookHelper.buildButtonTemplate(Utils.getSentence("should_i_deal_you_in"), view.buildShouldIDealYouInButtons());
}

view.showShouldIDealYouIn = function(bot, message) {
	console.log("showShouldIDealYouIn");
	FacebookHelper.sendButtonTemplate(bot,
		message,
		Utils.getSentence("should_i_deal_you_in"),
		view.buildShouldIDealYouInButtons());
}

view.buildWhatsYourMoveButtons = function() {
  console.log("buildWhatsYourMoveButtons");
  var buttons = [];
  buttons.push({
    type: "postback",
    title: "Hit",
    payload: "showPlayersCard"
  });
  buttons.push({
    type: "postback",
    title: "Stay",
    payload: "showPlayerStay"
  });
  return buttons;
}

view.showWhatsYourMove = function(bot, message, callback) {
	console.log("showWhatsYourMove");
	FacebookHelper.sendButtonTemplate(bot,
		message,
		Utils.getSentence("whats_your_move"),
		view.buildWhatsYourMoveButtons(),
		callback);
}

view.showDealYouInResponse = function(bot, message, response) {
	console.log("showDealYouInResponse-" + response);
	if (response === "yes") {
		// We should deal the user in.
		// The dealer starts.
		Game.startNewGame(message.user, Consts.DEFAULT_BET_PER_GAME, function() {
			view.showDealersCard(bot, message);
		});
	} else if (response === "no") {
		// We should NOT deal the user in.
	} else {
		// Invalid response...
	}
}

var showGameSums = function(bot, message, gameData, callback) {
	console.log("showGameSums");
	var text = "";
	if (typeof gameData[Consts.SIDES.player].sum !== "undefined" && gameData[Consts.SIDES.player].sum !== 0) {
		if (text.length > 0) {
			text += "\n";
		}
		text += "Player has: " + gameData[Consts.SIDES.player].sum;
	}
	if (typeof gameData[Consts.SIDES.dealer].sum !== "undefined" && gameData[Consts.SIDES.dealer].sum !== 0) {
		if (text.length > 0) {
			text += "\n";
		}
		text += "Dealer has: " + gameData[Consts.SIDES.dealer].sum;
	}
	FacebookHelper.sendText(bot, message, text, function() {
		callback();
	});
}

var showUserBalance = function(bot, message, newBalance, callback) {
	console.log("showUserBalance");
	var text = Utils.getSentence("your_new_balance_is") + ": " + newBalance;
	FacebookHelper.sendText(bot, message, text, function() {
		callback();
	});
}

var showEndOfGame = function(bot, message, gameData) {
	console.log("showEndOfGame");
	var balanceChange = 0;
	var text = "";
	switch (gameData.result) {
		case Consts.GAME_RESULT.dealer_bust:
			text = Utils.getSentence("end_of_game_dealer_bust");
			balanceChange = gameData.bet;
			break;
		case Consts.GAME_RESULT.player_bust:
			text = Utils.getSentence("end_of_game_player_bust");
			balanceChange = (-1)*gameData.bet;
			break;
		case Consts.GAME_RESULT.dealer_wins:
			text = Utils.getSentence("end_of_game_dealer_wins");
			balanceChange = (-1)*gameData.bet;
			break;
		case Consts.GAME_RESULT.player_wins:
			text = Utils.getSentence("end_of_game_player_wins");
			balanceChange = gameData.bet;
			break;
		case Consts.GAME_RESULT.draw:
			text = Utils.getSentence("end_of_game_draw");
			break;
		default:
			// This should never happen...
			break;
	}
	User.updateUserBalance(message.user, balanceChange, function(newBalance) {
		FacebookHelper.sendText(bot, message, text, function() {
			FacebookHelper.sendImage(bot, message, Consts.DEALER_IMAGE_URL, function() {
				showUserBalance(bot, message, newBalance, function() {
					view.showShouldIDealYouIn(bot, message);
				});
			});
		});
	});
}

var showNextMove = function(bot, message, gameData, nextMove) {
	console.log("showNextMove");
	console.log("NextMove: " + nextMove);
	showGameSums(bot, message, gameData, function() {
		switch(nextMove) {
	    case Consts.GAME_NEXT_MOVE.player_card:
	    	view.showPlayersCard(bot, message);
	      break;
	    case Consts.GAME_NEXT_MOVE.ask_player:
	    	view.showWhatsYourMove(bot, message);
				break;
			case Consts.GAME_NEXT_MOVE.dealer_card:
				view.showDealersCard(bot, message);
				break;
			case Consts.GAME_NEXT_MOVE.game_over:
				showEndOfGame(bot, message, gameData);
				break;
			default:
				// This should never happen...
				break;
		}
	});
}

view.showCard = function(bot, message, text, side) {
	console.log("showCard");
	FacebookHelper.sendText(bot, message, text, function() {
		Deck.getCard(message.user, function(cardFromDeck){
			Utils.getCardImage(cardFromDeck, function(imageUrl) {
				//FacebookHelper.sendImage(bot, message, imageUrl, function() {
				FacebookHelper.sendText(bot, message, Deck.cardToString(cardFromDeck) + " (this should be an image)",  function() {
					Game.handleNewCard(message.user, cardFromDeck, side, function(gameData, nextMove) {
						showNextMove(bot, message, gameData, nextMove);
					});
				});
			});
		});
	});
}

view.showDealersCard = function(bot, message) {
	view.showCard(bot, message, Utils.getSentence("dealers_card"), Consts.SIDES.dealer);
}

view.showPlayersCard = function(bot, message) {
	view.showCard(bot, message, Utils.getSentence("players_card"), Consts.SIDES.player);
}

view.showPlayerStay = function(bot, message) {
	console.log("showPlayerStay");
	Game.handleUserStay(message.user, function(res) {
		if (res) {
			view.showDealersCard(bot, message);
		}
	});
}

module.exports = view;