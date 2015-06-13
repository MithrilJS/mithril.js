var assign = require('./helpers/Object.assign');

var m = require('./modules/DOM');

assign(m, 
	require('./modules/router'), 
	require('./modules/utils'), 
	require('./modules/http'),
	require('./modules/mock')
);

if (typeof global != "undefined") global.m = m;

if (typeof module != "undefined" && module !== null && module.exports) module.exports = m;
else if (typeof define === "function" && define.amd) define(function() {return m});
else if (typeof window != "undefined") window.m = m;
