var $ = require('../core/init');

var m = {
	deps: function(mock) {
		$.initialize(window = mock || window);
		return window;
	}
}

module.exports = m;
