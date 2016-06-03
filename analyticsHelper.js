"use strict";

var Request = require('request');
var Consts = require('./consts');
var DateFormat = require('dateformat');
var analyticsHelper = {};

var sendToAnalyticsInternal = function(sender, text, direction) {
  Request({
      url: Consts.ANALYTICS_API,
      qs: {
        token: process.env.ANALYTICS_TOKEN
      },
      method: 'POST',
      json: {
        message: {
          text: text,
          message_type: direction,
          user_id: sender,
          conversation_id: sender + "-" + DateFormat(new Date(), "dd_mm_yy")
        }
      }
    },
    function(error, response, body) {
      if (error) {
        console.error('Error sending message to analytics: ', error);
      } else if (response.body.error) {
        console.error('Error in body response when sending message to analytics: ', response.body.error);
      }
    });
}

analyticsHelper.sendUserMsgToAnalytics = function(sender, text) {
	sendToAnalyticsInternal(sender, text, "incoming");
}

analyticsHelper.sendBotMsgToAnalytics = function(sender, text) {
	sendToAnalyticsInternal(sender, text, "outgoing");
}

module.exports = analyticsHelper;