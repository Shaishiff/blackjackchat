"use strict";

var Botkit = require('botkit');
var Sentences = require('./sentences');
var Consts = require('./consts');
var Api = require('./api');
var View = require('./view');
var Utils = require('./utils');
var FacebookHelper = require('./facebookHelper');
var PostBackHelper = require('./postBackHelper');
var AnalyticsHelper = require('./analyticsHelper');

var controller = Botkit.facebookbot({
  access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
  verify_token: process.env.FACEBOOK_VERIFY_TOKEN
})

var bot = controller.spawn({});

// Set up the welcome message.
if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
  //FacebookHelper.setWelcomeMessageText("Welcome to happy hours TLV !");
  FacebookHelper.setWelcomeMessageStructuredMessage(View.buildMainMenu());
}

// Set initial data store.
Api.collectData();

// Start web server.
var webServerPort = process.env.PORT || 8080;
controller.setupWebserver(webServerPort, function(err, webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function() {
    webserver.get('/health', function(req, res) {
      res.send('OK');
    });
  });
});

function handleUserAttachment(bot, message, lang) {
  console.log("handleUserAttachment started");
  if (message.attachments.length === 1 &&
    message.attachments[0].payload &&
    message.attachments[0].payload.coordinates &&
    message.attachments[0].payload.coordinates.lat &&
    message.attachments[0].payload.coordinates.long) {
    var lat = message.attachments[0].payload.coordinates.lat;
    var lon = message.attachments[0].payload.coordinates.long;
    View.showDealsByDistance(bot, message, lang, lat, lon);
    return true;
  }
  return false;
}

// Log the message and add more info to the message.
controller.middleware.receive.use(function(bot, message, next) {
  console.log("controller.middleware.receive.use - " + JSON.stringify(message));
  Utils.getUserInfo(message.user, function(userInfo) {
    if (typeof userInfo !== "undefined") {
      message.userInfo = userInfo;
      message.fullNameWithId = userInfo.first_name + "_" + userInfo.last_name + "_" + message.user;
    } else {
      message.fullNameWithId = message.user;
    }
    AnalyticsHelper.sendUserMsgToAnalytics(message.fullNameWithId, message.text);
    var bNext = true;
    if (message.attachments) {
      // SHAISH: For now we'll disable this. If we want to enable it we will need
      // to make sure it doesn't conflict with the guide flow.
      //bNext = handleUserAttachment(bot, message, "");
    }
    if (bNext) {
      next();
    } else {
      bot.reply(message, "Sorry, I don't understand these kind of stuff :(");
    }
  });
});

controller.middleware.send.use(function(bot, message, next) {
  console.log("controller.middleware.send.use - " + JSON.stringify(message));
  Utils.getUserInfo(message.channel, function(userInfo) {
    if (typeof userInfo !== "undefined") {
      message.userInfo = userInfo;
      message.fullNameWithId = userInfo.first_name + "_" + userInfo.last_name + "_" + message.channel;
    } else {
      message.fullNameWithId = message.channel;
    }
    AnalyticsHelper.sendBotMsgToAnalytics(message.fullNameWithId, message.text || "-empty-");
    next();
  });
});

// User clicked the send-to-messenger plugin.
// controller.on('facebook_optin', function(bot, message) {
//   bot.reply(message, 'Hey, welcome !');
// });

// User said hello.
// controller.hears(Sentences.user_welcoming_messages, 'message_received', function(bot, message) {
//   bot.reply(message, Utils.randomFromArray(Sentences.bot_welcoming_messages));
// });

// User said thanks.
// controller.hears(Sentences.user_says_thanks, 'message_received', function(bot, message) {
//   bot.reply(message, Utils.randomFromArray(Sentences.bot_says_you_are_welcome));
// });

// User wants help.
// controller.hears(Sentences.help_me, 'message_received', function(bot, message) {
//   bot.reply(message, Sentences.help_message);
// });

// User wants help.
// controller.hears(["test"], 'message_received', function(bot, message) {
//   bot.reply(message, "testing 123");
// });

// Test location.
// controller.hears(["test location"], 'message_received', function(bot, message) {
//     View.showDealsByDistance(bot, message, "", 32.079869, 34.77845);
// });

// Main menu.
controller.hears(Sentences.user_wants_main_menu_he, 'message_received', function(bot, message) {
  if (PostBackHelper.isPostBack(message)) return;
  console.log("user requested hebrew menu: " + message.text);
  Utils.setUserLang(message.user, "");
  View.showMainMenu(bot, message, "");
});
controller.hears(Sentences.user_wants_main_menu_en, 'message_received', function(bot, message) {
  if (PostBackHelper.isPostBack(message)) return;
  console.log("user requested english menu: " + message.text);
  Utils.setUserLang(message.user, "en");
  View.showMainMenu(bot, message, "en");
});

// Similar string.
// controller.hears(["(.*)"], 'message_received', function(bot, message) {
//     if(typeof message.text === "string" && message.text.length > 0) {
//       View.showDealsByStringSimilarity(bot, message, "", message.text);
//     }
// });

// Not sure what the users wants. Final fallback.
controller.on('message_received', function(bot, message) {
  console.log("Reached unknown user message");
  if (message.text) notSureWhatUserWants(bot, message);
  return false;
});

function notSureWhatUserWants(bot, message) {
  if (PostBackHelper.isPostBack(message)) return;
  console.log("No idea what the user wants...");
  //bot.reply(message, Utils.getSentence("type_menu_to_see_menu", Utils.getUserLang(message.user)));
  View.showStartMainMenu(bot, message, Utils.getUserLang(message.user), "");
  AnalyticsHelper.sendUserMsgToAnalytics("unknown_msgs", message.text);
}

// Facebook postsbacks.
controller.on('facebook_postback', function(bot, message) {
  AnalyticsHelper.sendUserMsgToAnalytics(message.user, "facebook_postback-" + message.payload);
  PostBackHelper.handlePostBack(bot, message, message.payload);
});
