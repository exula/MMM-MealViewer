/* Module */

/* Magic Mirror
 * Module: MMM-MealViewer
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

function el(tag, options) {
  const result = document.createElement(tag);

  options = options || {};
  for (const key in options) {
    result[key] = options[key];
  }

  return result;
}

Module.register("MMM-MealViewer", {
  defaults: {
    schools: [],
    maxWidth: "300px",
    updateInterval: 15 * 60 * 1000,
    showNextDayHour: 12,
    showMeal: null,
    hideTypes: [],
  },

  getStyles: function() {
    return ["MMM-MealViewer.css"];
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
    let row, cell;

    if (!self.loaded) {
      // While the data is loading
      return el("div", { innerHTML: this.translate("LOADING"), className: "dimmed light small" });
    }

    const wrapper = el("table", { className: "menuWrapper" });

    // Iterate through the schools
    for (let school of self.results) {
      const locationNames = school.physicalLocation.locations.map((loc) => loc.name);

      if (self.showSchoolHeaders()) {
        row = el("tr");
        cell = el("td", { colSpan: 2, className: "small", innerHTML: school.physicalLocation.name });
        row.appendChild(cell);
        wrapper.appendChild(row);
      }

      // Iterate through the meals and only add for configured meals (match on text from config) default is ALL
      for (let block of school.menuSchedules[0].menuBlocks) {
        if (!self.showBlock(block)) {
          continue;
        }

        // Set up header row with the meal name if we are showing all meals
        // We may want to revisit this for stlyizing in the future.
        if (self.showMealHeaders()) {
          row = el("tr");
          cell = el("td", { colSpan: 2, className: "small", innerHTML: block.blockName });
          row.appendChild(cell);
          wrapper.appendChild(row);
        }

        for (let line of block.cafeteriaLineList.data) {
          if (line.name.includes("Vegetarian Hot Entree")) {
            // My kids aren't interested in the vegetarian line; removing it for neater display
            continue;
          }

          // Set up header row with the cafeteria line name
          // This isn't in every school, but it might need to be moved for someone else. Not affecting my view -NG
          row = el("tr");
          cell = el("td", { colSpan: 2, className: "small", innerHTML: line.name });
          row.appendChild(cell);
          wrapper.appendChild(row);

          let lastFoodItemType = null;
          const items = line.foodItemList.data.filter((item) => {
            // The menu returns "Choice of" as an entree option; removing it for neater display
            if (item.item_Name === "Choice Of") {
              return false;
            }
            if (self.config.hideTypes.includes(item.item_Type)) {
              return false;
            }

            for (let locationName of locationNames) {
              if (item.menu_Name.includes(locationName)) {
                return true;
              }
            }
            // If there is no location name, show the menu
            if (item.location_Name == null) {
              return true;
            }

            return false;
          });

          for (let item of items) {
            // Set up row with the menu item type only if it's the first time we've seen the item type (e.g., entree)
            row = el("tr");

            cell = el("td", { className: "fooditemtype xsmall" });
            if (item.item_Type !== lastFoodItemType) {
              cell.innerHTML = item.item_Type;
            }
            row.appendChild(cell);

            if ((!date.today) && (item.item_Name == "NO SCHOOL TODAY")) {
              item.item_Name = item.item_Name.replace("TODAY", date.day.toUpperCase());
            }
            cell = el("td", { className: "xsmall", innerHTML: item.item_Name });
            row.appendChild(cell);

            wrapper.appendChild(row);
            lastFoodItemType = item.item_Type;
          }
        }
      }
    }
    console.log(wrapper);
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

  showSchoolHeaders: function(school) {
    return (this.config.schools.length > 1);
  },

  showBlock: function(block) {
    const showMeal = this.config.showMeal;

    if ((showMeal === null) || (showMeal === "")) {
      return true;
    }

    if (block.blockName === showMeal) {
      return true;
    }

    if (Array.isArray(showMeal) && showMeal.includes(block.blockName)) {
      return true;
    }

    return false;
  },

  showMealHeaders: function() {
    const showMeal = this.config.showMeal;

    if ((showMeal === null) || (showMeal === "")) {
      return true;
    }

    if (Array.isArray(showMeal) && (showMeal.length > 1)) {
      return true;
    }

    return false;
  },
});
