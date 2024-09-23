// Disabling this globally as I use it a lot to speed up common operations and cut down on
// duplicate comparisons.
/* eslint-disable no-bitwise */
"use strict"

const win1252Map = [
	0x20AC,
	0x81,
	0x201A,
	0x0192,
	0x201E,
	0x2026,
	0x2020,
	0x2021,
	0x02C6,
	0x2030,
	0x0160,
	0x2039,
	0x0152,
	0x8D,
	0x017D,
	0x8F,
	0x90,
	0x2018,
	0x2019,
	0x201C,
	0x201D,
	0x2022,
	0x2013,
	0x2014,
	0x02DC,
	0x2122,
	0x0161,
	0x203A,
	0x0153,
	0x9D,
	0x017E,
	0x0178,
]

function decode(buffer, encoding) {
	switch (encoding) {
		case "utf16be":
			buffer.swap16()
			encoding = "utf16le"
			break

		case "win1252":
			encoding = "latin1"
			for (let i = 0; i < buffer.length; i++) {
				const value = buffer[i]
				if ((value & 0xE0) === 0x80) {
					const u16 = new Uint16Array(buffer.length)
					u16.set(buffer.subarray(0, i), 0)
					for (; i < buffer.length; i++) {
						const value = buffer[i]
						const mask = -((value & 0xE0) === 0x80)
						u16[i] = value & ~mask | win1252Map[value & 0x1F] & mask
					}
					buffer = Buffer.from(u16.buffer)
					encoding = "utf16le"
					break
				}
			}
			break
	}

	return buffer.toString(encoding)
}

// Ref: https://encoding.spec.whatwg.org/#concept-encoding-get
/** @type {Array<["utf8" | "utf16le" | "utf16be" | "win1252", string]>} */
const encodingMap = [
	["utf8", "UNICODE11UTF8"],
	["utf8", "UNICODE20UTF8"],
	["utf8", "UNICODE-1-1-UTF-8"],
	["utf8", "UTF8"],
	["utf8", "UTF-8"],
	["utf8", "X-UNICODE20UTF8"],
	["win1252", "ANSI_X3.4-1968"],
	["win1252", "ASCII"],
	["win1252", "CP1252"],
	["win1252", "CP819"],
	["win1252", "CSISOLATIN1"],
	["win1252", "IBM819"],
	["win1252", "ISO-8859-1"],
	["win1252", "ISO-IR-100"],
	["win1252", "ISO8859-1"],
	["win1252", "ISO88591"],
	["win1252", "ISO_8859-1"],
	["win1252", "ISO_8859-1:1987"],
	["win1252", "L1"],
	["win1252", "LATIN1"],
	["win1252", "US-ASCII"],
	["win1252", "WINDOWS-1252"],
	["win1252", "X-CP1252"],
	["utf16be", "UNICODEFFFE"],
	["utf16be", "UTF-16BE"],
	["utf16le", "CSUNICODE"],
	["utf16le", "ISO-10646-UCS-2"],
	["utf16le", "UCS-2"],
	["utf16le", "UNICODE"],
	["utf16le", "UNICODEFEFF"],
	["utf16le", "UTF-16"],
	["utf16le", "UTF-16LE"],
]

function extractNamedEncoding(name) {
	outer:
	for (const entry of encodingMap) {
		const expected = entry[1]
		if (expected.length !== name.length) continue
		for (let i = 0; i < name.length; i++) {
			let ch = expected.charCodeAt(i)
			const upper = ch & ~0x20
			if (upper >= 0x41 && upper <= 0x5A) ch = upper
			if (name.charCodeAt(i) !== expected) continue outer
		}
		return entry[0]
	}
	return undefined
}

function isAsciiWhitespace(ch) {
	const mask = (
		1 << (0x09 - 1) |
		1 << (0x0A - 1) |
		1 << (0x0C - 1) |
		1 << (0x0D - 1) |
		1 << (0x20 - 1)
	)

	ch |= 0
	return ch < 0x20 && (mask >>> (ch - 1) & 1) !== 0
}

