/* Module */

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

Module.register("MMM-MenuViewer",{
  defaults: {
    schools: [],
    //showDays: 2,
    maxWidth: "300px",
    useHeader: false,
    updateInterval: 5 * 60 * 1000,
    animationSpeed: 10,
    initialLoadDelay: 1875,
    retryDelay: 1500,
    rotateInterval: 5 * 1000,
    interval: 900000,  	// 15 minutes
  },

  getStyles: function() {
      return ["MenuViewer.css", 'font-awesome.css'];
  },

  getScripts: function() {
    return ["moment.js"];
  },

  start:  function() {
    Log.log('Starting module: ' + this.name);

    // Set up the local values
    var today = moment();
    if (today.hour() >= 12) {
      var todayFormatted = today.add(1, 'day').format('MM-DD-YYYY');
      console.log(todayFormatted);
    }
    else {
      var todayFormatted = today.format('MM-DD-YYYY');
      console.log(todayFormatted);
    }
    //var endDay = today.add(config.showDays, 'days');
    //var endDayFormatted = endDay.format('MM-DD-YYYY');
    var endDayFormatted = todayFormatted;
    this.loaded = false;
    this.urls = [];

    for (var i in this.config.schools) {
			this.urls.push({school: this.config.schools[i], url: 'https://api.mealviewer.com/api/v4/school/' + this.config.schools[i] + '/' + todayFormatted + '/' + endDayFormatted + '/'});
    }

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

    var today = moment();
    if (today.hour() >= 12) {
      today = today.add(1, 'day');
    }

    // Determine if it's a weekday
    if (today.day() > 0 && today.day() < 6) {

      // If we have some data to display then build the results table
      if (this.loaded) {
        wrapper = document.createElement("table");

        // Iterate through the schools
        for (var i = 0; i < this.results.length; i++) {

          // Iterate through the cafeteria lines for the school
          for (var j = 0; j < this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data.length; j++) {

            if (this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].name !== 'Elmwood Vegetarian Hot Entree') {

              // Set up header row with the cafeteria line name
              cafeteriaLineRow = document.createElement("tr");

              cafeteriaLineName = document.createElement("td");
              cafeteriaLineName.colSpan = 2;
              cafeteriaLineName.className = "cafeterialine";
              cafeteriaLineName.innerHTML = this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].name.replace("Elmwood Elementary", "Elementary Lunch").replace("Elmwood Alternative", "Elementary Alternative");

              cafeteriaLineRow.appendChild(cafeteriaLineName);
              wrapper.appendChild(cafeteriaLineRow);

              foodItemTypePrev = '';

              // Iterate through the menu items for the cafeteria line
              for (var k = 0; k < this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data.length; k++) {

                if (this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data[k].item_Name !== 'Choice Of:') {

                  if (this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data[k].item_Type !== foodItemTypePrev) {

                    foodItemRow = document.createElement("tr");

                    foodItemTypeCell = document.createElement("td");
                    foodItemTypeCell.className = "fooditemtype";
                    foodItemTypeCell.innerHTML = this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data[k].item_Type;

                    foodItemTypePrev = this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data[k].item_Type;

                    foodItemNameCell = document.createElement("td");
                    foodItemNameCell.className = "fooditemname bright";
                    foodItemNameCell.innerHTML = this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data[k].item_Name;

                    foodItemRow.appendChild(foodItemTypeCell);
                    foodItemRow.appendChild(foodItemNameCell);
                    wrapper.appendChild(foodItemRow);
                  }
                  else {

                    foodItemRow = document.createElement("tr");

                    foodItemTypeCell = document.createElement("td");
                    foodItemTypeCell.innerHTML = '';

                    foodItemNameCell = document.createElement("td");
                    foodItemNameCell.className = "fooditemname bright";
                    foodItemNameCell.innerHTML = this.results[i].menuSchedules[0].menuBlocks[0].cafeteriaLineList.data[j].foodItemList.data[k].item_Name;

                    foodItemRow.appendChild(foodItemTypeCell);
                    foodItemRow.appendChild(foodItemNameCell);
                    wrapper.appendChild(foodItemRow);
                  }
                }
              }
            }
          }
        }
      }

      else {
        // Otherwise lets just use a simple div
        wrapper = document.createElement('div');
        wrapper.innerHTML = 'Loading menu data...';
      }
    }

    else {
      wrapper = document.createElement('div');
      wrapper.innerHTML = 'Enjoy the weekend!';
    }

    return wrapper;
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'GOT-MENU-DATA') {
      console.log('GOT-MENU-DATA received');
      this.loaded = true;
      this.results = payload;
      this.updateDom(1000);
      console.log('updated DOM');
    }
  }
});
