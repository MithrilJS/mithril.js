module.exports = {
	"env": {
		"browser": true,
		"commonjs": true,
		"node": true
	},
	"globals": {
		"Promise": true
	},
	"extends": "eslint:recommended",
	"rules": {
		"accessor-pairs": "error",
		"array-bracket-spacing": [
			"error",
			"never"
		],
		"array-callback-return": "error",
		"arrow-body-style": "error",
		"arrow-parens": "error",
		"arrow-spacing": "error",
		"block-scoped-var": "off",
		"block-spacing": [
			"error",
			"never"
		],
		"brace-style": "off",
		"callback-return": "off",
		"camelcase": "error",
		"comma-dangle": "off",
		"comma-spacing": [
			"error",
			{
				"after": true,
				"before": false
			}
		],
		"comma-style": [
			"error",
			"last"
		],
		"complexity": "off",
		"computed-property-spacing": [
			"error",
			"never"
		],
		"consistent-return": "off",
		"consistent-this": "off",
		"curly": "off",
		"default-case": "off",
		"dot-location": [
			"error",
			"property"
		],
		"dot-notation": "off",
		"eol-last": "off",
		"eqeqeq": "off",
		"func-names": "off",
		"func-style": "off",
		"generator-star-spacing": "error",
		"global-require": "error",
		"guard-for-in": "off",
		"handle-callback-err": "error",
		"id-blacklist": "error",
		"id-length": "off",
		"id-match": "error",
		"indent": "off",
		"init-declarations": "off",
		"jsx-quotes": "error",
		"key-spacing": "error",
		"keyword-spacing": [
			"error",
			{
				"before": true,
				"after": true
			}
		],
		"lines-around-comment": "error",
		"max-depth": "off",
		"max-len": "off",
		"max-nested-callbacks": "error",
		"max-params": "off",
		"max-statements": "off",
		"max-statements-per-line": "off",
		"new-parens": "off",
		"newline-after-var": "off",
		"newline-before-return": "off",
		"newline-per-chained-call": "off",
		"no-alert": "error",
		"no-array-constructor": "error",
		"no-bitwise": "off",
		"no-caller": "error",
		"no-catch-shadow": "error",
		"no-cond-assign": "off",
		"no-confusing-arrow": "error",
		"no-continue": "error",
		"no-div-regex": "error",
		"no-duplicate-imports": "error",
		"no-else-return": "off",
		"no-empty-function": "off",
		"no-eq-null": "off",
		"no-eval": "error",
		"no-extend-native": "error",
		"no-extra-bind": "error",
		"no-extra-label": "error",
		"no-extra-parens": "off",
		"no-floating-decimal": "error",
		"no-implicit-coercion": "error",
		"no-implicit-globals": "error",
		"no-implied-eval": "error",
		"no-inline-comments": "off",
		"no-inner-declarations": [
			"error",
			"functions"
		],
		"no-invalid-this": "off",
		"no-iterator": "error",
		"no-label-var": "error",
		"no-labels": "error",
		"no-lone-blocks": "error",
		"no-lonely-if": "off",
		"no-loop-func": "off",
		"no-magic-numbers": "off",
		"no-mixed-requires": "error",
		"no-multi-spaces": "error",
		"no-multi-str": "error",
		"no-multiple-empty-lines": "error",
		"no-native-reassign": "error",
		"no-negated-condition": "off",
		"no-nested-ternary": "off",
		"no-new": "off",
		"no-new-func": "off",
		"no-new-object": "error",
		"no-new-require": "error",
		"no-new-wrappers": "error",
		"no-octal-escape": "error",
		"no-param-reassign": "off",
		"no-path-concat": "error",
		"no-plusplus": "off",
		"no-process-env": "error",
		"no-process-exit": "error",
		"no-proto": "error",
		"no-redeclare": "off",
		"no-restricted-globals": "error",
		"no-restricted-imports": "error",
		"no-restricted-modules": "error",
		"no-restricted-syntax": "error",
		"no-return-assign": "off",
		"no-script-url": "error",
		"no-self-compare": "error",
		"no-sequences": "off",
		"no-shadow": "off",
		"no-shadow-restricted-names": "error",
		"no-spaced-func": "error",
		"no-sync": "off",
		"no-ternary": "off",
		"no-throw-literal": "error",
		"no-trailing-spaces": [
			"error",
			{
				"skipBlankLines": true
			}
		],
		"no-undef-init": "error",
		"no-undefined": "off",
		"no-underscore-dangle": "error",
		"no-unmodified-loop-condition": "error",
		"no-unneeded-ternary": "error",
		"no-unsafe-finally": "error",
		"no-unused-expressions": "off",
		"no-unused-vars": [
			"error",
			{
				"varsIgnorePattern": "module"
			}
		],
		"no-use-before-define": "off",
		"no-useless-call": "error",
		"no-useless-computed-key": "error",
		"no-useless-concat": "error",
		"no-useless-constructor": "error",
		"no-useless-escape": "off",
		"no-var": "off",
		"no-void": "error",
		"no-warning-comments": "off",
		"no-whitespace-before-property": "error",
		"no-with": "error",
		"object-curly-spacing": [
			"error",
			"never"
		],
		"object-property-newline": [
			"error",
			{
				"allowMultiplePropertiesPerLine": true
			}
		],
		"object-shorthand": "off",
		"one-var": "off",
		"one-var-declaration-per-line": "off",
		"operator-assignment": [
			"error",
			"always"
		],
		"operator-linebreak": [
			"error",
			"after"
		],
		"padded-blocks": "off",
		"prefer-arrow-callback": "off",
		"prefer-const": "error",
		"prefer-reflect": "off",
		"prefer-rest-params": "off",
		"prefer-spread": "off",
		"prefer-template": "off",
		"quote-props": "off",
		"quotes": [
			"error",
			"double"
		],
		"radix": [
			"error",
			"as-needed"
		],
		"require-jsdoc": "off",
		"require-yield": "error",
		"semi": "off",
		"semi-spacing": [
			"error",
			{
				"after": true,
				"before": false
			}
		],
		"sort-imports": "error",
		"sort-vars": "off",
		"space-before-blocks": "error",
		"space-before-function-paren": "off",
		"space-in-parens": [
			"error",
			"never"
		],
		"space-infix-ops": "error",
		"space-unary-ops": "off",
		"spaced-comment": "off",
		"strict": "off",
		"template-curly-spacing": "error",
		"valid-jsdoc": "error",
		"vars-on-top": "off",
		"wrap-iife": "error",
		"wrap-regex": "error",
		"yield-star-spacing": "error",
		"yoda": [
			"error",
			"never"
		]
	}
};
