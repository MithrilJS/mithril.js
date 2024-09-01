"use strict"

const fs = require("fs")
const path = require("path")

const {submitTask} = require("./task-queue.js")
const {processOne} = require("./process-file.js")
const {root, rel, p, warnError} = require("../_utils.js")

const doNotVisit = /[\\/]node_modules(?:$|[\\/])|[\\/]docs[\\/](?:changelog|recent-changes|migration-[^\\/]*)\.md$/

function lintOne(file, callback) {
	let warnings = 0
	let errors = 0
	let files = 0

	let pending = 1

	function settle() {
		if (--pending === 0) {
			callback(warnings, errors, files)
		}
	}

	function visitNext(file, contents) {
		if (contents !== undefined) {
			files++
			pending++
			processOne(file, contents, (w, e) => {
				warnings += w
				errors += e
				settle()
			})
		} else {
			pending++
			submitTask(fs.readdir.bind(null, file), (err, files) => {
				if (err) {
					if (err.code !== "ENOTDIR") {
						warnError(err)
					}
				} else {
					for (const child of files) {
						const joined = path.join(file, child)
						if (!doNotVisit.test(joined)) {
							visit(joined)
						}
					}
				}

				settle()
			})
		}
	}

	function visit(file) {
		if (file.endsWith(".md")) {
			pending++
			submitTask(fs.readFile.bind(null, file, "utf8"), (err, contents) => {
				// Not found is fine. Just ignore it.
				if (!err || err.code === "EISDIR") {
					visitNext(file, err ? undefined : contents)
				} else if (err.code !== "ENOENT") {
					warnError(err)
				}
				settle()
			})
		} else {
			visitNext(file, undefined)
		}
	}

	visit(file)
}

function lintAll() {
	lintOne(root, (warnings, errors, files) => {
		let problems = ""

		if (errors !== 0) {
			process.exitCode = 1
			problems = `${problems}\n${errors} error${errors === 1 ? "" : "s"}`
		}

		if (warnings !== 0) {
			problems = `${problems}\n${warnings} warning${warnings === 1 ? "" : "s"}`
		}

		if (problems !== "") {
			console.error(`${problems} found in the docs\n`)
			console.error(`Scanned ${files} file${files === 1 ? "" : "s"}\n`)
		} else {
			console.log("The docs are in good shape!\n")
			console.log(`Scanned ${files} file${files === 1 ? "" : "s"}\n`)
		}
	})
}

function lintFile(file, callback) {
	if (doNotVisit.test(file)) {
		if (typeof callback === "function") process.nextTick(callback)
	} else {
		lintOne(file, (warnings, errors) => {
			const relativePath = rel(file)

			let problems = ""

			if (errors !== 0) {
				problems = `${problems}\n${errors} error${errors === 1 ? "" : "s"}`
			}

			if (warnings !== 0) {
				problems = `${problems}\n${warnings} warning${warnings === 1 ? "" : "s"}`
			}

			if (problems !== "") {
				console.error(`${problems} found in ${relativePath}\n`)
			}

			callback?.()
		})
	}
}

function lintWatch() {
	const timers = new Map()

	const handleFileInner = (filename) => {
		timers.delete(filename)
		lintFile(p(filename))
	}

	const handleFile = (filename) => {
		const timer = timers.get(filename)
		if (timer !== undefined) {
			timer.refresh()
		} else {
			timers.set(filename, setTimeout(handleFileInner, 400, filename))
		}
	}

	let fileBuffer = []

	lintFile(root, () => {
		for (const file of fileBuffer) {
			handleFile(file)
		}
		fileBuffer = undefined
	})

	fs.watch(root, {recursive: true}, (_, filename) => {
		if (fileBuffer !== undefined) {
			fileBuffer.push(filename)
		} else {
			handleFile(filename)
		}
	})
}

module.exports = {
	lintAll,
	lintWatch,
}
