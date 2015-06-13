var m = {};

var types = require('../core/types'),
	type = types.type,
	FUNCTION = types.FUNCTION,
	OBJECT = types.OBJECT;

var propify = require('../core/fns').propify;

m.withAttr = function(prop, withAttrCallback) {
	return function(e) {
		e = e || event;
		var currentTarget = e.currentTarget || this;
		withAttrCallback(prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop))
	}
};

function gettersetter(store) {
	var prop = function() {
		if (arguments.length) store = arguments[0];
		return store
	};

	prop.toJSON = function() {
		return store
	};

	return prop
}

m.prop = function (store) {
	//note: using non-strict equality check here because we're checking if store is null OR undefined
	if (((store != null && type.call(store) === OBJECT) || typeof store === FUNCTION) && typeof store.then === FUNCTION) {
		return propify(store)
	}

	return gettersetter(store)
};

module.exports = m;
