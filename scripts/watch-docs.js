"use strict"

const path = require("path")
const chokidar = require("chokidar")
const generate = require("./generate-docs")
const command = require("./_command")

chokidar.watch(path.resolve(__dirname, "../docs")).on("all", () => {
	command.run(() => generate())
})
