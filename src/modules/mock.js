var $ = require('../core/init');

exports.deps = function(mock) {
	$.initialize(window = mock || window);
	return window;
}
