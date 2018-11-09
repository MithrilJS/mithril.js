"use strict"

/**
 * An ESLint rule used within this project to ban ES6+ stuff, mod imports.
 *
 * This also goes to include some stage 3 stuff, for future proofing.
 */

exports.meta = {
	docs: {
		description: "Ban ES6+ stuff (mod imports)",
	},
	schema: [],
}

exports.create = function (context) {
	function check(cases) {
		return function (node) {
			for (var i = 0; i < cases.length; i += 2) {
				if (cases[i](node)) {
					context.report({node: node, message: cases[i + 1]})
				}
			}
		}
	}

	function ban(message) {
		return function (node) {
			context.report({node: node, message: message})
		}
	}

    // Note: commented rules are just marking ES6+ things that are syntactically
    // invalid in ES5 code, like `super` or `yield`.
	return {
		FunctionExpression: check([
			function (node) { return node.async && node.generator },
			"Unexpected async generator expression",
			function (node) { return node.generator },
			"Unexpected generator expression",
			function (node) { return node.async },
			"Unexpected async function expression",
		]),
		FunctionDeclaration: check([
			function (node) { return node.async && node.generator },
			"Unexpected async generator declaration",
			function (node) { return node.generator },
			"Unexpected generator declaration",
			function (node) { return node.async },
			"Unexpected async function declaration",
		]),
		VariableDeclaration: check([
			function (node) { return node.kind === "let" },
			"Unexpected `let` declaration",
			function (node) { return node.kind === "const" },
			"Unexpected `const` declaration",
		]),
		// Super: ban("Unexpected `super` reference"),
		SpreadElement: ban("Unexpected spread element"),
		Property: check([
			function (node) { return node.method },
			"Unexpected object method",
			function (node) { return node.shorthand },
			"Unexpected object shorthand",
			function (node) { return node.computed },
			"Unexpected computed property",
		]),
		ArrowFunctionExpression: ban("Unexpected arrow function"),
		// YieldExpression: ban("Unexpected `yield`"),
		TemplateLiteral: ban("Unexpected template literal"),
		TaggedTemplateLiteral: ban("Unexpected tagged template literal"),
		ObjectPattern: ban("Unexpected object destructuring pattern"),
		ArrayPattern: ban("Unexpected array destructuring pattern"),
		RestElement: ban("Unexpected rest element"),
		ClassExpression: ban("Unexpected class expression"),
		ClassDeclaration: ban("Unexpected class declaration"),
		MetaProperty: ban("Unexpected meta property"),
		BinaryExpression: check([
			function (node) { return node.operator === "**" },
			"Unexpected exponentiation operator",
		]),
		AssignmentExpression: check([
			function (node) { return node.operator === "**=" },
			"Unexpected exponentiation assignment",
		]),
		Literal: check([
			function (node) {
				return node.regex != null && (/u/).test(node.regex.flags)
			},
			"Unexpected regexp /u flag",
			function (node) {
				return node.regex != null && (/s/).test(node.regex.flags)
			},
			"Unexpected regexp /s flag",
			function (node) {
				return node.regex != null &&
					(/\(\?<[=!]/).test(node.regex.pattern)
			},
			"Unexpected regexp lookbehind",
			function (node) {
				return node.regex != null &&
					(/\(\?</).test(node.regex.pattern)
			},
			"Unexpected named regexp capture",
		]),
		CatchClause: check([
			function (node) { return node.param == null },
			"Unexpected catch binding omission",
		]),
	}
}
