"use strict";

var consts = {
	FACEBOOK_WELCOME_MSG_URL: "https://graph.facebook.com/v2.6/" + process.env.FACEBOOK_PAGE_ID + "/thread_settings?access_token=" + process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
	FACEBOOK_USER_PROFILE_API: "https://graph.facebook.com/v2.6/<USER_ID>?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=" + process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
	MONGO_DB_URL: "mongodb://" + process.env.MONGO_DB_USER + ":" + process.env.MONGO_DB_USER + "@" + process.env.MONGO_DB_HOST + ":" + process.env.MONGO_DB_PORT + "/" + process.env.MONGO_DB_NAME,
	MONGO_DB_USER_INFO_COL: "user_info",
	ANALYTICS_API: "http://api.bot-metrics.com/v1/messages",
	USER_INITIAL_BALANCE: 1000,
	DEFAULT_BET_PER_GAME: 50,
	CARDS_IMAGE_BASE_URL: "https://raw.githubusercontent.com/Shaishiff/blackjackchat/master/images/",
	DEALER_IMAGE_URL: "https://raw.githubusercontent.com/Shaishiff/blackjackchat/master/images/dealer.png",
	NUMBER_OF_DECKS: 1,
	BLACKJACK_PAY_OUT: 1.5,
	DECK_SUITS: ["H","D","C","S"],
	DECK_RANKS: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
	SIDES: {
		dealer: 0,
		player: 1
	},
	GAME_STATE: {
		ongoing: 0,
		player_hold: 1,
		finished: 2
	},
	GAME_NEXT_MOVE: {
		player_card: 0,
		ask_player: 1,
		dealer_card: 2,
		game_over: 3
	},
	GAME_RESULT: {
		undecided: 0,
		dealer_bust: 1,
		player_bust: 2,
		dealer_wins: 3,
		player_wins: 4,
		player_wins_with_blackjack: 5,
		draw: 6
	}
};

module.exports = consts;