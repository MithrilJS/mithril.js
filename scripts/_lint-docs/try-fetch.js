"use strict"

const http = require("http")
const https = require("https")

const {decodeResponse} = require("./decode-response.js")
const {warnError, noop} = require("../_utils.js")

/**
 * Always returns a response object.
 * @param {URL} url
 * @param {(
 *     headers: Record<string, string | string[]>,
 *     status: number,
 *     body: string,
 *     sslError: boolean,
 * ) => void} callback
 */
function tryFetch(url, callback) {
	const maxResponseBytes = 64 * 1024
	const maxTimeoutMs = 5000
	const maxDelayMs = 10000
	const allowedAttempts = 3
	const allowedRedirects = 10

	let remainingAttempts = allowedAttempts
	let remainingRedirects = allowedRedirects
	let lastIsSSL = false
	let lastStatus = 0
	let lastHeaders, lastMessage

	let request, response
	const responseBuffer = Buffer.alloc(maxResponseBytes)
	let responseBytes = 0
	let timer

	function cleanup() {
		const prevReq = request
		const prevRes = response
		const prevTimer = timer

		request = undefined
		response = undefined
		timer = undefined

		clearTimeout(prevTimer)

		try {
			prevReq?.off("response", onResponse)
			prevReq?.off("error", onError)
			prevReq?.on("error", noop)
			prevReq?.destroy()
		} catch (e) {
			warnError(e)
		}

		try {
			prevRes?.off("data", onChunk)
			prevRes?.off("end", onEnd)
			prevRes?.off("error", onError)
			prevRes?.destroy()
		} catch (e) {
			warnError(e)
		}
	}

	function settle() {
		cleanup()
		callback(lastHeaders, lastStatus, lastMessage, lastIsSSL)
	}

	function onEnd() {
		cleanup()

		if (lastMessage === "") {
			lastMessage = decodeResponse(lastHeaders, responseBuffer.subarray(0, responseBytes))
		}

		if (lastStatus === 429 || lastStatus >= 500) {
			const retryAfter = Number(lastHeaders["retry-after"])
			if (retryAfter > 0) {
				setTimeout(loop, Math.max(maxDelayMs, retryAfter))
			} else {
				setTimeout(loop, 5000)
			}
		} else {
			settle()
		}
	}

	function onError(e) {
		cleanup()

		if (lastMessage === "") {
			lastMessage = e.message
			if (e.code === "ECONNRESET" || e.code === "ECONNABORT" || e.code === "ECONNREFUSED") {
				lastMessage = "Request socket dropped"
			} else if (
				url.protocol === "https:" &&
				(e.code === "ERR_TLS_CERT_ALTNAME_INVALID" || (/ssl/i).test(e.message))
			) {
				lastIsSSL = true
			} else if (!("code" in e)) {
				lastMessage = e.stack
			}
		}

		loop()
	}

	function onChunk(chunk) {
		const length = chunk.length
		if (length === 0) return

		let next = responseBytes + length

		if (next > maxResponseBytes) {
			chunk = chunk.subarray(0, length - (next - maxResponseBytes))
			next = maxResponseBytes
		}

		responseBuffer.set(chunk, responseBytes)
		responseBytes = next

		if (next === maxResponseBytes) {
			response.off("data", onChunk)
			response.resume()
		}
	}

	function onResponse(res) {
		request.off("response", onResponse)
		request.off("error", onError)

		response = res
		response.on("end", onEnd)
		response.on("error", onError)

		lastStatus = res.statusCode
		lastHeaders = res.headers

		if (
			lastStatus === 301 ||
			lastStatus === 302 ||
			lastStatus === 303 ||
			lastStatus === 307 ||
			lastStatus === 308
		) {
			if (!lastHeaders.location) {
				lastMessage = "Redirect missing location"
				response.resume()
				return
			}

			try {
				url = new URL(lastHeaders.location, url)
			} catch {
				lastMessage = `Redirection to invalid URL ${lastHeaders.location}`
				response.resume()
				return
			}

			remainingAttempts = allowedAttempts
			remainingRedirects--
		} else if (lastStatus >= 200 && lastStatus <= 299) {
			response.resume()
		} else {
			response.on("data", onChunk)
		}
	}

	function onTimeout() {
		if (lastMessage === "") {
			lastMessage = "Request timed out"
		}

		loop()
	}

	function loop() {
		cleanup()

		if (remainingAttempts === 0) {
			return settle()
		}

		lastIsSSL = false
		lastStatus = 0
		lastMessage = ""
		lastHeaders = {}
		remainingAttempts--

		if (remainingRedirects === 0) {
			lastMessage = "Too many redirects"
			return settle()
		}

		timer = setTimeout(onTimeout, maxTimeoutMs)

		request = (url.protocol === "https:" ? https : http).get(url, {
			// pass along realistic headers, some sites (i.e. the IETF) return a 403 otherwise.
			headers: {
				"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:71.0) Gecko/20100101 Firefox/71.0",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip, deflate, br",
				"DNT": "1",
				"Connection": "keep-alive",
				"Upgrade-Insecure-Requests": "1",
				"Pragma": "no-cache",
				"Cache-Control": "no-cache",
			},
		})
		request.on("response", onResponse)
		request.on("error", onError)
		request.end()
	}

	loop()
}

module.exports = {
	tryFetch,
}
