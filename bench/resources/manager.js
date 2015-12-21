/* global m */
/* eslint no-console: 0 */

(function (global) { // eslint-disable-line max-statements
	"use strict"

	var numberOfItemsToAdd = (~~location.hash.slice(1)) || 250
	var runs = []
	var timesRan = 0
	var runButton

	function forOwn(object, f) {
		for (var key in object) {
			if ({}.hasOwnProperty.call(object, key)) {
				f(object[key], key)
			}
		}
	}

	var append = Function.call.bind(function append() {
		/* eslint-disable no-invalid-this */
		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i]
			if (Array.isArray(arg)) append.apply(this, arg)
			else this.appendChild(arg)
		}
		return this
		/* eslint-enable no-invalid-this */
	})

	function n(type, attrs) {
		var el = document.createElement(type)
		if (!attrs) return el
		forOwn(attrs, function (value, attr) {
			if (attr === "style") {
				forOwn(value, function (k, v) { el.style[k] = v })
			} else {
				el[attr] = value
			}
		})
		return el
	}

	function createButton(text, onclick) {
		return n("button", {textContent: text, onclick: onclick})
	}

	function createTest(suite, test) {
		return append(n("li"),
			append(test.anchor = n("a", {id: suite.name + "-" + test.name}),
				document.createTextNode(suite.name + "/" + test.name)))
	}

	function createSuiteCheckbox(suite) {
		return n("input", {
			id: suite.name,
			type: "checkbox",
			checked: true,
			onchange: function () {
				suite.disabled = !this.checked
			}
		})
	}

	function createSuiteLabel(suite) {
		return append(n("label", {htmlFor: suite.name}),
			document.createTextNode(suite.name + " " + suite.version))
	}

	function createSuite(suite) {
		return append(n("li"),
			createSuiteCheckbox(suite),
			createSuiteLabel(suite),
			append(n("ol"), suite.tests.map(createTest.bind(null, suite))))
	}

	function createUIForSuites(suites, onstep, onrun) {
		return append(n("nav"),
			createButton("Step Tests", onstep),
			runButton = createButton("Run All", onrun),
			append(n("ol"), suites.map(createSuite)))
	}

	function generateResults(measured, timesToRun) {
		var result = ""
		var total = 0 // FIXME: Compute the total properly.

		forOwn(measured, function (suiteResults, suite) {
			forOwn(suiteResults.tests, function (testResults, test) {
				forOwn(testResults, function (subtestResults, subtest) {
					result += suite + " : " + test + " : " + subtest + ": " +
						subtestResults + " ms\n"
				})
			})
			result += suite + " : " + suiteResults.total + " ms\n"
			total += suiteResults.total
		})
		return result + "Run " + (runs.length + 1) + "/" + timesToRun +
			" - Total : " + total + " ms\n"
	}

	function reportFastest() {
		var results = {}
		runs.forEach(function (runData) {
			forOwn(runData, function (data, key) {
				results[key] = Math.min(
					results[key] || Infinity,
					data.total
				)
			})
		})
		return results
	}

	global.google.load("visualization", "1", {packages: ["corechart"]})
	function drawChart(results) {
		var V = global.google.visualization

		var raw = []
		forOwn(results, function (result, key) {
			raw.push([key, Math.round(result), colorify(key)])
		})
		raw.sort(function (a, b) { return a[1] - b[1] })
		raw.unshift(["Project", "Time", {role: "style"}])

		var runWord = "run" + (runs.length > 1 ? "s" : "")
		var title = "Best time in milliseconds over " + runs.length + " " +
			runWord + " (lower is better)"

		var view = new V.DataView(V.arrayToDataTable(raw))
		view.setColumns([0, 1, {
			calc: "stringify",
			sourceColumn: 1,
			type: "string",
			role: "annotation"
		}, 2])

		document.getElementById("analysis").style.display = "block"

		new V.BarChart(document.getElementById("barchart-values")).draw(view, {
			title: "TodoMVC Benchmark",
			width: 600,
			height: 400,
			legend: {position: "none"},
			backgroundColor: "transparent",
			hAxis: {title: title},
			min: 0,
			max: 1500
		})
	}

	function colorPart(n, pre) {
		return Math.max(
			0,
			((n.toLowerCase().charCodeAt(pre % n.length) - 97) / 26 * 255) | 0
		)
	}

	function colorify(n) {
		return "rgb(" +
			colorPart(n, 3) + ", " +
			colorPart(n, 4) + ", " +
			colorPart(n, 5) + ")"
	}

	function shuffle(ary) {
		for (var i = 0; i < ary.length; i++) {
			var j = Math.floor(Math.random() * (i + 1))
			var tmp = ary[i]
			ary[i] = ary[j]
			ary[j] = tmp
		}
	}

	window.addEventListener("load", function () {
		var match = window.location.search.match(/[\?&]r=(\d+)/)
		var timesToRun = match ? +(match[1]) : 1

		var Suites = global.Suites.map(function (suite) {
			suite = suite(numberOfItemsToAdd)
			suite.disabled = false
			return suite
		})

		var runner = new global.BenchmarkRunner(Suites, {
			numberOfItemsToAdd: numberOfItemsToAdd,

			willRunTest: function (suite, test) {
				if (test.anchor.classList) {
					test.anchor.classList.add("running")
				}
			},

			didRunTest: function (suite, test) {
				if (test.anchor.classList) {
					test.anchor.classList.remove("running")
					test.anchor.classList.add("ran")
				}
			},

			didRunSuites: function (measured) {
				var results = generateResults(measured, timesToRun)
				if (results) {
					console.log(results)

					runs.push(measured)
					timesRan++
					if (timesRan >= timesToRun) {
						timesRan = 0
						drawChart(reportFastest())
						shuffle(Suites)
					} else {
						setTimeout(function () {
							runButton.click()
						}, 0)
					}
				}
			}
		})

		var currentState = m.prop()
		function callNextStep(state) {
			runner.step(state).then(currentState).then(function (newState) {
				if (newState) callNextStep(newState)
			})
		}

		// Don't call step while step is already executing.
		document.body.appendChild(createUIForSuites(Suites,
			function () {
				runner.step(currentState()).then(currentState)
			},
			function () {
				document.getElementById("analysis").style.display = "none"
				localStorage.clear()
				callNextStep(currentState())
			}))
	})
})(this)
