#!/usr/bin/env node
"use strict"

require("./_improve-rejection-crashing.js")

const {lintAll, lintWatch} = require("./_lint-docs/do-lint.js")

if (process.argv.includes("--watch", 2)) {
	lintWatch()
} else {
	lintAll()
}
