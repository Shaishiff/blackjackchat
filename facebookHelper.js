"use strict";

var Request = require('request');
var Consts = require('./consts');
var Utils = require('./utils');
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


facebookHelper.setWelcomeMessageButtonsMessage = function(text, buttons) {
  if (!(buttons instanceof Array)) {
    buttons = [buttons];
  }
  Request({
    url: Consts.FACEBOOK_WELCOME_MSG_URL,
    method: 'POST',
    json: {
      setting_type: "call_to_actions",
      thread_state: "new_thread",
      call_to_actions: [{
        message: facebookHelper.buildButtonTemplate(text, buttons)
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

var validateGenericTemplate = function(elements) {
  // Generic Template Limits:
  // see https://developers.facebook.com/docs/messenger-platform/send-api-reference#guidelines
  // Title: 80 characters
  // Subtitle: 80 characters
  // Call-to-action title: 20 characters
  // Call-to-action items: 3 buttons
  // Bubbles per message (horizontal scroll): 10 elements
  while (elements.length > 10) {
    elements.pop();
  }
  for(var i = 0; i < elements.length; i++) {
    if (typeof elements[i].title === "string") {
      elements[i].title = elements[i].title.substr(0, 80);
    }
    if (typeof elements[i].subtitle === "string") {
      elements[i].subtitle = elements[i].subtitle.substr(0, 80);
    }
    if (Utils.isArray(elements[i].buttons)) {
      while (elements[i].buttons.length > 3) {
        elements[i].buttons.pop();
      }
      for (var j = 0; j < elements[i].buttons; j++) {
        if (typeof elements[i].buttons[j].title === "string") {
          elements[i].buttons[j].title = elements[i].buttons[j].title.substr(0, 20);
        }
      }
    }
  }
  return elements;
}

facebookHelper.buildGenericTemplate = function(elements) {
  if (!Utils.isArray(elements)) {
    elements = [elements];
  }
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: validateGenericTemplate(elements)
      }
    }
  }
}

facebookHelper.sendGenericTemplate = function(bot, message, elements, callback) {
  if (!Utils.isArray(elements)) {
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

facebookHelper.buildImageWithTitle = function(imageUrl, title) {
  var element = {
    title: title,
    image_url: imageUrl
  };
  return facebookHelper.buildGenericTemplate(element);
}

facebookHelper.sendImageWithTitle = function(bot, message, imageUrl, title, callback) {
  bot.reply(message, facebookHelper.buildImageWithTitle(imageUrl, title), callback);
}

facebookHelper.sendText = function(bot, message, text, callback) {
  bot.reply(message, text, callback);
}

module.exports = facebookHelper;