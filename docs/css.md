# CSS

- [Vanilla CSS](#vanilla-css)
- [Tachyons](#tachyons)
- [CSS-in-JS](#css-in-js)

---

### Vanilla CSS

For various reasons, CSS has a bad reputation and often developers reach for complex tools in an attempt to make styling more manageable. In this section, we'll take a step back and cover some tips on writing plain CSS:

- **Avoid using the space operator** - The vast majority of CSS maintainability issues are due to CSS specificity issues. The space operator defines a descendant (e.g. `.a .b`) and at the same time, it increases the level of specificity for the CSS rules that apply to that selector, sometimes overriding styles unexpectedly.

	Instead, it's preferable to share a namespace prefix in all class names that belong to a logical group of elements:
	
	```css
	/* AVOID */
	.chat.container {/*...*/}
	.chat .item {/*...*/}
	.chat .avatar {/*...*/}
	.chat .text {/*...*/}
	
	/* PREFER */
	.chat-container {/*...*/}
	.chat-item {/*...*/}
	.chat-avatar {/*...*/}
	.chat-text {/*...*/}
	```

- **Use only single-class selectors** - This convention goes hand-in-hand with the previous one: avoiding high specificity selectors such as `#foo` or `div.bar` help decrease the likelyhood of specificity conflicts.

	```css
	/* AVOID */
	#home {}
	input.highlighted {}
	
	/* PREFER */
	.home {}
	.input-highlighted {}
	```

- **Develop naming conventions** - You can reduce naming collisions by defining keywords for certain types of UI elements. This is particularly effective when brand names are involved:

	```css
	/* AVOID */
	.twitter {} /* icon link in footer */
	.facebook {} /* icon link in footer */
	/* later... */
	.modal.twitter {} /* tweet modal */
	.modal.facebook {} /* share modal */
	
	/* PREFER */
	.link-twitter {}
	.link-facebook {}
	/* later... */
	.modal-twitter {}
	.modal-facebook {}
	```

---

### Tachyons

[Tachyons](https://github.com/tachyons-css/tachyons) is a CSS framework, but the concept behind it can easily be used without the library itself.

The basic idea is that every class name must declare one and only one CSS rule. For example, `bw1` stands for `border-width:1px;`. To create a complex style, one simply combines class names representing each of the required CSS rules. For example, `.black.bg-dark-blue.br2` styles an element with blue background, black text and a 4px border-radius.

Since each class is small and atomic, it's essentially impossible to run into CSS conflicts.

As it turns out, the Tachyons convention fits extremely well with Mithril and JSX:

```jsx
var Hero = ".black.bg-dark-blue.br2.pa3"

m.mount(document.body, <Hero>Hello</Hero>)
// equivalent to `m(".black.bg-dark.br2.pa3", "Hello")`
```

---

### CSS in JS

In plain CSS, all selectors live in the global scope and are prone to name collisions and specificity conflicts. CSS-in-JS aims to solve the issue of scoping in CSS, i.e. it groups related styles into non-global modules that are invisible to each other. CSS-in-JS is suitable for extremely large dev teams working on a single codebase, but it's not a good choice for most teams.

Nowadays there are [a lot of CSS-in-JS libraries with various degrees of robustness](https://github.com/MicheleBertoli/css-in-js). 

The main problem with many of these libraries is that even though they require a non-trivial amount of transpiler tooling and configuration, they also require sacrificing code readability in order to work, e.g. `<a class={classnames(styles.button, styles.danger)}></a>` vs `<a class="button danger"></a>` (or `m("a.button.danger")` if we're using hyperscript).

Often sacrifices also need to be made at time of debugging, when mapping rendered CSS class names back to their source. Often all you get in browser developer tools is a class like `button_fvp6zc2gdj35evhsl73ffzq_0 danger_fgdl0s2a5fmle5g56rbuax71_0` with useless source maps (or worse, entirely criptic class names).

Another common issue is lack of support for less basic CSS features such as `@keyframes` and `@font-face`.

If you are adamant about using a CSS-in-JS library, consider using [J2C](https://github.com/j2css/j2c), which works without configuration and implements `@keyframes` and `@font-face`.
