var m = window.m;
if (!this.console) {
	var log = function(value) {document.write("<pre>" + value + "</pre>")}
	this.console = {log: log, error: log}
}

function test(condition) {
	test.total++

	try {
		if (!condition()) throw new Error("failed")
	}
	catch (e) {
		console.error(e)
		test.failures.push(condition)
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
