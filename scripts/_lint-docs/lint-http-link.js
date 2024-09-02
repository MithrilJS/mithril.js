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
 * @param {(message?: string) => void} callback
 */
function checkHttpInner(href, callback) {
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

// Kill the remaining duplication by using a global cache.
const urlCache = new Map()

/**
 * Returns `undefined` if no error, a string if an error does occur.
 * @param {(message?: string) => void} callback
 */
function checkHttp(href, callback) {
	if (href.includes("#")) {
		process.exitCode = 1
		callback(`Expected href to be sanitized of hashes, but found ${href}`)
	}

	if (urlCache.has(href)) {
		const message = urlCache.get(href)
		if (Array.isArray(message)) {
			message.push(callback)
		} else {
			process.nextTick(callback, message)
		}
	} else {
		const queue = []
		urlCache.set(href, queue)
		checkHttpInner(href, (message) => {
			urlCache.set(href, message)
			process.nextTick(callback, message)
			for (const callback of queue) {
				process.nextTick(callback, message)
			}
		})
	}
}

module.exports = {
	checkHttp,
}
