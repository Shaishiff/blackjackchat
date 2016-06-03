"use strict";

var Request = require('request');
var Consts = require('./consts');
var facebookHelper = {};

facebookHelper.setWelcomeMessageStructuredMessage = function(elements) {
  if (!(elements instanceof Array)) {
    elements = [elements];
  }
  Request({
    url: Consts.FACEBOOK_WELCOME_MSG_URL,
    method: 'POST',
    json: {
      setting_type: "call_to_actions",
      thread_state: "new_thread",
      call_to_actions: [{
        message: {
          attachment:{
            type: "template",
            payload: {
              template_type: "generic",
              elements: elements
            }
          }
        }
      }]
    }
  }, function(error, response, body) {
    if (error) {
      console.error('Error setting welcome message: ', error);
    } else if (response.body.error) {
      console.error('Error in response body when setting welcome message: ', response.body.error);
    }
  });
}

facebookHelper.setWelcomeMessageText = function(text) {
  Request({
    url: Consts.FACEBOOK_WELCOME_MSG_URL,
    method: 'POST',
    json: {
      setting_type: "call_to_actions",
      thread_state: "new_thread",
      call_to_actions: [{
        message: {
          text: text
        }
      }]
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error setting welcome message: ', error);
    } else if (response.body.error) {
      console.log('Error in response body when setting welcome message: ', response.body.error);
    }
  });
}

facebookHelper.buildGenericTemplate = function(elements) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: elements
      }
    }
  }
}

facebookHelper.sendGenericTemplate = function(bot, message, elements, callback) {
  if (!(elements instanceof Array)) {
    elements = [elements];
  }
  bot.reply(message, facebookHelper.buildGenericTemplate(elements), callback);
}

facebookHelper.sendMultipleGenericTemplates = function(bot, message, arr, index) {
  if (typeof index !== "number") index = 0;
  if (index >= arr.length) return;
  facebookHelper.sendGenericTemplate(bot, message, arr[index], function() {
    var newIndex = index + 1;
    facebookHelper.sendMultipleGenericTemplates(bot, message, arr, newIndex);
  });
}

facebookHelper.buildButtonTemplate = function(text, elements) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text,
        buttons: elements
      }
    }
  }
}

facebookHelper.sendButtonTemplate = function(bot, message, text, elements, callback) {
  if (!(elements instanceof Array)) {
    elements = [elements];
  }
  bot.reply(message, facebookHelper.buildButtonTemplate(text, elements), callback);
}

facebookHelper.buildImage = function(imageUrl) {
  return {
    attachment: {
      type: "image",
      payload: {
        url: imageUrl
      }
    }
  }
}

facebookHelper.sendImage = function(bot, message, imageUrl, callback) {
  bot.reply(message, facebookHelper.buildImage(imageUrl), callback);
}

facebookHelper.sendText = function(bot, message, text, callback) {
  bot.reply(message, text, callback);
}

module.exports = facebookHelper;