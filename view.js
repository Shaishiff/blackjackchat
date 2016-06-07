"use strict";

var Consts = require('./consts');
var Utils = require('./utils');
var FacebookHelper = require('./facebookHelper');
var Game = require('./game');
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

view.showShouldIDealYouIn = function(bot, message, additionalText) {
	console.log("showShouldIDealYouIn");
	User.getUserBalance(message.user, function(balance) {
		var yourBalanceText = Utils.getSentence("your_new_balance_is") + ": " + balance;
		FacebookHelper.sendButtonTemplate(bot,
			message,
			(typeof additionalText === "string" ? (additionalText + "\n"): "") + yourBalanceText + "\n" + Utils.getSentence("should_i_deal_you_in"),
			view.buildShouldIDealYouInButtons());
	});
}

view.buildWhatsYourMoveButtons = function() {
  console.log("buildWhatsYourMoveButtons");
  var buttons = [];
  buttons.push({
    type: "postback",
    title: "Hit",
    payload: "showPlayerHit"
  });
  buttons.push({
    type: "postback",
    title: "Stand",
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

view.buildHowMuchToBetButtons = function() {
	console.log("buildHowMuchToBetButtons");
  var buttons = [];
  buttons.push({
    type: "postback",
    title: "50",
    payload: "showBet-50"
  });
  buttons.push({
    type: "postback",
    title: "100",
    payload: "showBet-100"
  });
  buttons.push({
    type: "postback",
    title: "200",
    payload: "showBet-200"
  });
  return buttons;
}

view.showHowMuchToBet = function(bot, message) {
	console.log("showWhatsYourMove");
	FacebookHelper.sendButtonTemplate(bot,
		message,
		Utils.getSentence("how_much_to_bet"),
		view.buildHowMuchToBetButtons());
}

view.showBet = function(bot, message, bet) {
	Game.getGameState(message.user, function(state) {
		console.log("showBet - game is in state" + state);
		if(state === Consts.GAME_STATE.ongoing || state === Consts.GAME_STATE.player_hold) {
			// Game is in progress, can't set the bet now.
			console.log("Game is in progress, can't set the bet now.");
		} else {
			var actualBet = parseInt(bet);
			Game.startNewGame(message.user, actualBet, function() {
				view.showDealersCard(bot, message);
			});
		}
	});
}

view.showDealYouInResponse = function(bot, message, response) {
	console.log("showDealYouInResponse-" + response);
	Game.getGameState(message.user, function(state) {
		if(state === Consts.GAME_STATE.ongoing || state === Consts.GAME_STATE.player_hold) {
			console.log("Game is in progress, can't start new game.");
		} else {
			if (response === "yes") {
				// We should deal the user in.
				// The dealer starts.
				User.getUserBalance(message.user, function(balance) {
					//showUserBalance(bot, message, balance, function() {
					view.showHowMuchToBet(bot, message);
					//});
				});
			} else if (response === "no") {
				FacebookHelper.sendText(bot, message, Utils.getSentence("tell_me_when_you_want_to_deal_in"));
			} else {
				// Invalid response...
				console.error("showDealYouInResponse - Invalid response");
			}
		}
	});
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
		case Consts.GAME_RESULT.player_wins_with_blackjack:
			text = Utils.getSentence("end_of_game_player_wins");
			balanceChange = Consts.BLACKJACK_PAY_OUT*gameData.bet;
			break;
		case Consts.GAME_RESULT.draw:
			text = Utils.getSentence("end_of_game_draw");
			break;
		default:
			// This should never happen...
			break;
	}
	User.updateUserBalance(message.user, balanceChange, function(newBalance) {
		//FacebookHelper.sendText(bot, message, text, function() {
			FacebookHelper.sendImage(bot, message, Consts.DEALER_IMAGE_URL, function() {
				view.showShouldIDealYouIn(bot, message, text);
			});
		//});
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
		Game.getCardFromDeck(message.user, function(cardFromDeck){
			//FacebookHelper.sendImage(bot, message, cardFromDeck.imageUrl, function() {
			FacebookHelper.sendText(bot, message, Game.cardToString(cardFromDeck) + " (this should be an image)",  function() {
				Game.handleNewCard(message.user, cardFromDeck, side, function(gameData, nextMove) {
					showNextMove(bot, message, gameData, nextMove);
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

view.showPlayerHit = function(bot, message) {
	console.log("showPlayerHit");
	Game.handleUserHit(message.user, function(res) {
		if (res) {
			view.showPlayersCard(bot, message);
		}
	});
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