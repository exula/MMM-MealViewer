/* Node Helper */

/* Magic Mirror
 * Module: MMM-MenuViewer
 *
 * A Magic Mirror Module to pull school lunch menu data from mealviewer.com
 *
 * By Jerry Kazanjian kazanjig@gmail.com
 * v1.1 2019/02/20
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var fetch = require("fetch");

module.exports = NodeHelper.create({

  start: function() {
    console.log("Starting node_helper for: " + this.name);
  },

  getMenuData: function(payload) {
    const self = this;
    const results = [];
    let count = 0;

    // Iterate through the URLs for the schools and push result to results array
    for (let url of payload) {
      fetch(url.url)
        .then((response) => response.json())
        .then((body) => new Promise((resolve, reject) => {
          results.push(body);
          if (++count === payload.length) {
            self.sendSocketNotification("GOT-MENU-DATA", results);
          }
          resolve();
        }));
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "GET-MENU-DATA") {
      this.getMenuData(payload);
    }
  }
});
