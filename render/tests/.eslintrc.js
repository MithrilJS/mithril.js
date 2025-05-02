"use strict"

module.exports = {
	"extends": "../../.eslintrc.js",
	"env": {
		"browser": null,
		"node": true,
		"es2022": true,
	},
	"parserOptions": {
		"ecmaVersion": 2022,
	},
	"rules": {
		"no-process-env": "off",
	},
};
