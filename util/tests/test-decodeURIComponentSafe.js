"use strict"

var o = require("ospec")
var decodeURIComponentSafe = require("../../util/decodeURIComponentSafe")

o.spec("decodeURIComponentSafe", function() {
	o("non-string type (compared to decodeURIComponent)", function() {
		o(decodeURIComponentSafe()).equals(decodeURIComponent())
		o(decodeURIComponentSafe(null)).equals(decodeURIComponent(null))
		o(decodeURIComponentSafe(0)).equals(decodeURIComponent(0))
		o(decodeURIComponentSafe(true)).equals(decodeURIComponent(true))
		o(decodeURIComponentSafe(false)).equals(decodeURIComponent(false))
		o(decodeURIComponentSafe({})).equals(decodeURIComponent({}))
		o(decodeURIComponentSafe([])).equals(decodeURIComponent([]))
		o(decodeURIComponentSafe(function(){})).equals(decodeURIComponent(function(){}))
	})

	o("non-percent-encoded string", function() {
		o(decodeURIComponentSafe("")).equals("")
		o(decodeURIComponentSafe("1")).equals("1")
		o(decodeURIComponentSafe("abc")).equals("abc")
		o(decodeURIComponentSafe("😃")).equals("😃")
	})

	o("percent-encoded ASCII", function() {
		for (var i = 0; i < 128; i++) {
			var char = String.fromCharCode(i)
			var uenc = "%" + Number(i).toString(16).padStart(2, "0").toUpperCase()
			var lenc = "%" + Number(i).toString(16).padStart(2, "0").toLowerCase()
			var uout = decodeURIComponentSafe(uenc)
			var lout = decodeURIComponentSafe(lenc)
			o(char).equals(uout)
			o(char).equals(lout)
		}
	})

	o("all code points (without surrogates)", function() {
		var ranges = [
			[0x0000, 0xD7FF],
			/* [0xD800, 0xDFFF], */
			[0xE000, 0x10FFFF]
		]
		for (var [lo, hi] of ranges) {
			for (var cp = lo; cp <= hi; cp++) {
				var char = String.fromCodePoint(cp)
				// including ASCII characters not encoded by encodeURIComponent
				var enc = encodeURIComponent(char)
				var out = decodeURIComponentSafe(enc)
				o(char).equals(out)
			}
		}
	})

	o("invalid byte sequences", function() {
		// `80-BF`: Continuation byte, invalid as start
		o(decodeURIComponentSafe("%7F")).notEquals("%7F")
		o(decodeURIComponentSafe("%80")).equals("%80")
		o(decodeURIComponentSafe("%BF")).equals("%BF")

		// `C0-C1 80-BF`: Overlong encoding for U+0000-U+007F
		o(decodeURIComponentSafe("%C0%80")).equals("%C0%80") // U+0000
		o(decodeURIComponentSafe("%C1%BF")).equals("%C1%BF") // U+007F
		o(decodeURIComponentSafe("%C2%80")).notEquals("%C2%80") // U+0080

		// `E0 80-9F 80-BF`: Overlong encoding for U+0080-U+07FF
		o(decodeURIComponentSafe("%DF%BF")).notEquals("%DF%BF") // U+07FF
		o(decodeURIComponentSafe("%E0%80%80")).equals("%E0%80%80") // U+0000
		o(decodeURIComponentSafe("%E0%9F%BF")).equals("%E0%9F%BF") // U+07FF
		o(decodeURIComponentSafe("%E0%A0%80")).notEquals("%E0%A0%80") // U+0800

		// `ED A0-BF 80-BF`: Encoding for UTF-16 surrogate U+D800-U+DFFF
		o(decodeURIComponentSafe("%ED%9F%BF")).notEquals("%ED%9F%BF") // U+D7FF
		o(decodeURIComponentSafe("%ED%A0%80")).equals("%ED%A0%80") // U+D800
		o(decodeURIComponentSafe("%ED%AF%BF")).equals("%ED%AF%BF") // U+DBFF
		o(decodeURIComponentSafe("%ED%B0%80")).equals("%ED%B0%80") // U+DC00
		o(decodeURIComponentSafe("%ED%BF%BF")).equals("%ED%BF%BF") // U+DFFF
		o(decodeURIComponentSafe("%EE%80%80")).notEquals("%EE%80%80") // U+E000

		// `F0 80-8F 80-BF 80-BF`: Overlong encoding for U+0800-U+FFFF
		o(decodeURIComponentSafe("%EF%BF%BF")).notEquals("%EF%BF%BF") // U+FFFF
		o(decodeURIComponentSafe("%F0%80%80%80")).equals("%F0%80%80%80") // U+0000
		o(decodeURIComponentSafe("%E0%80%9F%BF")).equals("%E0%80%9F%BF") // U+07FF
		o(decodeURIComponentSafe("%E0%80%A0%80")).equals("%E0%80%A0%80") // U+0800
		o(decodeURIComponentSafe("%F0%8F%BF%BF")).equals("%F0%8F%BF%BF") // U+FFFF
		o(decodeURIComponentSafe("%F0%90%80%80")).notEquals("%F0%90%80%80") // U+10000

		// `F4 90-BF`: RFC 3629 restricted UTF-8 to only code points UTF-16 could encode.
		o(decodeURIComponentSafe("%F4%8F%BF%BF")).notEquals("%F4%8F%BF%BF") // U+10FFFF
		o(decodeURIComponentSafe("%F4%90%80%80")).equals("%F4%90%80%80") // U+110000
		o(decodeURIComponentSafe("%F4%BF%BF%BF")).equals("%F4%BF%BF%BF") // U+13FFFF

		// `F5-FF`: RFC 3629 restricted UTF-8 to only code points UTF-16 could encode.
		o(decodeURIComponentSafe("%F5")).equals("%F5")
		o(decodeURIComponentSafe("%FF")).equals("%FF")
		o(decodeURIComponentSafe("%F5%80%80%80")).equals("%F5%80%80%80") // U+140000
		o(decodeURIComponentSafe("%FF%8F%BF%BF")).equals("%FF%8F%BF%BF")
	})

	o("malformed URI sequence", function() {
		// "%" only
		o(() => decodeURIComponent("%")).throws(URIError)
		o(decodeURIComponentSafe("%")).equals("%")
		// "%" with one digit
		o(() => decodeURIComponent("%1")).throws(URIError)
		o(decodeURIComponentSafe("%1")).equals("%1")
		// "%" with non-hexadecimal
		o(() => decodeURIComponent("%G0")).throws(URIError)
		o(decodeURIComponentSafe("%G0")).equals("%G0")
		// "%" in string
		o(() => decodeURIComponent("x%y")).throws(URIError)
		o(decodeURIComponentSafe("x%y")).equals("x%y")
		// Overlong encoding
		o(() => decodeURIComponent("%E0%80%AF")).throws(URIError)
		o(decodeURIComponentSafe("%E0%80%AF")).equals("%E0%80%AF")
		// surrogate
		o(() => decodeURIComponent("%ED%A0%80")).throws(URIError)
		o(decodeURIComponentSafe("%ED%A0%80")).equals("%ED%A0%80")
	})
})
