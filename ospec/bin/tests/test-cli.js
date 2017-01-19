'use strict'

var proc = require('child_process')
var path = require('path')
var fs = require('fs')

var cliPath = '../ospec'
var ospecPath = '../../ospec.js'
var testPath = '../cli-spec/'

// make specDir has it's own ospec space
if (!fs.existsSync(dir(testPath + 'node_modules')))
	fs.mkdirSync(dir(testPath + 'node_modules'))
if (fs.existsSync(dir(testPath + 'node_modules/ospec.js')))
	fs.unlinkSync(dir(testPath + 'node_modules/ospec.js'))
fs.linkSync(dir(ospecPath), dir(testPath + 'node_modules/ospec.js'))


var o = require(ospecPath)
o.spec('ospec cli', function () {
	o('basic', function (done) {
		proc.exec(cliPath, {cwd: dir(testPath)}, function (e, out) {
			o(/^1 assertions completed.* 0 failed\r?\n0 assertions completed.* 0 failed\r?\n$/.test(out)).equals(true)
			done(e)
		})
	})
})


function dir(name) {
	return path.join(__dirname, name)
}
