"use strict"

// Accept just about anything by using Babel's parser.

const babelParser = require("@babel/parser")

function getJsonError(code) {
	try {
		JSON.parse(code)
		return undefined
	} catch (e) {
		return e
	}
}

/** Returns `undefined` or an error */
function getBabelError(code, asTypeScript) {
	// Could be within any production.
	/** @type {babelParser.ParserPlugin[]} */
	const plugins = [
		"bigInt",
		"asyncGenerators",
		"classPrivateMethods",
		"classPrivateProperties",
		"classProperties",
		"dynamicImport",
		"logicalAssignment",
		"nullishCoalescingOperator",
		"numericSeparator",
		"objectRestSpread",
		"optionalCatchBinding",
		"optionalChaining",
		"topLevelAwait",
		"jsx",
	]

	if (asTypeScript) {
		plugins.push("typescript")
	}

	try {
		babelParser.parse(code, {
			sourceType: "unambiguous",
			allowReturnOutsideFunction: true,
			allowAwaitOutsideFunction: true,
			allowSuperOutsideMethod: true,
			allowUndeclaredExports: true,
			plugins,
		})

		return undefined
	} catch (e) {
		return e
	}
}

/**
 * @typedef LangEntry
 * @property {string} name
 * @property {undefined | RegExp} unspacedComment
 * @property {(code: string) => undefined | Error} getError
 */

/** @type {Map<string, string | LangEntry>} */
const recognizedLangTags = new Map([
	["js", {
		name: "JavaScript",
		unspacedComment: /(^|\s)\/\/\S/g,
		getError: (code) => getBabelError(code, false),
	}],
	["ts", {
		name: "TypeScript",
		unspacedComment: /(^|\s)\/\/\S/g,
		getError: (code) => getBabelError(code, true),
	}],
	["json", {
		name: "JSON",
		unspacedComment: undefined,
		getError: getJsonError,
	}],
	["javascript", "js"],
	["typescript", "ts"],
])

/**
 * @param {undefined | string} lang
 * @returns {undefined | LangEntry}
 */
function lookupLang(lang) {
	while (typeof lang === "string") {
		lang = recognizedLangTags.get(lang)
	}
	return lang
}

function lintCodeIsHighlightable(codeErrors, lang) {
	// We only care about what's not tagged here.
	if (lang === "") {
		// TODO: ensure all code blocks have tags, and check this in CI.
		const langTags = []

		for (const [tag, getError] of recognizedLangTags) {
			if (typeof getError === "function" && !getError(tag)) {
				langTags.push(tag)
			}
		}

		if (langTags.length === 1) {
			codeErrors.push(`Code block possibly missing \`${langTags[0]}\` language tag.`)
		} else if (langTags.length !== 0) {
			codeErrors.push([
				"Code block possibly missing a language tag. Possible tags that could apply:",
				...langTags.map((tag) => `- ${tag}`),
			].join("\n"))
		}
	}
}

function lintCodeIsSyntaticallyValid(codeErrors, langEntry, error) {
	if (error) {
		codeErrors.push(`${langEntry.name} code block has invalid syntax: ${error.message}`)
	}
}

function lintCodeCommentStyle(codeErrors, langEntry, code) {
	if (langEntry?.unspacedComment?.test(code)) {
		codeErrors.push("Comment is missing a preceding space.")
	}
}

function getCodeLintErrors(code, lang) {
	const langEntry = lookupLang(lang)
	const error = langEntry?.getError(code)
	const codeErrors = []

	lintCodeIsHighlightable(codeErrors, lang)
	lintCodeIsSyntaticallyValid(codeErrors, langEntry, error)
	lintCodeCommentStyle(codeErrors, langEntry, code)

	return codeErrors
}

module.exports = {
	getCodeLintErrors,
}
