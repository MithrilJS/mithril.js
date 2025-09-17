"use strict"

/*
Percent encodings encode UTF-8 bytes, so this regexp needs to match that.
Here's how UTF-8 encodes stuff:
- `00-7F`: 1-byte, for U+0000-U+007F
- `C2-DF 80-BF`: 2-byte, for U+0080-U+07FF
- `E0-EF 80-BF 80-BF`: 3-byte, encodes U+0800-U+FFFF
- `F0-F4 80-BF 80-BF 80-BF`: 4-byte, encodes U+10000-U+10FFFF
In this, there's a number of invalid byte sequences:
- `80-BF`: Continuation byte, invalid as start
- `C0-C1 80-BF`: Overlong encoding for U+0000-U+007F
- `E0 80-9F 80-BF`: Overlong encoding for U+0080-U+07FF
- `ED A0-BF 80-BF`: Encoding for UTF-16 surrogate U+D800-U+DFFF
- `F0 80-8F 80-BF 80-BF`: Overlong encoding for U+0800-U+FFFF
- `F4 90-BF`: RFC 3629 restricted UTF-8 to only code points UTF-16 could encode.
- `F5-FF`: RFC 3629 restricted UTF-8 to only code points UTF-16 could encode.
So in reality, only the following sequences can encode are valid characters:
- 00-7F
- C2-DF 80-BF
- E0    A0-BF 80-BF
- E1-EC 80-BF 80-BF
- ED    80-9F 80-BF
- EE-EF 80-BF 80-BF
- F0    90-BF 80-BF 80-BF
- F1-F3 80-BF 80-BF 80-BF
- F4    80-8F 80-BF 80-BF

The regexp just tries to match this as compactly as possible.
*/
var validUtf8Encodings = /%(?:[0-7]|(?!c[01]|e0%[89]|ed%[ab]|f0%8|f4%[9ab])(?:c|d|(?:e|f[0-4]%[89ab])[\da-f]%[89ab])[\da-f]%[89ab])[\da-f]/gi

module.exports = function(str) {
	return String(str).replace(validUtf8Encodings, decodeURIComponent)
}
