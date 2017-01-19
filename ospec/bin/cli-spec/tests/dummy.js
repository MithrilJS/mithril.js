var o = require('../test-utils/ospec')

var runs = 0
o('runs only once', function(){
	o(++runs).equals(1)
})
