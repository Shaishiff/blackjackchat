"use strict";

var Botkit = require('botkit');
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
  //FacebookHelper.setWelcomeMessageText("Hey welcome !");
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

// Main menu.
controller.hears(["start","deal"], 'message_received', function(bot, message) {
  if (PostBackHelper.isPostBack(message)) return;
  View.showShouldIDealYouIn(bot, message);
});

// Not sure what the users wants. Final fallback.
controller.on("message_received", function(bot, message) {
  console.log("Reached unknown user message");
  if (message.text) notSureWhatUserWants(bot, message);
  return false;
});

function notSureWhatUserWants(bot, message) {
  if (PostBackHelper.isPostBack(message)) return;
  console.log("No idea what the user wants...");
  AnalyticsHelper.sendUserMsgToAnalytics("unknown_msgs", message.text);
}

// Facebook postsbacks.
controller.on('facebook_postback', function(bot, message) {
  AnalyticsHelper.sendUserMsgToAnalytics(message.user, "facebook_postback-" + message.payload);
  PostBackHelper.handlePostBack(bot, message, message.payload);
});
