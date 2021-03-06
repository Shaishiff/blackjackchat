"use strict";

var consts = {
	FACEBOOK_WELCOME_MSG_URL: "https://graph.facebook.com/v2.6/" + process.env.FACEBOOK_PAGE_ID + "/thread_settings?access_token=" + process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
	FACEBOOK_USER_PROFILE_API: "https://graph.facebook.com/v2.6/<USER_ID>?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=" + process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
	MONGO_DB_URL: "mongodb://" + process.env.MONGO_DB_USER + ":" + process.env.MONGO_DB_USER + "@" + process.env.MONGO_DB_HOST + ":" + process.env.MONGO_DB_PORT + "/" + process.env.MONGO_DB_NAME,
	MONGO_DB_USER_INFO_COL: "user_info",
	MONGO_DB_GAME_INFO_COL: "game_info",
	MONGO_DB_USER_BALANCE_COL: "user_balance",
	MONGO_DB_SYSTEM_MANAGEMENT_COL: "system_management",
	ANALYTICS_API: "http://api.bot-metrics.com/v1/messages",
	USER_INITIAL_BALANCE: 1000,
	USER_MIN_BALANCE: 100,
	INTERVAL_TO_REST_TO_MIN_BALANCE: (1000*60*10),
	DEFAULT_BET_PER_GAME: 50,
	TIME_FOR_GAME_TO_BE_CLOSED: (1000*60*2),
	CARDS_IMAGE_BASE_URL: "https://raw.githubusercontent.com/Shaishiff/blackjackchat/master/images/cards/",
	DEALER_IMAGE_URL: "https://raw.githubusercontent.com/Shaishiff/blackjackchat/master/images/dealer.png",
	NUMBER_OF_DECKS: 1,
	BLACKJACK_PAY_OUT: 1.5,
	DECK_SUITS: ["H","D","C","S"],
	DECK_RANKS: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
	SIDES: {
		dealer: "dealer",
		player: "player"
	},
	GAME_STATE: {
		ongoing: 1,
		player_hold: 2,
		finished: 3
	},
	GAME_NEXT_MOVE: {
		player_card: 1,
		ask_player: 2,
		dealer_card: 3,
		game_over: 4
	},
	GAME_RESULT: {
		undecided: "undecided",
		dealer_bust: "dealer_bust",
		player_bust: "player_bust",
		dealer_wins: "dealer_wins",
		player_wins: "player_wins",
		player_wins_with_blackjack: "player_wins_with_blackjack",
		draw: "draw",
		players_lost_by_timeout: "players_lost_by_timeout"
	}
};

module.exports = consts;