function test(condition) {
	var duration = 0
	var start = 0
	var result = true
	test.total++

	if (typeof performance != "undefined") {
		start = performance.now()
	}
	try {
		if (!condition()) throw new Error()
	}
	catch (e) {
		result = false
		console.error(e)
		test.failures.push(condition)
	}
	if (typeof performance != "undefined") {
		duration = performance.now() - start
	}

	test_obj = {
		name: "" + test.total,
		result: result,
		duration: duration
	}

	if (typeof window != "undefined") {
		if (!result) {
			window.global_test_results.tests.push(test_obj)
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
