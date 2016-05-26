"use strict"

function Promise(executor) {
	if (!(this instanceof Promise)) throw new Error("Promise must be called with `new`")
	if (typeof executor !== "function") throw new Error("executor must be a function")
	
	var self = this, resolvers = [], rejectors = [], resolveCurrent = handler(resolvers, true), rejectCurrent = handler(rejectors, false)
	function handler(list, shouldAbsorb) {
		return function execute(value) {
			if (shouldAbsorb && (typeof value === "object" || typeof value === "function") && typeof value.then === "function") {
				if (value === self) rejectCurrent(new Error("Promise cannot be resolved with itself"))
				value.then(execute, rejectCurrent)
			}
			else {
				setTimeout(function() {
					for (var i = 0; i < list.length; i++) list[i](value)
					resolvers.length = 0, rejectors.length = 0
				}, 0)
			}
		}
	}
	
	this._instance = {resolvers: resolvers, rejectors: rejectors}
	try {executor(resolveCurrent, rejectCurrent)} catch (e) {rejectCurrent(e)}
}
Promise.prototype.then = function(onFulfilled, onRejection) {
	function handle(callback, list) {
		if (typeof callback === "function") {
			list.push(function(value) {
				try {resolveNext(callback(value))} catch (e) {if (rejectNext) rejectNext(e)}
			})
		}
	}
	var resolveNext, rejectNext
	handle(onFulfilled, this._instance.resolvers), handle(onRejection, this._instance.rejectors)
	return new Promise(function(resolve, reject) {resolveNext = resolve, rejectNext = reject})
}
Promise.prototype.catch = function(onRejection) {
	return this.then(null, onRejection)
}
Promise.resolve = function(value) {
	if (value instanceof Promise) return value
	return new Promise(function(resolve, reject) {resolve(value)})
}
Promise.reject = function(value) {
	return new Promise(function(resolve, reject) {reject(value)})
}
Promise.all = function(list) {
	return new Promise(function(resolve, reject) {
		var total = list.length, count = 0, values = []
		for (var i = 0; i < list.length; i++) {
			new function(i) {
				function consume(value) {
					count++
					values[i] = value
					if (count === total) resolve(values)
				}
				if ((typeof list[i] === "object" || typeof list[i] === "function") && typeof list[i].then === "function") {
					list[i].then(consume, reject)
				}
				else consume(list[i])
			}(i)
		}
	})
}
Promise.race = function(list) {
	return new Promise(function(resolve, reject) {
		for (var i = 0; i < list.length; i++) {
			list[i].then(resolve, reject)
		}
	})
}

module.exports = Promise
