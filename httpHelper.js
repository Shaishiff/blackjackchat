"use strict";

var Request = require('request');
var httpHelper = {};

httpHelper.httpGetJson = function(url, callback) {
  Request({
    url: url,
    method: 'GET'
  }, function(error, response, body) {
    if (error) {
      console.error('Error http get ' + url + ' - ' + error);
    } else if (response.body.error) {
      console.error('Error in response body for http get ' + url, response.body.error);
    } else {
      try {
        console.log(response.body);
        var parsedResponse = JSON.parse(response.body)
        console.log("Parsed response successfully");
      } catch (e) {
        console.error('Error parsing json response from http get ' + url);
      }
      callback(parsedResponse);
      return;
    }
    callback();
  });
}

httpHelper.httpPostJson = function(url, headers, body, callback) {
  Request({
    url: url,
    method: 'POST',
    headers: headers,
    body: body
  }, function(error, response, body) {
    if (error) {
      console.error('Error http post ' + url + ' - ' + error);
    } else if (response.body.error) {
      console.error('Error in response body for http post ' + url, response.body.error);
    } else {
      try {
        console.log(response.body);
        var parsedResponse = JSON.parse(response.body);
        console.log("Parsed response successfully");
        return;
      } catch (e) {
        console.error('Error parsing json response from http post ' + url);
      }
      callback(parsedResponse);
      return;
    }
    callback();
  });
}

module.exports = httpHelper;