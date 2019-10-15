/* Module */

/* Magic Mirror
 * Module: MMM-MenuViewer
 *
 * A Magic Mirror Module to pull school lunch menu data from mealviewer.com
 *
 * By Jerry Kazanjian kazanjig@gmail.com
 * v1.1 2019/02/20
 * MIT Licensed.
 * 
 * v1.2 2019/10/14 -NG
 *  added shortName to config to replace text based on config option instead of hardcoded
 * 	changed className to menuWrapper to allow for style control without interfering with other modules
 *	added config option for showing single or multiple meals based on name, default is All
 *
 */

Module.register("MMM-MenuViewer",{
  defaults: {
    schools: [],
    shortName: "",
    maxWidth: "300px",
    updateInterval: 5 * 60 * 1000,
    interval: 1000 * 60 * 15,
    showMeal : "" //Display which meal, leave blank for all
      },

  getStyles: function() {
      return ["menuviewer.css", 'font-awesome.css'];
  },

  getScripts: function() {
    return ["moment.js"];
  },

  // Override getHeader method to display today/tomorrow
	getHeader: function() {
		//Pick up info from what meals are being displayed
		if (this.config.showMeal == ""){
			this.data.header = "Meals"}
			else
			{
			this.data.header = this.config.showMeal
			}
	    if (moment().hour() >= 12) {
			return "Tomorrow's " + this.data.header;
		}
		return "Today's " + this.data.header;
	},

  start:  function() {
    Log.log('Starting module: ' + this.name);

    // Set up the local values
    var today = moment();
    this.loaded = false;
    this.urls = [];
    this.results = [];

    // Uses now are today if before noon and tomorrow as today if after noon
    if (today.hour() >= 12) {
      var todayFormatted = today.add(1, 'day').format('MM-DD-YYYY');
    }
    else {
      var todayFormatted = today.format('MM-DD-YYYY');
    }

    // Currently set to only pull one day's data so endDayFormatted = todayFormatted
    //var endDay = today.add(config.showDays, 'days');
    //var endDayFormatted = endDay.format('MM-DD-YYYY');
    var endDayFormatted = todayFormatted;

    // Construct the url array for the schools
    for (var i in this.config.schools) {
			this.urls.push({school: this.config.schools[i], url: 'https://api.mealviewer.com/api/v4/school/' + this.config.schools[i] + '/' + todayFormatted + '/' + endDayFormatted + '/'});
    }

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

    // Similar to above, needs to know if today is now or tomorrow for text manipulation
    var today = moment();
    if (today.hour() >= 12) {
      today = today.add(1, 'day');
    }

    // Determine if "today" is a weekday, otherwise there's no menu data
    if (today.day() > 0 && today.day() < 6) {

      // If we have some data to display then build the results table
      if (this.loaded) {
        wrapper = document.createElement("table");
        wrapper.className = "menuWrapper";

        // Iterate through the schools
        for (var i = 0; i < this.results.length; i++) {

          //Iterate through the meals and only add for configured meals (match on text from config) default is ALL
		  for (var l = 0; l < this.results[i].menuSchedules[0].menuBlocks.length; l++) {
      			  if (this.results[i].menuSchedules[0].menuBlocks[l].blockName == this.config.showMeal || this.config.showMeal == "") {
     						
     						// Set up header row with the meal name if we are showing all meals
     						//We may want to revisit this for stlyizing in the future. 
								if (this.config.showMeal == "") {
     								cafeteriaLineRow = document.createElement("tr");
									cafeteriaLineName = document.createElement("td");
									cafeteriaLineName.colSpan = 2;
									cafeteriaLineName.className = "menuWrapper small";
									cafeteriaLineName.innerHTML = this.results[i].menuSchedules[0].menuBlocks[l].blockName;
									cafeteriaLineRow.appendChild(cafeteriaLineName);
									wrapper.appendChild(cafeteriaLineRow);

								}
							// Iterate through the cafeterialines[j] for school[i]
							for (var j = 0; j < this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data.length; j++) {
								
								// My kids aren't interested in the vegetarian line; removing it for neater display
								if (this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].name !== this.config.shortName  + ' Vegetarian Hot Entree') {

									// Set up header row with the cafeteria line name
									//This isn't in every schol, but it might need to be moved for someone else. Not affecting my view -NG
									cafeteriaLineRow = document.createElement("tr");

									cafeteriaLineName = document.createElement("td");
									cafeteriaLineName.colSpan = 2;
									cafeteriaLineName.className = "menuWrapper small";
									cafeteriaLineName.innerHTML = this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].name.replace(this.config.shortName  + " Elementary", "Elementary Lunch").replace(this.config.shortName  + " Alternative", "Elementary Alternative");

									cafeteriaLineRow.appendChild(cafeteriaLineName);
									wrapper.appendChild(cafeteriaLineRow);

									foodItemTypePrev = '';

									// Iterate through the menuitems[k] for the cafeterialine[j] for the school[i]
									for (var k = 0; k < this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].foodItemList.data.length; k++) {

										// The menu returns "Choice of" as an entree option; removing it for neater display
										if (this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].foodItemList.data[k].item_Name !== 'Choice Of:') {

											// Set up row with the menu item type only if it's the first time we've seen the item type (e.g., entree)
											if (this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].foodItemList.data[k].item_Type !== foodItemTypePrev) {

												foodItemRow = document.createElement("tr");

												foodItemTypeCell = document.createElement("td");
												foodItemTypeCell.className = "menuWrapper xsmall align-right";
												foodItemTypeCell.innerHTML = this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].foodItemList.data[k].item_Type;

												foodItemTypePrev = this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].foodItemList.data[k].item_Type;
											}

											// If we've seen the item type previously, do not display it
											else {
												foodItemRow = document.createElement("tr");
												foodItemTypeCell = document.createElement("td");
												foodItemTypeCell.className = "menuWrapper xsmall align-right";
												foodItemTypeCell.innerHTML = '';
											}

											foodItemNameCell = document.createElement("td");
											foodItemNameCell.className = "menuWrapper xsmall align-right";

											// If there's no school on a weekday, manipulate "today" text as "tomorrow" if previous day after noon
											if (today.hour() >= 12 && this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].foodItemList.data[k].item_Name == 'NO SCHOOL TODAY') {
												foodItemNameCell.innerHTML = this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].foodItemList.data[k].item_Name.replace("TODAY", "TOMORROW");
											}
											else {
												foodItemNameCell.innerHTML = this.results[i].menuSchedules[0].menuBlocks[l].cafeteriaLineList.data[j].foodItemList.data[k].item_Name;
											}

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
      		}

      else {
        // While the data is loading
        wrapper = document.createElement('div');
        wrapper.innerHTML = this.translate("LOADING");
        wrapper.className = "dimmed light small";
      }
    }

    // If not a weekday
    else {
      wrapper = document.createElement('div');
      wrapper.innerHTML = 'Enjoy the weekend!';
    }

    return wrapper;
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'GOT-MENU-DATA') {
      this.loaded = true;
      this.results = payload;
      this.updateDom(1000);
    }
  }
});
