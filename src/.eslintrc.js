"use strict"
const config = Object.assign({}, require("../.eslintrc.js"))
config.env = Object.assign({}, config.env)
delete config.env.commonjs
delete config.env.node
config.parserOptions = Object.assign({}, config.parserOptions)
config.parserOptions.sourceType = "module"
module.exports = config
