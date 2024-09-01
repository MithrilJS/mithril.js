"use strict"

const path = require("path")
const {marked} = require("marked")

const {getCodeLintErrors} = require("./lint-code.js")
const {checkHttp} = require("./lint-http-link.js")
const {checkLocal} = require("./lint-relative-link.js")
const {rel} = require("../_utils.js")
const {submitTask} = require("./task-queue.js")

/** @param {string} contents */
function processOne(file, contents, callback) {
	/*
	Unfortunately, most of this code is just working around a missing feature that's compounded on
	by a lexer bug.

	- No location info on lexer tokens: https://github.com/markedjs/marked/issues/2134
	- Tabs not preserved in lexer tokens' raw text: https://github.com/markedjs/marked/issues/3440

	This took far too long to debug, like several hours of it. But I do have correct offsets now.
	*/

	const relativePath = rel(file)
	const base = path.dirname(file)
	const syncErrors = []
	let errors = 0
	let warnings = 0
	let pending = 1

	const settle = () => {
		if (--pending === 0) {
			callback(warnings, errors)
		}
	}

	const getSpanLineCol = (startOffset, endOffset) => {
		let source = contents.slice(0, startOffset)
		let line = 1
		let next = -1
		let prev = -1

		while ((next = source.indexOf("\n", prev + 1)) >= 0) {
			line++
			prev = next
		}

		const startLine = line
		const startCol = startOffset - prev

		source = contents.slice(0, endOffset)

		while ((next = source.indexOf("\n", prev + 1)) >= 0) {
			line++
			prev = next
		}

		const endLine = line
		const endCol = endOffset - prev

		return {startLine, startCol, endLine, endCol}
	}

	const showMessage = (startOffset, endOffset, label, message) => {
		const {startLine, startCol, endLine, endCol} = getSpanLineCol(startOffset, endOffset)
		if (!message.endsWith("\n")) message += "\n"
		if (process.env.CI === "true") {
			console.error(
				`::${label.toLowerCase()} file=${relativePath}` +
				`,line:${startLine}` +
				`,endLine=${endLine}` +
				`,col:${startCol}` +
				`,endColumn=${endCol}` +
				`::${relativePath}:${startLine}:${startCol}: ${message}`
			)
		} else {
			console.error(`${label} in ${relativePath}:${startLine}:${startCol}: ${message}`)
		}
	}

	const asyncWarnCallback = (startOffset, endOffset, message) => {
		if (message !== undefined) {
			warnings++
			showMessage(startOffset, endOffset, "Warning", message)
		}
		settle()
	}

	const asyncErrorCallback = (startOffset, endOffset, message) => {
		if (message !== undefined) {
			errors++
			showMessage(startOffset, endOffset, "Error", message)
		}
		settle()
	}

	/**
	 * @param {number} startOffset
	 * @param {import("marked").Tokens.TableCell[]} cells
	 */
	const visitCellList = (startOffset, parentOffset, cells, parent) => {
		for (const cell of cells) {
			parentOffset = visitList(startOffset, parentOffset, cell.tokens, parent)
		}
		return parentOffset
	}

	// Nasty workaround for https://github.com/markedjs/marked/issues/3440
	const advanceTabViaSpaceReplacement = (offset, raw, start, end) => {
		while (start < end) {
			const real = contents.charCodeAt(offset++)
			const synthetic = raw.charCodeAt(start++)
			if (
				real === 0x09 && synthetic === 0x20 &&
				raw.charCodeAt(start) === 0x20 &&
				raw.charCodeAt(++start) === 0x20 &&
				raw.charCodeAt(++start) === 0x20
			) {
				start++
			}
		}

		return offset
	}

	/**
	 * @param {number} startOffset
	 * @param {import("marked").MarkedToken[]} tokens
	 */
	const visitList = (startOffset, parentOffset, tokens, parent) => {
		for (const child of tokens) {
			const nextIndex = parent.raw.indexOf(child.raw, parentOffset)
			const innerStart = advanceTabViaSpaceReplacement(startOffset, parent.raw, parentOffset, nextIndex)
			const outerStart = advanceTabViaSpaceReplacement(innerStart, child.raw, 0, child.raw.length)
			parentOffset = nextIndex + child.raw.length
			startOffset = outerStart
			visit(innerStart, child)
		}
		return parentOffset
	}

	const visited = new Set()

	/**
	 * @param {number} startOffset
	 * @param {import("marked").MarkedToken} token
	 */
	const visit = (startOffset, token) => {
		const endOffset = startOffset + token.raw.length

		switch (token.type) {
			case "link": {
				// Make sure it's trimmed, so I don't have to worry about errors elsewhere.
				const href = token.href.replace(/^\s+|\s+$|#[\s\S]*$/, "")

				if (!visited.has(href)) {
					visited.add(href)

					// Prefer https: > http: where possible, but allow http: when https: is
					// inaccessible.
					if ((/^https?:\/\//).test(href)) {
						submitTask(
							checkHttp.bind(null, href),
							asyncWarnCallback.bind(null, startOffset, endOffset),
						)
						pending++
					} else if (!href.includes(":")) {
						submitTask(
							checkLocal.bind(null, base, href),
							asyncErrorCallback.bind(null, startOffset, endOffset),
						)
						pending++
					}
				}

				visitList(startOffset, 0, token.tokens, token)
				break
			}

			case "code": {
				const code = token.text
				const lang = token.lang || ""

				const codeErrors = getCodeLintErrors(code, lang)

				if (codeErrors.length !== 0) {
					errors += codeErrors.length
					for (const error of codeErrors) {
						syncErrors.push({startOffset, endOffset, message: error})
					}
				}

				break
			}

			case "list":
				visitList(startOffset, 0, token.items, token)
				break

			case "table": {
				let parentOffset = visitCellList(startOffset, 0, token.header, token)
				startOffset += parentOffset
				for (const row of token.rows) {
					parentOffset = visitCellList(startOffset, parentOffset, row, token)
					startOffset += parentOffset
				}
				break
			}

			default:
				if (token.tokens !== undefined) {
					visitList(startOffset, 0, token.tokens, token)
				}
		}
	}

	visitList(0, 0, marked.lexer(contents), {raw: contents.replace(/\t/g, "    ")})

	for (const {startOffset, endOffset, message} of syncErrors) {
		showMessage(startOffset, endOffset, "Error", message)
	}

	syncErrors.length = 0

	settle()
}

module.exports = {
	processOne,
}
