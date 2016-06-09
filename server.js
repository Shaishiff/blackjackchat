"use strict";

var Botkit = require('botkit');
var View = require('./view');
var Utils = require('./utils');
var Game = require('./game');
var User = require('./user');
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
  FacebookHelper.setWelcomeMessageButtonsMessage(Utils.getSentence("should_i_deal_you_in"), View.buildShouldIDealYouInButtons());
}

// Start web server.
var webServerPort = process.env.PORT || 8080;
controller.setupWebserver(webServerPort, function(err, webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function() {
    webserver.get('/health', function(req, res) {
      res.send('OK');
    });
  });
});

// Log the message and add more info to the message.
controller.middleware.receive.use(function(bot, message, next) {
  //console.log("controller.middleware.receive.use - " + JSON.stringify(message));
  AnalyticsHelper.sendUserMsgToAnalytics(message.user, message.text);
  next();
});

controller.middleware.send.use(function(bot, message, next) {
  //console.log("controller.middleware.send.use - " + JSON.stringify(message));
  AnalyticsHelper.sendBotMsgToAnalytics(message.channel, message.text || "-empty-");
  next();
});

controller.hears(["start","deal"], 'message_received', function(bot, message) {
  if (PostBackHelper.isPostBack(message)) return;
  View.showShouldIDealYouIn(bot, message);
});

controller.hears(["clear games"], 'message_received', function(bot, message) {
  Game.clearGameData(message.user, function(res) {
    bot.reply(message, "Cleared games for user with result: " + res);
  });
});

controller.hears(["add to balance"], 'message_received', function(bot, message) {
  User.updateUserBalance(message.user, 10000, function() {
    bot.reply(message, "Add 10000 to user balance");
  });
});

// Not sure what the users wants. Final fallback.
controller.on("message_received", function(bot, message) {
  if (PostBackHelper.isPostBack(message)) return;
  console.log("Reached unknown user message");
  if (message.text) {
    AnalyticsHelper.sendUserMsgToAnalytics("unknown_msgs", message.text);
  }
});

// Facebook postsbacks.
controller.on('facebook_postback', function(bot, message) {
  AnalyticsHelper.sendUserMsgToAnalytics(message.user, "facebook_postback-" + message.payload);
  PostBackHelper.handlePostBack(bot, message, message.payload);
});
