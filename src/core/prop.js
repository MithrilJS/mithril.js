var types = require('./types'),
	type = types.type,
	FUNCTION = types.FUNCTION,
	OBJECT = types.OBJECT;

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

function prop(store) {
	//note: using non-strict equality check here because we're checking if store is null OR undefined
	if (((store != null && type.call(store) === OBJECT) || typeof store === FUNCTION) && typeof store.then === FUNCTION) {
		return propify(store)
	}

	return gettersetter(store)
};

function propify(promise, initialValue) {
		var _prop = prop(initialValue);
		promise.then(_prop);
		_prop.then = function(resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		};
		_prop.catch = _prop.then.bind(null, null)
		return _prop
	}

module.exports = {
	propify: propify,
	prop: prop
}
