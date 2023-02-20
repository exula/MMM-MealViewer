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
 *   changed className to menuWrapper to allow for style control without interfering with other modules
 *  added config option for showing single or multiple meals based on name, default is All
 *
 * v1.3 2019/11/14- NG
 *  fixed so that updates work. Moved URL setup code is in getMenuData and fixed the setTimeout to  *   work correctly. Thanks sdetweil!
  */

Module.register("MMM-MenuViewer", {
  defaults: {
    schools: [],
    shortName: "",
    maxWidth: "300px",
    updateInterval: 15 * 60 * 1000,
    showNextDayHour: 12,
    showMeal: "Lunch"
  },

  getStyles: function() {
    return ["menuviewer.css", "font-awesome.css"];
  },

  getHeader: function() {
    const self = this;
    const date = self.getMenuDate();
    const meal = self.config.showMeal || "Meals";
    return `${date.day}'s ${meal}`;
  },

  start: function() {
    console.log(`Starting module: ${this.name}`);
    this.loaded = false;
    this.results = [];
    this.getMenuData();
  },

  getMenuData: function() {
    const self = this;
    const date = self.getMenuDate();
    let urls = [];

    // Construct the url array for the schools
    for (let school of self.config.schools) {
      urls.push({
        school: school,
        url: `https://api.mealviewer.com/api/v4/school/${school}/${date.date}/${date.date}/0`
      });
    }

    // Make the initial request to the helper then set up the timer to perform the updates
    self.sendSocketNotification("GET-MENU-DATA", urls);

    setTimeout(() => self.getMenuData(), self.config.updateInterval);
  },

  getDom: function() {
    const self = this;
    const date = self.getMenuDate();
    const showMeal = self.config.showMeal;
    let wrapper = null;

    if (!self.loaded) {
      // While the data is loading
      wrapper = document.createElement("div");
      wrapper.innerHTML = this.translate("LOADING");
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    wrapper = document.createElement("table");
    wrapper.className = "menuWrapper";

    // Iterate through the schools
    for (let school of self.results) {

      // Iterate through the meals and only add for configured meals (match on text from config) default is ALL
      for (let block of school.menuSchedules[0].menuBlocks) {
        if ((showMeal !== "") && (block.blockName !== showMeal)) {
          continue;
        }

        // Set up header row with the meal name if we are showing all meals
        // We may want to revisit this for stlyizing in the future.
        if (this.config.showMeal == "") {
          cafeteriaLineRow = document.createElement("tr");
          cafeteriaLineName = document.createElement("td");
          cafeteriaLineName.colSpan = 2;
          cafeteriaLineName.className = "menuWrapper small";
          cafeteriaLineName.innerHTML = block.blockName;
          cafeteriaLineRow.appendChild(cafeteriaLineName);
          wrapper.appendChild(cafeteriaLineRow);
        }

        for (let line of block.cafeteriaLineList.data) {
          if (line.name.includes("Vegetarian Hot Entree")) {
            // My kids aren't interested in the vegetarian line; removing it for neater display
            continue;
          }

          // Set up header row with the cafeteria line name
          //This isn't in every schol, but it might need to be moved for someone else. Not affecting my view -NG
          cafeteriaLineRow = document.createElement("tr");

          cafeteriaLineName = document.createElement("td");
          cafeteriaLineName.colSpan = 2;
          cafeteriaLineName.className = "menuWrapper small";
          cafeteriaLineName.innerHTML = line.name.replace(this.config.shortName + " Elementary", "Elementary Lunch").replace(this.config.shortName  + " Alternative", "Elementary Alternative");

          cafeteriaLineRow.appendChild(cafeteriaLineName);
          wrapper.appendChild(cafeteriaLineRow);

          foodItemTypePrev = "";

          for (let item of line.foodItemList.data) {
            if (item.item_Name === "Choice Of:") {
              // The menu returns "Choice of" as an entree option; removing it for neater display
              continue;
            }

            // Set up row with the menu item type only if it's the first time we've seen the item type (e.g., entree)
            foodItemRow = document.createElement("tr");

            foodItemTypeCell = document.createElement("td");
            foodItemTypeCell.className = "menuWrapper xsmall align-right";
            if (item.item_Type !== foodItemTypePrev) {
              foodItemTypeCell.innerHTML = item.item_Type;
            }

            if ((!date.today) && (item.item_Name == "NO SCHOOL TODAY")) {
              item.item_Name = item.item_Name.replace("TODAY", date.day.toUpperCase());
            }
            foodItemNameCell = document.createElement("td");
            foodItemNameCell.className = "menuWrapper xsmall align-right";
            foodItemNameCell.innerHTML = item.item_Name;

            foodItemRow.appendChild(foodItemTypeCell);
            foodItemRow.appendChild(foodItemNameCell);
            wrapper.appendChild(foodItemRow);
            foodItemTypePrev = item.item_Type;
          }
        }
      }
    }

    return wrapper;
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "GOT-MENU-DATA") {
      this.loaded = true;
      this.results = payload;
      this.updateDom(1000);
    }
  },

  getMenuDate: function() {
    const self = this;
    let date = new Date();
    const today = date.getDate();

    if (date.getHours() >= self.config.showNextDayHour) {
      date.setDate(date.getDate() + 1);
    }

    if (date.getDay() == 6) {
      date.setDate(date.getDate() + 2);
    } else if (date.getDay() == 0) {
      date.setDate(date.getDate() + 1);
    }

    const yyyy = date.getFullYear();
    const mm = Number(date.getMonth() + 1).toLocaleString(undefined, { "minimumIntegerDigits": 2 });
    const dd = Number(date.getDate()).toLocaleString(undefined, { "minimumIntegerDigits": 2 });
    const day = date.toLocaleString(config.language, { "weekday": "long" });
    return {
      "date": `${mm}-${dd}-${yyyy}`,
      "day": day,
      "today": (today === date.getDate())
    };
  },
});
