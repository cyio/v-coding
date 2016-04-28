(function (exports) {

	'use strict';

	var STORAGE_KEY = 'v-coding';

	exports.vCodingStorage = {
		fetch: function () {
			return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
		},
		save: function (data) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}
	};

})(window);