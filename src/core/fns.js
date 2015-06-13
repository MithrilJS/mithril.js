var types = require('./types'),
	type = types.type,
	FUNCTION = types.FUNCTION,
	ARRAY = types.ARRAY;
	OBJECT = types.OBJECT;

var noop = function(){};

function propify(promise, initialValue) {
		var prop = m.prop(initialValue);
		promise.then(prop);
		prop.then = function(resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		};
		prop.catch = prop.then.bind(null, null)
		return prop
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
				if (typeof controller.onunload === FUNCTION) controller.onunload({preventDefault: noop});
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

function parseQueryString(str) {
	if (str.charAt(0) === "?") str = str.substring(1);
	
	var pairs = str.split("&"), params = {};
	for (var i = 0, len = pairs.length; i < len; i++) {
		var pair = pairs[i].split("=");
		var key = decodeURIComponent(pair[0])
		var value = pair.length == 2 ? decodeURIComponent(pair[1]) : null
		if (params[key] != null) {
			if (type.call(params[key]) !== ARRAY) params[key] = [params[key]]
			params[key].push(value)
		}
		else params[key] = value
	}
	return params
}

function buildQueryString(object, prefix) {
	var duplicates = {}
	var str = []
	for (var prop in object) {
		var key = prefix ? prefix + "[" + prop + "]" : prop
		var value = object[prop]
		var valueType = type.call(value)
		var pair = (value === null) ? encodeURIComponent(key) :
			valueType === OBJECT ? buildQueryString(value, key) :
			valueType === ARRAY ? value.reduce(function(memo, item) {
				if (!duplicates[key]) duplicates[key] = {}
				if (!duplicates[key][item]) {
					duplicates[key][item] = true
					return memo.concat(encodeURIComponent(key) + "=" + encodeURIComponent(item))
				}
				return memo
			}, []).join("&") :
			encodeURIComponent(key) + "=" + encodeURIComponent(value)
		if (value !== undefined) str.push(pair)
	}
	return str.join("&")
}

module.exports = {
	propify: propify,
	clear: clear,
	unload: unload,
	getCellCacheKey: getCellCacheKey,
	buildQueryString: buildQueryString,
	parseQueryString: parseQueryString
}
