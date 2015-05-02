/*
Compiles Mithril templates

Requires sweet.js (https://github.com/mozilla/sweet.js)
Installation: npm install -g sweet.js
Usage: sjs --module /template-compiler.sjs --output <output-filename>.js <input-filename>.js
*/

macro m_impl {
	case { _ ($selector, $dynAttrs ..., $children ...) } => {
		var selectorSyntax = #{$selector};
		var selector = unwrapSyntax(selectorSyntax);
		
		var dynAttrsSyntax = #{$dynAttrs ...};
		try {
			var dynAttrs = unwrapSyntax(dynAttrsSyntax);
			
			var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g;
			var attrParser = /\[(.+?)=("|'|)(.+?)\2\]/;
			var _match = null;
			var classes = [];
			var cell = {tag: "div", attrs: {}, children: []};
			
			while (_match = parser.exec(selector)) {
				if (_match[1] == "") cell.tag = _match[2];
				else if (_match[1] == "#") cell.attrs.id = _match[2];
				else if (_match[1] == ".") classes.push(_match[2]);
				else if (_match[3][0] == "[") {
					var pair = attrParser.exec(_match[3]);
					cell.attrs[pair[1]] = pair[3];
				}
			}
			if (classes.length > 0) cell.attrs["class"] = classes.join(" ");
			
			var tag = makeValue(cell.tag, #{here});
			var attrsBody = Object.keys(cell.attrs).reduce(function(memo, attrName) {
				return memo.concat([
					makeValue(attrName, #{here}),
					makePunc(":", #{here}),
					makeValue(cell.attrs[attrName], #{here}),
					makePunc(",", #{here})
				]);
			}, []).concat(dynAttrs.inner);
			var attrs = [makeDelim("{}", attrsBody, #{here})];
			letstx $tag = [tag], $attrs = attrs;
			
			return #{ ({tag: $tag, attrs: $attrs , children: $children ...}) };
		}
		catch (e) {
			return #{ m_impl($tag, {}, [$dynAttrs ..., $children ...]) }
		}
	}
	case { _ ($selector, $partial ...) } => {
		var partialSyntax = #{$partial ...};
		try {
			var partial = unwrapSyntax(partialSyntax);
			var isTag = partial.inner && partial.inner.length > 2 && (partial.inner[0].token.value == "tag" && partial.inner[1].token.value == ":") || typeof partial != "object" || partial.value == "[]"
			return !isTag ? #{m_impl($selector, $partial ..., [])} : #{m_impl($selector, {}, $partial ...)};
		}
		catch (e) {
			return #{m_impl($selector, {}, $partial ...)}
		}
	}
	case { _ ($selector) } => {
		return #{m_impl($selector, {}, [])};
	}
}
	
let m = macro {
	case { _ ($selector, $dynAttrs ..., $children ...) } => {
		return #{m_impl($selector, $dynAttrs ..., $children ...)}
	}
	case { _ ($selector, $partial ...) } => {
		return #{m_impl($selector, $partial ...)}
	}
	case { _ ($selector) } => {
		return #{m_impl($selector, {}, [])};
	}
	case { _ } => {
		return #{m};
	}
}

export m;
