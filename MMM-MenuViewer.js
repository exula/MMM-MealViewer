/* Module */

/* Magic Mirror
 * Module: MMM-MenuViewer
 *
 * Dispays school lunch menu information from mealviewer.com
 *
 * By Jerry Kazanjian kazanjig@gmail.com
 * v1.0 2019/02/17
 * MIT Licensed.
 */

Module.register("MMM-MenuViewer",{
  defaults: {
    schools: [],
    showDays: 0,
    maxWidth: "300px",
    useHeader: false,
    updateInterval: 5 * 60 * 1000,
    animationSpeed: 10,
    initialLoadDelay: 1875,
    retryDelay: 1500,
    rotateInterval: 5 * 1000,
    interval: 900000,  	// 15 minutes
  },

  /*getStyles: function() {
      return ["MMM-MenuViewer.css", 'font-awesome.css'];
},*/

  getScripts: function() {
    return ["moment.js"];
  },

  start:  function() {
    Log.log('Starting module: ' + this.name);

    // Set up the local values
    var today = moment(new Date());
    var todayFormatted = today.format('MM-DD-YYYY');
    var endDay = today.add(config.showDays, 'days');
    var endDayFormatted = endDay.format('MM-DD-YYYY');
    this.loaded = false;
    this.urls = [];

    for (var i in this.config.schools) {
			this.urls.push({school: this.config.schools[i], url: 'https://api.mealviewer.com/api/v4/school/' + this.config.schools[i] + '/' + todayFormatted + '/' + endDayFormatted + '/'});
    }
    console.log(this.urls);

    // Initialize results array
    this.results = [];

    // Trigger the first request
    this.getMenuData(this);
  },

  getMenuData: function(_this) {
    // Make the initial request to the helper then set up the timer to perform the updates
    _this.sendSocketNotification('GET-MENU-DATA', _this.urls);
    setTimeout(_this.getMenuData, _this.config.interval, _this);
  },

  getDom: function() {
    // Set up the local wrapper
    var wrapper = null;

    // If we have some data to display then build the results table
    if (this.loaded) {
      wrapper = document.createElement("table");

      // Iterate through the schools
      for (var i = 0; i < this.results.length; i++) {

        console.log('i = ' + i);

        // Set up header row with the school name
        schoolRow = document.createElement("tr");

        schoolName = document.createElement("td");
        schoolName.innerHTML = this.results[i].physicalLocation.name;
        console.log(schoolName.innerHTML);

        schoolRow.appendChild(schoolName);

        // Iterate through the cafeteris lines for the school
        for (var j = 0; j < this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data.length; j++) {

          console.log('j = ' + j);

          // Set up header row with the cafeteria line name
          cafeteriaLineRow = document.createElement("tr");

          cafeteriaLineName = document.createElement("td");
          cafeteriaLineName.innerHTML = this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].name;

          cafeteriaLineRow.appendChild(cafeteriaLineName);

          // Iterate through the menu items for the cafeteria line
          for (var k = 0; k < this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data.length; k++) {

            console.log('k = ' + k);

            foodItemRow = document.createElement("tr");

            foodItemType = document.createElement("td");
            foodItemType.innerHTML = this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data[k].item_Type;

            foodItemName = document.createElement("td");
            foodItemName.innerHTML = this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data[k].item_Name;

            foodItemRow.appendChild(foodItemType);
            foodItemRow.appendChild(foodItemName);
          }
        }
      }
    }

    else {
      // Otherwise lets just use a simple div
      wrapper = document.createElement('div');
      wrapper.innerHTML = 'Loading menu data...';
    }

    return wrapper;
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'GOT-MENU-DATA') {
      console.log("returned back to main got menu data");
      this.loaded = true;
      this.results = payload;
      console.log(this.results);
      this.updateDom(1000);
    }
  }
});
