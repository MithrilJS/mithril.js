//make "use strict" and nodejs happy
var window = this

//test reporting for saucelabs
if (typeof window != "undefined") {
	window.global_test_results = {
		tests: [],
		duration: 0,
		passed: 0,
		failed: 0
	};
}

if (!this.console) {
	var log = function(value) {document.write("<pre>" + value + "</pre>")}
	this.console = {log: log, error: log}
}

function test(condition) {
	var duration = 0
	var start = 0
	var result = true
	test.total++

	if (typeof performance != "undefined" && performance.now) {
		start = performance.now()
	}
	try {
		if (!condition()) throw new Error("failed")
	}
	catch (e) {
		result = false
		console.error(e)
		test.failures.push(condition)
	}
	if (typeof performance != "undefined" && performance.now) {
		duration = performance.now() - start
	}

	window.test_obj = {
		name: "" + test.total,
		result: result,
		duration: duration
	}

	if (typeof window != "undefined") {
		if (!result) {
			window.global_test_results.tests.push(window.test_obj)
		}

		window.global_test_results.duration += duration
		if (result) {
			window.global_test_results.passed++
		} else {
			window.global_test_results.failed++
		}
	}
}
test.total = 0
test.failures = []
test.print = function(print) {
	for (var i = 0; i < test.failures.length; i++) {
		print(test.failures[i].toString())
	}
	print("tests: " + test.total + "\nfailures: " + test.failures.length)

	if (test.failures.length > 0) {
		throw new Error(test.failures.length + " tests did not pass")
	}
}
