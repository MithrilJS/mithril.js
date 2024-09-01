"use strict"

const {tryFetch} = require("./try-fetch.js")

function checkKnownCorrectRequestFail(href, headers, status, body) {
	if (status >= 400 && status <= 499) {
		return `${href} is a broken link (status: ${status})`
	}

	// Don't fail if something weird shows up - it's the internet. Just log it and move on.
	// However, some more sophisticated logging is useful.
	let message = `HTTP error for ${href} (status: ${status})`

	for (const [name, value] of Object.entries(headers)) {
		if (Array.isArray(value)) {
			for (const v of value) message = `${message}\n>${name}: ${v}`
		} else {
			message = `${message}\n>${name}: ${value}`
		}
	}

	if (body !== "") {
		message = `${message}\n>${body}`
	}

	return message
}

/**
 * Returns `undefined` if no error, a string if an error does occur.
 * @param {(message?: string)} callback
 */
function checkHttp(href, callback) {
	// Prefer https: > http: where possible, but allow http: when https: is inaccessible.

	const url = new URL(href)
	url.hash = ""

	const isHTTPS = url.protocol === "https:"
	url.protocol = "https:"

	tryFetch(url, (headers, status, body, sslError) => {
		if (status >= 200 && status <= 299) {
			if (isHTTPS) {
				return callback()
			} else {
				return callback(`Change ${href} to use \`https:\``)
			}
		}

		if (!sslError) {
			return callback(checkKnownCorrectRequestFail(href, headers, status, body))
		}

		url.protocol = "http:"
		tryFetch(url, (headers, status, body) => {
			if (status >= 200 && status <= 299) {
				if (isHTTPS) {
					return callback(`Change ${href} to use \`http:\``)
				} else {
					return callback()
				}
			}

			return callback(checkKnownCorrectRequestFail(href, headers, status, body))
		})
	})
}

module.exports = {
	checkHttp,
}
