var $ = {
	initialize: initialize
};

// self invoking function needed because of the way mocks work
function initialize(window){
	$.document = window.document;
	$.location = window.location;
	$.cancelAnimationFrame = window.cancelAnimationFrame || window.clearTimeout;
	$.requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;

}

initialize(typeof window !== 'undefined' ? window : {});

module.exports = $;
