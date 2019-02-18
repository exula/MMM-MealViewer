/* Node Helper */

/* Magic Mirror
 * Module: MMM-MenuViewer
 *
 * Dispays school lunch menu information from mealviewer.com
 * (today if before noon; tomorrow if after noon)
 *
 * By Jerry Kazanjian kazanjig@gmail.com
 * v1.0 2019/02/17
 * MIT Licensed.
 */

var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({

  start: function() {
    console.log("Starting node_helper for: " + this.name);
  },

  getMenuData: function(payload) {

    // The payload should be the request URLs we want to used
    var urls = payload;
    var results = [];
    this.count = 0;

    var _this = this;

    // Iterate through the URLs for the schools and push result to results array
    for (var i = 0; i < urls.length; i++){
      request({
        url: urls[i].url,
        method: 'GET'
      }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          var result = JSON.parse(body);
          results.push(result);
        }
        _this.count++;

        if (_this.count === urls.length) {
          _this.sendSocketNotification('GOT-MENU-DATA', results);
        }
      });
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'GET-MENU-DATA') {
      this.getMenuData(payload);
    }
  }
});
