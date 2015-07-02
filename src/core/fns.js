var types = require('./types'),
	type = types.type,
	FUNCTION = types.FUNCTION,
	ARRAY = types.ARRAY;
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

function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try {nodes[i].parentNode.removeChild(nodes[i])}
				catch (e) {} //ignore if this fails due to order of events (see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
				cached = [].concat(cached);
				if (cached[i]) unload(cached[i])
			}
		}
		if (nodes.length != 0) nodes.length = 0
	}

function unload(cached) {
		if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) {
			cached.configContext.onunload();
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			for (var i = 0, controller; controller = cached.controllers[i]; i++) {
				if (typeof controller.onunload === FUNCTION) controller.onunload({preventDefault: function(){}});
			}
		}
		if (cached.children) {
			if (type.call(cached.children) === ARRAY) {
				for (var i = 0, child; child = cached.children[i]; i++) unload(child)
			}
			else if (cached.children.tag) unload(cached.children)
		}
	}

var nodeCache = [];
function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element);
		return index < 0 ? nodeCache.push(element) - 1 : index
}

module.exports = {
	propify: propify,
	prop: prop,
	clear: clear,
	unload: unload,
	getCellCacheKey: getCellCacheKey
}
