"use strict"
{
function Promise(executor) {
	if (!(this instanceof Promise)) throw new Error("Promise must be called with `new`")
	if (typeof executor !== "function") throw new Error("executor must be a function")
	
	var self = this, resolvers = [], rejectors = [], resolveCurrent = handler(resolvers, true), rejectCurrent = handler(rejectors, false)
	function handler(list, shouldAbsorb) {
		var done = false
		return function execute(value) {
			if (done) return
			done = true

			var then
			try {
				if (shouldAbsorb && value != null && (typeof value === "object" || typeof value === "function") && typeof (then = value.then) === "function") {
					if (value === self) rejectCurrent(new TypeError("Promise can't be resolved w/ itself"))
					then.call(value, handler(list, shouldAbsorb), rejectCurrent)
				}
				else {
					setTimeout(function() {
						for (var i = 0; i < list.length; i++) list[i](value)
						instance.retry = function() {
							done = false
							execute(value)
						}
					}, 0)
				}
			}
			catch (e) {
				rejectCurrent(e)
			}
		}
	}
	var instance = this._instance = {resolvers: resolvers, rejectors: rejectors}
	
	try {executor(resolveCurrent, rejectCurrent)} catch (e) {rejectCurrent(e)}
}
Promise.prototype.then = function(onFulfilled, onRejection) {
	var self = this
	function handle(callback, list, next, state) {
		list.push(function(value) {
			if (typeof callback !== "function") next(value)
			try {resolveNext(callback(value))} catch (e) {if (rejectNext) rejectNext(e)}
		})
		var retry = self._instance.retry
		if (retry) retry()
	}
	var resolveNext, rejectNext
	var promise = new Promise(function(resolve, reject) {resolveNext = resolve, rejectNext = reject})
	handle(onFulfilled, this._instance.resolvers, resolveNext, true), handle(onRejection, this._instance.rejectors, rejectNext, false)
	return promise
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
				var then
				if (list[i] != null && (typeof list[i] === "object" || typeof list[i] === "function") && typeof (then = list[i].then) === "function") {
					then.call(list[i], consume, reject)
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
}