function startsWith(buffer, i, end, sequence) {
	if (buffer.length < i + sequence.length) return false

	for (let j = 0; j < sequence.length && i < end; i++, j++) {
		let ch = sequence.charCodeAt(j)
		if (ch === 0x20) {
			if (!isAsciiWhitespace(buffer[i++])) return false
			while (i < buffer.length && isAsciiWhitespace(buffer[i])) i++
		} else {
			const upper = ch & ~0x20
			if (upper >= 0x41 && upper <= 0x5A) ch = upper
			if (ch !== buffer[i]) return false
		}
	}

	return true
}

const metasToCheck = encodingMap.flatMap(([e, n]) => [
	[e, `charset=${n}>`],
	[e, `charset="${n}">`],
	[e, `charset='${n}'>`],
	[e, `charset=${n}/>`],
	[e, `charset="${n}"/>`],
	[e, `charset='${n}'/>`],
	[e, `http-equiv=content-type content=${n}>`],
	[e, `http-equiv="content-type" content=${n}>`],
	[e, `http-equiv='content-type' content=${n}>`],
	[e, `http-equiv=content-type content="${n}">`],
	[e, `http-equiv="content-type" content="${n}">`],
	[e, `http-equiv='content-type' content="${n}">`],
	[e, `http-equiv=content-type content='${n}'>`],
	[e, `http-equiv="content-type" content='${n}'>`],
	[e, `http-equiv='content-type' content='${n}'>`],
	[e, `http-equiv=content-type content=${n}/>`],
	[e, `http-equiv="content-type" content=${n}/>`],
	[e, `http-equiv='content-type' content=${n}/>`],
	[e, `http-equiv=content-type content="${n}"/>`],
	[e, `http-equiv="content-type" content="${n}"/>`],
	[e, `http-equiv='content-type' content="${n}"/>`],
	[e, `http-equiv=content-type content='${n}'/>`],
	[e, `http-equiv="content-type" content='${n}'/>`],
	[e, `http-equiv='content-type' content='${n}'/>`],
])

function extractMetaEncoding(buffer, i, end) {
	// Exceptionally lazy and not quite fully correct
	for (const [encoding, meta] of metasToCheck) {
		if (startsWith(buffer, i, end, meta)) return encoding
	}
	return undefined
}

/**
 * @returns {"utf8" | "utf16le" | "utf16be" | "win1252"}
 */
function detectEncoding(headers, prefix) {
	// This follows the HTML spec to the extent Node supports the various encodings. I'm *not*,
	// however, going to bend over backwards to support obscure encodings.
	// https://html.spec.whatwg.org/multipage/parsing.html#prescan-a-byte-stream-to-determine-its-encoding

	if (startsWith(prefix, 0, prefix.length, "\xEF\xBB\xBF")) return "utf8"
	if (startsWith(prefix, 0, prefix.length, "\xFE\xFF")) return "utf16le"
	if (startsWith(prefix, 0, prefix.length, "\xFF\xFE")) return "utf16be"

	const contentType = headers["content-type"]
	if (contentType) {
		const result = (/;\s*charset="?([\w-]+)"?/i).exec(contentType)
		if (result) {
			const encoding = extractNamedEncoding(result[1])
			if (encoding) return encoding
		}
	}

	if (startsWith(prefix, 0, prefix.length, "\x3c\x00\x3F\x00\x78\x00")) return "utf16le"
	if (startsWith(prefix, 0, prefix.length, "\x00\x3c\x00\x3F\x00\x78")) return "utf16be"

	for (let i = 0, end = prefix.indexOf("<!--", 0, "latin1"); i < prefix.length;) {
		if (i === end) {
			i = prefix.indexOf("-->", i + 4, "latin1")
			if (i < 0) return undefined
			i += 3
			end = prefix.indexOf("<!--", i, "latin1")
		} else if (prefix[i] === 0x3C) {
			i++
			if (i === prefix.length) return "win1252"

			if (startsWith(prefix, i, end, "meta ")) {
				const encoding = extractMetaEncoding(prefix, i, end)
				if (encoding) return encoding
			} else if (prefix[i] === 0x21 || prefix[i] === 0x2F || prefix[i] === 0x3F) {
				i = prefix.indexOf(0x3E, i)
				if (i < 0) return "win1252"
				i++
			}
		}
	}

	return "win1252"
}

function decodeResponse(headers, body) {
	return decode(body, detectEncoding(headers, body.subarray(0, 1024)))
}

module.exports = {
	decodeResponse,
}
