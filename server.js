"use strict";

var Botkit = require('botkit');
var View = require('./view');
var Utils = require('./utils');
var Game = require('./game');
var User = require('./user');
var FacebookHelper = require('./facebookHelper');
var PostBackHelper = require('./postBackHelper');
var AnalyticsHelper = require('./analyticsHelper');
var SystemManagement = require('./systemManagement');
// var Webshot = require('webshot');
// var Fs = require('fs');

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
    webserver.get('/htmltopng', function(req, res) {
      // var renderStream = Webshot('google.com');
      // var file = Fs.createWriteStream('google2.png', {encoding: 'binary'});
      // renderStream.on('data', function(data) {
      //   file.write(data.toString('binary'), 'binary');
      // });
      res.send('A OK');
    });
  });
});

SystemManagement.init(bot);

// Log the message and add more info to the message.
controller.middleware.receive.use(function(bot, message, next) {
  //console.log("controller.middleware.receive.use - " + JSON.stringify(message));
  User.createUserInfo(message.user, function(userCreated) {
    message.userCreated = userCreated;
    AnalyticsHelper.sendUserMsgToAnalytics(message.user, message.text);
    next();
  });
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

controller.hears(["gif"], 'message_received', function(bot, message) {
  if (PostBackHelper.isPostBack(message)) return;
  View.sendGif(bot, message);
});

controller.hears(["clear games"], 'message_received', function(bot, message) {
  Game.clearGameData(message.user, function(res) {
    bot.reply(message, "Cleared games for user with result: " + res);
  });
});

controller.hears(["add to balance","add balance"], 'message_received', function(bot, message) {
  User.updateUserBalance(message.user, 10000, function() {
    bot.reply(message, "Added 10000 to user balance");
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

// Not sure what the users wants. Final fallback.
controller.on("message_delivered", function(bot, message) {
  console.log("message_delivered");
});

// Facebook postsbacks.
controller.on('facebook_postback', function(bot, message) {
  AnalyticsHelper.sendUserMsgToAnalytics(message.user, "facebook_postback-" + message.payload);
  PostBackHelper.handlePostBack(bot, message, message.payload);
});
