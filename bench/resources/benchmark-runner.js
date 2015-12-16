(function (global) { // eslint-disable-line max-statements
	"use strict"
	var m = global.m

	window.onhashchange = function () {
		location.reload()
	}

	global.BenchmarkTestStep = BenchmarkTestStep
	function BenchmarkTestStep(name, run) {
		this.name = name
		this.run = run
	}

	global.BenchmarkRunner = BenchmarkRunner
	function BenchmarkRunner(suites, client) {
		this._suites = suites
		this._prepareReturnValue = null
		this._measuredValues = {}
		this._client = client
	}

	BenchmarkRunner.prototype.waitForElement = function (selector) {
		var deferred = m.deferred()
		var contentDocument = this._frame.contentDocument

		function resolveIfReady() {
			var element = contentDocument.querySelector(selector)
			if (element) {
				return deferred.resolve(element)
			}
			setTimeout(resolveIfReady, 50)
		}

		resolveIfReady()
		return deferred.promise
	}

	BenchmarkRunner.prototype._removeFrame = function () {
		if (this._frame) {
			this._frame.parentNode.removeChild(this._frame)
			this._frame = null
		}
	}

	BenchmarkRunner.prototype._appendFrame = function () {
		var frame = document.createElement("iframe")
		frame.style.width = "800px"
		frame.style.height = "600px"
		document.body.appendChild(frame)
		this._frame = frame
		return frame
	}

	BenchmarkRunner.prototype._waitAndWarmUp = function () {
		var startTime = Date.now()

		function Fibonacci(n) {
			if (Date.now() - startTime > 100) return
			else if (n <= 0) return 0
			else if (n === 1) return 1
			else return Fibonacci(n - 2) + Fibonacci(n - 1)
		}

		var deferred = m.deferred()
		setTimeout(function () {
			Fibonacci(100)
			deferred.resolve()
		}, 200)
		return deferred.promise
	}

	var now = window.performance && window.performance.now ?
		function () { return window.performance.now() } :
		function () { return +new Date() }

	function logResults(document, expected, suite, test, callback) {
		var count = document.querySelectorAll(".view").length
		if (count !== expected) {
			console.error([ // eslint-disable-line no-console
				suite.name,
				test.name,
				"expected",
				expected,
				"got",
				count
			])
			callback(NaN, NaN)
		}
	}

	// This function must be as simple as possible, so it doesn't interfere
	// with reading the times
	BenchmarkRunner.prototype._runTest = function (
		suite,
		test,
		prepareReturnValue,
		callback
	) {
		var testFunction = test.run

		var window = this._frame.contentWindow
		var document = this._frame.contentDocument
		var expected = this._client.numberOfItemsToAdd

		var startTime = now()
		testFunction(prepareReturnValue, window, document)
		var endTime = now()
		var syncTime = endTime - startTime

		startTime = now()
		setTimeout(function () {
			setTimeout(function () {
				var endTime = now()

				// if the DOM count is wrong after a test, don't report its
				// results.
				if (/Adding|Completing/.test(test.name)) {
					logResults(document, expected, suite, test, callback)
				}

				if (/Deleting/.test(test.name)) {
					logResults(document, 0, suite, test, callback)
				}

				callback(syncTime, endTime - startTime)
			}, 0)
		}, 0)
	}

	function BenchmarkState(suites) {
		this._suites = suites
		this._suiteIndex = -1
		this._testIndex = 0
		this.next()
	}

	BenchmarkState.prototype.currentSuite = function () {
		return this._suites[this._suiteIndex]
	}

	BenchmarkState.prototype.currentTest = function () {
		var suite = this.currentSuite()
		return suite ? suite.tests[this._testIndex] : null
	}

	BenchmarkState.prototype.next = function () {
		this._testIndex++

		var suite = this._suites[this._suiteIndex]
		if (suite && this._testIndex < suite.tests.length) {
			return this
		}

		this._testIndex = 0

		var i = this._suiteIndex
		var suites = this._suites

		do {
			i++
		} while (i < suites.length && suites[i].disabled)

		this._suiteIndex = i

		return this
	}

	BenchmarkState.prototype.isFirstTest = function () {
		return !this._testIndex
	}

	BenchmarkState.prototype.prepareCurrentSuite = function (runner, frame) {
		var suite = this.currentSuite()
		var deferred = m.deferred()
		frame.onload = function () {
			suite.prepare(runner, frame.contentWindow, frame.contentDocument)
				.then(function (result) {
					deferred.resolve(result)
				}, function (err) {
					deferred.reject(err)
				})
		}
		frame.src = suite.url
		return deferred.promise
	}

	BenchmarkRunner.prototype.step = function (state) {
		if (!state) {
			state = new BenchmarkState(this._suites)
		}

		var suite = state.currentSuite()
		if (!suite) {
			this._finalize()
			var deferred = m.deferred()
			deferred.resolve()
			return deferred.promise
		}

		if (state.isFirstTest()) {
			this._masuredValuesForCurrentSuite = {}
			var self = this
			return state.prepareCurrentSuite(this, this._appendFrame())
			.then(function (prepareReturnValue) {
				self._prepareReturnValue = prepareReturnValue
				return self._runTestAndRecordResults(state)
			})
		}

		return this._runTestAndRecordResults(state)
	}

	BenchmarkRunner.prototype._runTestAndRecordResults = function (state) {
		var deferred = m.deferred()
		var suite = state.currentSuite()
		var test = state.currentTest()

		if (this._client && this._client.willRunTest) {
			this._client.willRunTest(suite, test)
		}

		var self = this
		setTimeout(function () {
			self._runTest(suite, test, self._prepareReturnValue,
			function (syncTime, asyncTime) {
				var suiteResults
				if (self._measuredValues[suite.name]) {
					suiteResults = self._measuredValues[suite.name]
				} else {
					suiteResults = {tests: {}, total: 0}
				}

				self._measuredValues[suite.name] = suiteResults

				suiteResults.tests[test.name] = {
					Sync: syncTime,
					Async: asyncTime
				}

				suiteResults.total += syncTime + asyncTime

				if (self._client && self._client.willRunTest) {
					self._client.didRunTest(suite, test)
				}

				state.next()
				if (state.currentSuite() !== suite) {
					self._removeFrame()
				}

				deferred.resolve(state)
			})
		}, 0)
		return deferred.promise
	}

	BenchmarkRunner.prototype._finalize = function () {
		this._removeFrame()

		if (this._client && this._client.didRunSuites) {
			this._client.didRunSuites(this._measuredValues)
		}

		// FIXME: This should be done when we start running tests.
		this._measuredValues = {}
	}
})(this)
