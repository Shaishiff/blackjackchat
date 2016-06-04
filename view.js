"use strict";

var Consts = require('./consts');
var Utils = require('./utils');
var FacebookHelper = require('./facebookHelper');
var Game = require('./game');
var Deck = require('./deck');
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

view.showShouldIDealYouIn = function(bot, message, callback) {
	FacebookHelper.sendButtonTemplate(bot,
		message,
		Utils.getSentence("should_i_deal_you_in"),
		view.buildShouldIDealYouInButtons(),
		callback);
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
	FacebookHelper.sendButtonTemplate(bot,
		message,
		Utils.getSentence("whats_your_move"),
		view.buildWhatsYourMoveButtons(),
		callback);
}

view.showDealYouInResponse = function(bot, message, response) {
	if (response === "yes") {
		// We should deal the user in.
		// The dealer starts.
		view.showDealersCard(bot, message);
	} else if (response === "no") {
		// We should NOT deal the user in.
	} else {
		// Invalid response...
	}
}

var showGameSums = function(bot, message, gameData, callback) {
	callback();
}

var showEndOfGame = function(bot, message, gameData) {

}

var showNextMove = function(bot, message, gameData, nextMove) {
	showGameSums(bot, message, function() {
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
	FacebookHelper.sendText(bot, message, text, function() {
		Deck.getCard(message.user, function(cardFromDeck){
			Utils.getCardImage(cardFromDeck, function(imageUrl) {
				FacebookHelper.sendImage(bot, message, imageUrl, function() {
					Game.handleNewCard(message.user, cardFromDeck, side, function(gameData, nextMove) {
						showGameSums(bot, message, gameData, nextMove);
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
	Game.handleUserStay(message.user, function(res) {
		if (res) {
			view.showDealersCard(bot, message);
		}
	});
}

module.exports = view;