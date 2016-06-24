(function (exports) {

  'use strict';

  var STORAGE_KEY = 'v-coding';

  exports.ls = {
    setItem: function (key, value) {
      return window.localStorage.setItem(key, JSON.stringify(value))
    },

    getItem: function (key) {
      if (window.localStorage.getItem(key) === undefined) {
        return {}
      }
      return JSON.parse(window.localStorage.getItem(key))
    },

    removeItem: function (key) {
      return Store.setItem(key, {})
    },

    clear: function () {
      window.localStorage.clear()
    }
  }

})(window);