var o = require('../test-utils/ospec')

var path = require('path')

// ensure that this only runs as part of the `cli-spec` tests.
o(process.cwd()).equals(path.join(__dirname, '..'))

var runs = 0
o('runs only once', function(){
	o(++runs).equals(1)
})
