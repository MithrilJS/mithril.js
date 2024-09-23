"use strict"

const fs = require("fs")
const path = require("path")

/** @param {(message?: string) => void} callback */
function checkLocal(base, href, callback) {
	const exec = (/^([^#?]*\.md)(?:$|\?|#)/).exec(href)
	if (exec !== null) {
		fs.access(path.join(base, exec[1]), (err) => {
			if (err) {
				callback(`Broken internal link: ${href}`)
			} else {
				callback()
			}
		})
	}
}

module.exports = {
	checkLocal,
}
