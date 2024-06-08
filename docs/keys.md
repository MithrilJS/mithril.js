<!--meta-description
Documentation on the special "key" attribute in Mithril.js, which tracks vnodes' identities
-->

# Keys

- [What are keys?](#what-are-keys?)
	- [Key restrictions](#key-restrictions)
- [Linking model data in lists of views](#linking-model-data-to-views)
- [Keeping collections of animated objects glitch-free](#keeping-collections-of-animated-objects-glitch-free)
- [Reinitializing views with single-child keyed fragments](#reinitializing-views-with-single-child-keyed-fragments)
- [Common gotchas](#common-gotchas)
	- [Wrapping keyed elements](#wrapping-keyed-elements)
	- [Putting keys inside the component](#putting-keys-inside-the-component)
	- [Keying elements unnecessarily](#keying-elements-unnecessarily)
	- [Mixing key types](#mixing-key-types)
	- [Hiding keyed elements with holes](#hiding-keyed-elements-with-holes)
	- [Duplicate keys](#duplicate-keys)

---

### What are keys?

Keys represent tracked identities. You can add them to [element, component, and fragment vnodes](vnodes.md) via the magic `key` attribute, and they look something like this when used:

```javascript
m(".user", {key: user.id}, [/* ... */])
```

They are useful in a few scenarios:

- When you're rendering model data or other stateful data, you need keys to keep the local state tied to the right subtree.
- When you're independently animating multiple adjacent nodes using CSS and you could remove any one of them individually, you need keys to ensure the animations stick with the elements and don't end up unexpectedly jumping to other nodes.
- When you need to reinitialize a subtree on command, you need to add a key and then change it and redraw whenever you want to reinitialize it.

#### Key restrictions

**Important:** For all fragments, their children must contain either exclusively vnodes with key attributes (keyed fragment) or exclusively vnodes without key attributes (unkeyed fragment). Key attributes can only exist on vnodes that support attributes in the first place, namely [element, component, and fragment vnodes](vnodes.md). Other vnodes, like `null`, `undefined`, and strings, can't have attributes of any kind, so they can't have key attributes and thus cannot be used in keyed fragments.

What this translates to is stuff like `[m(".foo", {key: 1}), null]` and `["foo", m(".bar", {key: 2})]` won't work, but `[m(".foo", {key: 1}), m(".bar", {key: 2})]` and `[m(".foo"), null]` will. If you forget this, you'll get a very helpful error explaining this.

### Linking model data in lists of views

When you're rendering lists, especially editable list, you're often dealing with things like editable TODOs and such. These have state and identities, and you have to give Mithril.js the information it needs to track them.

Suppose we have a simple social media post listing, where you can comment on posts and where you can hide posts for reasons like reporting them.

```javascript
// `User` and `ComposeWindow` omitted for brevity
function CommentCompose() {
	return {
		view: function(vnode) {
			var post = vnode.attrs.post
			return m(ComposeWindow, {
				placeholder: "Write your comment...",
				submit: function(text) {
					return Model.addComment(post, text)
				},
			})
		}
	}
}

function Comment() {
	return {
		view: function(vnode) {
			var comment = vnode.attrs.comment
			return m(".comment",
				m(User, {user: comment.user}),
				m(".comment-body", comment.text),
				m("a.comment-hide",
					{onclick: function() {
						Model.hideComment(comment).then(m.redraw)
					}},
					"I don't like this"
				)
			)
		}
	}
}

function PostCompose() {
	return {
		view: function(vnode) {
			var comment = vnode.attrs.comment
			return m(ComposeWindow, {
				placeholder: "Write your post...",
				submit: Model.createPost,
			})
		}
	}
}

function Post(vnode) {
	var showComments = false
	var commentsFetched = false

	return {
		view: function(vnode) {
			var post = vnode.attrs.post
			var comments = showComments ? Model.getComments(post) : null
			return m(".post",
				m(User, {user: post.user}),
				m(".post-body", post.text),
				m(".post-meta",
					m("a.post-comment-count",
						{onclick: function() {
							if (!showComments && !commentsFetched) {
								commentsFetched = true
								Model.fetchComments(post).then(m.redraw)
							}
							showComments = !showComments
						}},
						post.commentCount, " comment",
						post.commentCount === 1 ? "" : "s",
					),
					m("a.post-hide",
						{onclick: function() {
							Model.hidePost(post).then(m.redraw)
						}},
						"I don't like this"
					)
				),
				showComments ? m(".post-comments",
					comments == null
					? m(".comment-list-loading", "Loading...")
					: [
						m(".comment-list", comments.map(function(comment) {
							return m(Comment, {comment: comment})
						})),
						m(CommentCompose, {post: post}),
					]
				) : null
			)
		}
	}
}

function Feed() {
	Model.fetchPosts().then(m.redraw)
	return {
		view: function() {
			var posts = Model.getPosts()
			return m(".feed",
				m("h1", "Feed"),
				posts == null ? m(".post-list-loading", "Loading...")
				: m(".post-view",
					m(PostCompose),
					m(".post-list", posts.map(function(post) {
						return m(Post, {post: post})
					}))
				)
			)
		}
	}
}
```

It encapsulates a lot of functionality as you can tell, but I'd like to zoom into two things:

```javascript
// In the `Feed` component
m(".post-list", posts.map(function(post) {
	return m(Post, {post: post})
}))

// In the `Post` component
m(".comment-list", comments.map(function(comment) {
	return m(Comment, {comment: comment})
}))
```

Each of these refers to a subtree with associated state Mithril.js has no idea about. (Mithril.js only knows about vnodes, nothing else.) When you leave those unkeyed, things can and will get weird and unexpected. In this case, try clicking on the "N comments" to show the comments, typing into the comment compose box at the bottom of it, then clicking "I don't like this" on a post above it. [Here's a live demo for you to try it out on, complete with a mock model. (Note: if you're on Edge or IE, you may run into issues due to the link's hash length.)](https://flems.io/#0=N4Igxg9gdgzhA2BTEAucD4EMAONEBMQAaEGMAJw1QG0AGIgZgCYB2AXRIDMBLJGG0FEwBbZGgB0ACwAuw+MXRRpiJahAgAvkUEixIYRHyJ44gFb8SkJSulqAOiACueAAQxp5bmGkO7UPwBumOQuALKGxi4AvC4AFJyOUN7c0LEAlC7AfnbSQSFgmGCSiNEuAPIARqaI3uIUiJjKsVCO8PBp2T7+0glJ0ilQLgVFBLEA1ogAnkQu3FDc0hlZ3TnkiNKO5IPDxdQTk2wuAIQxLW0uAPxDhbv7hyhxO4h7U4cxcwvpHd0a2d29yWgLmEmAmAFU8OR0plOjk8i5nIhyAA5XSlTigpHiObKLbrcSIlG6dKwjzrTbbG6jByElAOFwAagRkNRohmAP6qSWpJyAHpeS4AJJGTBtaZCgDk+Bcpmc0mZJXgEDWwmw3AAHpF8Nw1t54OKKo55QsXPgIIgYFAJfKYI5sNhlV0cs7pPyXAAJAAqnoACgBlcQuP0QWawZSYfAzQUuSQRlzSEMAd08ymBkxcEETgwAjo4vGMXMj1vBuJx05CAl5EDzXQKEy5E8qC8EIIlpSbMFB20l4I4jC5sJRsEiXABhMoAJT9MYaRnIMDpKx8tZj0mkuBQ-IA5gtJI4KnUIMJedwYNxMJJRBHMzBeUqVWrNfAALSQefPwcQdWTGvw7jCLcwXIeBSgcGR1wXfljEQLdO2kZ9k24LcZGfTAABZMAAVkQNDxCgYtS0mQ9jzwgiy15DkBlvNZcwtHwQD+F1VnJLZgXEGjHDo2J-0A4CZmWJjlwqQoxi3Sg2weDxOKIGtmJgB1YEQT1JmHB4HAqJUKgcGSlxyDQ0nEaRiigeJEkBEyNIgCpuV05c1g2ViBOXQTuHwB5HDzfBxACND0h0wSXUJVlEHclldH85zIsJH0vAckKXDBCcABk6jWRpEEqapvESpLYks6yIsE35bP00lSp+RiejMzlBhBcFIRgWJIESRYYSXeFCRgUpqDYUlOGVOI-1KWgAG5ZhcAAeIZWyUMbuAZBkMk68RsGcSRYjqxAISRL5SXsikXB9ShhFPRBxFFeBYk6749Mq+EwE2NYlG28gZgddwYEqyigU4dYihe6EnOYhzKRGfBYhpSFtJcb6TJswT9tYzaAYMoyVFMvoBiuyF4cinIHvIJ7pBe0pCRrcqXQp6Ris6WGYb+yQfQgD7Ab2ljQeKcGHHe6RPuIGHqqx3GXUR2rMRexqMQmch2M7M1hDwxxhAqHbgBOqAHgARhmEF1QeJhaH0m68ekQzjIx8zYhLdxhZNnmupia3TZBbALZq7GkVtgKyRBtrvZctyEU87zfLSQqTcCyFQqRcP-bXRB1WkB4paxe9EAV5RE782STcgYRRCUUcZqTmHMRl8g5aPRXldV9WHnoYFMD1lwGENsOc8pjvqeNoqe+7zoae6e6jwL3nSkympTfqdLmladovsFn6GaL-ObEannbdF64wYhkAebpEBGQHZnTdc9lF7hv3Iq35GGtiHniNHouWtR83Yat09WqByK89HmBqAfq5N4LgnbiBdm7LGhIvbX3ZlfOOrl3LBx8tnWyglaQKlel3HImcS4pxlmnDOCdpAoLjjTE2VNKZ9ypoPHIdMVQQACIgAAQpMYUH93AzAWOnW2w8WrDT6gNWIQ0YijXGlNUBSAoBbiMnNBa0DSxxCdtQbgbBsTShOO8ZQCtXIZCUc1JQC1gFKJUWVUkEiVDSMkKUfRTo7KwPwomQ6x1ToQNSGsOA8BGFLDcOsT0-5ECtmIe4hAjCZiYVoLQDI1DKpb2-r9aQ-0o70wSZIF64d4lFCZh9ZODMsm83ScvEea8ckpJXn-WOS4tzrBesnC+rNbJbwJkTF6ZUKkuiqdIPJC4BaYy5HAuxvt7bHFOHPS4x8PriBgCWMAiBoQPDOPAVplV8ZpWUHk2pvSTI4OgVvDJqTITpDNujd+0Ccj2xWmtWI38A6INciHEhEcNhJKaTYNJXccGSSIbHH+RTC7F3rt8vSfcgVLP8EuSQrlEDrJ6ZbDe-TgYHXoYwlhbD7ZvRPlQ-ylT1hlOKTC92cLrk+wOr-NeACT5qMOCcFwCyxmkqUP-QB+BVFTKrHMmlc9QWkgjPgXFSgNmwpPjMbZ8LiWsSOkeU6502ixGoDnPZKNAU9EKavBl98MU1jYK-Y5dTTkJN+bzcl7hKUXJgOtIlLoEFBzucg9uqDlzoJec9SESrsFEM+YnJVFDlzeq0MsoykK+W4LqYSmsW8kXMNYeDelhqmUcHGYsLl1M-D6XSAoPASBzL8DQJrTCKBMIAE5NDaBAEIUQagzAWEUMoVQaBIYlHcJ4bwvgwV0xRlfWJpJKyIETAK92AQoARGgR1SEpQB0RHOmuecBIoYNNgcIXeM6kTaRzguhwS7yAflipsas-M10gB4tDYAMByBgGjjLaK261hGyVfujdz4y27pmA4AAAtDQkG7gp2sElQgeKa-h0xXu9RAAB1OYZpEz1LhMENw+4TprjmFudEoo8CdHhDgzh8x+iindIgJCMhOidvatwHtfasbjqMMOmDPMx2DqMJOjwMAVonzDfOxdedgMrvtfunBwQGhcbjhayK2oYCYA0gQB4toKjwf6FImYQRezxQw1ghMSRVnxXfhRxAeqXJYfPPAXD+H5QxAZImcDmZxAdKA0aAgfppCTCQEIujZ15YGWKEZyZ0zZkN2fEwYFjytPiHlpM+zSApB4eQsZlwDhMBGggC2uOLpAvBfcA5s67nIulFCI0SQYCm7cT0zhiLMh5POaC1XMglA2iGcixkJk3N1QJceXpV1y5oBzFWsGzZsREABB05FHBpReuGWCB07yopOIqZyMN6Qo38SpbCxlmQoEQCxYTE1xLygAgjfIGNhb6XitRey0ZPL6oCsLH0zVkrLgZtzdNpVjAV3Wr1b3o1hi9rKatbOVgGZkgEBzgeIFxojGVo-cQH9+Ac5Wt+vtd+k2d6OPM0QM+KT8Hob7sNGuaAAnHnAGgGAaZYwyN9KEy6VHCxZNIZiFJasH3lxA6nUx8nxDtlHJMic0V3tmeU+Q-AVDdOXQKzWPgCukH-O9xU4NmIvh3ukJh4lkAeSNuRTSP539FUoCD0AwaoDSOoNisGN-btvb8Xkec1RkINGYgM5BzzVjvsF267wGBrsmZ+I52wGDiHAPosgBAymEokxWz5ANeIMPOPBLM+J1soh-Wt7hCMCYHlQb1UcPjLHnO8vIq+r-ZrgDF8xwGv10RpLJGTeafN6K4eqqos2+nTG+3B0EcGoj5FBdaTMiOtD4SfSt72MGufBUQwP5+YxsMrHvvMXH42GfBCowrfBJ457PmaP+u44J+MFIQNReY3apMkLggovxc+qz-7EA0YzRWnlCWCY8YIV8xzmr0xGutcF7yU72ZuMS-07L6vrTFvpoa9aMJ1gd68W850HdYgP8XcIN3d7VPdChwd-skQ1I-cA8XAg9NgE0w9xAF9lwo8wgIgTBp41khVyZ1dbo89W038T4nMh0r54QzVMwg0HZS4+dadoMQ8a8YAAAxBmAgXnfnQjWBI3X-U3VIf-KvajE+YA+jUApjO3WyavP+UoJgxMFgsZDfEwKzA1deDFFweZTlCApvRdO3YgVdWIDvYAdBB+HvOHQSO9HmQfYfaGB+bZSfEAZjdwZ8UQWbPAwXXeTALw+CGNV8YufwyKJfAnFfcQy+UnSKBRWII4NQjQgAMlSOOBjV4P4PwH60EiyL4JSQEOp3IEmwF0ii0PED2RYNT0WDZw2nYkP0wETGPyKim15j+3UN0NKGSM6JYJUw0FP0eQfhjWfiUGfUPgb3MPKJGJ12LmiCiBiE1jGRlwMN9z5la3sPh0COCNn0hQiJdCiMJ1XzyOXEqLnyhVoI3nqIPxF2aNaJPy+3ogv2gGtBAW4FvwDQfzp2Py2LJz6O6KuEcJPjCO4IOP1W4IWI5TaC7iBP7xr2fCdkRIgAjEQ2hgcCShRO1CkRwIcAeIeDlXKObwRKdmhiyLy1dnfl305xNhvigINX4hjQeBjW9W9hvRU0dzmNVCR34n3gTV7y7l6lhzWIWRrAoOTSoL8Dpj4NGFxkqL2S6UOTRn30aLuJaOEN9lENI1iLX3p2kI+iyyIMs3WEVP8zpPXV+gIAiP3UkE1nRJABlPwDxKVSGUWOhJAjhPXScKRKVFRKkXtMxL9K3FxJAGPweGBO8ON3BIXXfyPGAz+Lb1MJBNJP5nOXAXflDXKLpLyV5JPgeB5lZOz1V0fzFOf0oMHgVgMBaliDNAelHnECH3wHFEdLSHTWgizTUE1mYBQCYAADZi0dBy0JAwAYAq0rAa1bA0BGz0xlgXAYZoB4IMQTp9QHgABBTwUUGYUTWAFHJEUsEaf9MFDdNqOckTBAyYZOJAdUA8wYFwUUJCKAZ8LhYQbpGZawcgG8weYIlwY82cxuXbOYZwrHYQeucQbCYQT8v4e9NUbwHdE8-8ncR8zwSLUC8CyCo8wkLdWCtYWYACeCpbEuBgdOG8ucofcgOcZ8CubUZwB4IiiCw8vwYImYYiYDeCsin3TWbAdUNwBAVyFwDSESEi-i5UCiqi7gGilwTWYivwOc7AHlRDLWaS28kEACx8hMbAUClgNChiqAFipHdPROPjTANikSlAmlaARAIS9xbgAAL3ikHXwiEoYSRE4CVBNznyMCgCErM3wCMi1giQAFIhKCLaKlLTzTxzyHhLIwAxghL+olAUdbL4opL6LJTdLEc8AUc4MTQ-ycFUISwtwNYXBkKZB0LGKMqShMdVN4L4r4Izw7LFLUrSLTLN0xKJKmAwrhLyKzKHLLKZL+KRIxIZpA4ABiWgTAFgISyAe8B4EazgeaoSuS-AbErcVC9OSSzqs8rAC80MEsfCQfJUGKsq3Spw3w4yv8razAHa1yhOIS2UdwQiMI6wflNwOSmZQfdYRMRAFQISlSxC58dSzS7S282qxKhqlwWgcQAADiUq-NOvWGMoAD4XAAAqI+NGv8v6wCpATgEuFK463Y0ImxZipwi45i0Ii4ky7q8geZCyxa+SqReuOKhcsG5Kzq0G-bB4BYe8sAKazYOAGm4+HEJEAmpwom-5P7RhTBE6kEi4lASWmOcqgfOWhWkIP86a5UWaqG7W0WkErI+CrGtSiADSiGsC2Gv4F9BCRACoMYBYZ8fYTgCuUQLqTsf8dKQMla+C2gAKzIaaZ6kuDErEtEkAMaYqOcpgTCH24AP2ic1Aj2xDXAkOlwMOlwcJKOmOmwOOoOnExO0O-qrS9O8czO33eOnO3O5Ow8l9B2p2i0O8+YEEZQUupDP87232oul6wOoMhwPO28iOwuhc4uzula8ulOtOtugejukAJu8PJOlOgu8e-2rOoMkMnuuczWQKhe2Oku7OrcbuiutK8QX0z23KohJ8rsYu58AtK+gtLioSva5HEKiGgmo+hSlATAXGkcE+xOM+zykuUafq++2fQ7LmwreAISy6na6K2K-q9ugOqenele-qq2m2u212hugYfWLqe+mDSGzCF2+u92ne0MHgLDPq28tBxoDBlwJgLBuYBoEIXB-Bt2xuohuYEhrhAm0Ip2Gqlm+q+KSGmG1Kr8rhz+H8zCmCuKXC5u-qx+jqoRqCmNeCpalaxqoS9isyzi7ijxPigSo6-q9R1q1EiSyGrSzqvK+8wqh4Eq6QThgfac+C8xgqoqnGmx-qxxh8yTWbcgVxg+imyFA20bQCwG020x+Ro8sW7ovS1wP8gxrWLiniksaUXR6B28gxyiox7pSG3szq5RhSkJ4Gucw2gG42pmnSwmyJiqgyrxhofC4Bludm3hpK0CwR3W7w-WqJyqo0aqv8jmpp02lp-q3Jxm028CjaoRtszNGqbNEALspgFATWTQDgEAPasYbNagQcvQeDSQTweQEgTYeQNAcCDcfkRIbAUSYiXkLZnZl9JgcQSGtCS53cHZsBOYStBQezYcNQSrbgbAWwLQDZtQPBF9XCTWO5hQfZtQI5yCXkRMGy8i7EKAXkdwOWUUCyiiMuYF8QUF2gd5lSPQb535gc0tXQNQDyVyF9BgcQSlhgcF4CSFtcY5mFuFryOYJF2bLsVF-CXkMl-AClqlql3Fz5tAAlv5tgDQIAA)

Instead of doing what you would expect, it instead gets really confused and does the wrong thing: it closes the comment list you had open and the post after the one you had the comments open on now just persistently shows "Loading..." even though it thinks it's already loaded the comments. This is because the comments are lazily loaded and they just assume the same comment is passed each time (which sounds relatively sane here), but in this case, it's not. This is because of how Mithril.js patches unkeyed fragments: it patches them one by one iteratively in a very simple fashion. So in this case, the diff might look like this:

- Before: `A, B, C, D, E`
- Patched: `A, B, C -> D, D -> E, E -> (removed)`

And since the component remains the same (it's always `Comment`), only the attributes change and it's not replaced.

To fix this bug, you simply add a key, so Mithril.js knows to potentially move state around if necessary to fix the issue. [Here's a live, working example of everything fixed.](https://flems.io/#0=N4Igxg9gdgzhA2BTEAucD4EMAONEBMQAaEGMAJw1QG0AGIgZgCYB2AXRIDMBLJGG0FEwBbZGgB0ACwAuw+MXRRpiJahAgAvkUEixIYRHyJ44gFb8SkJSulqAOiACueAAQxp5bmGkO7UPwBumOQuALKGxi4AvC4AFJyOUN7c0LEAlC7AfnbSQSFgmGCSiNEuAPIARqaI3uIUiJjKsVCO8PBp2T7+0glJ0ilQLgVFBLEA1ogAnkQu3FDc0hlZ3TnkiNKO5IPDxdQTk2wuAIQxLW0uAPxDhbv7hyhxO4h7U4cxcwvpHd0a2d29yWgLmEmAmAFU8OR0plOjk8i5nIhyAA5XSlTigpHiObKLbrcSIlG6dKwjzrTbbG6jByElAOFwAagRkNRohmAP6qSWpJyAHpeS4AJJGTBtaZCgDk+Bcpmc0mZJXgEDWwmw3AAHpF8Nw1t54OKKo55QsXPgIIgYFAJfKYI5sNhlV0cs7pPyXAAJAAqnoACgBlcQuP0QWawZSYfAzQUuSQRlzSEMAd08ymBkxcEETgwAjo4vGMXMj1vBuJx05CAl5EDzXQKEy5E8qC8EIIlpSbMFB20l4I4jC5sJRsEiXABhMoAJT9MYaRnIMDpKx8tZj0mkuBQ-IA5gtJI4KnUIMJedwYNxMJJRBHMzBeUqVWrNfAALSQefPwcQdWTGvw7jCLcwXIeBSgcGR1wXfljEQLdO2kZ9k24LcZGfTAABZMAAVkQNDxCgYtS0mQ9jzwgiy15DkBlvNZcwtHwQD+F1VnJLZgXEGjHDo2J-0A4CZmWJjlwqQoxi3Sg2weDxOKIGtmJgB1YEQT1JmHB4HAqJUKgcGSlxyDQ0nEaRiigeJEkBEyNIgCpuV05c1g2ViBOXQTuHwB5HDzfBxACND0h0wSXUJVlEHclldH85zIsJH0vAckKXDBCcABk6jWRpEEqapvESpLYks6yIsE35bP00lSp+RiejMzlBhBcFIRgWJIESRYYSXeFCRgUpqDYUlOGVOI-1KWgAG5ZhcAAeIZWyUMbuAZBkMk68RsGcSRYjqxAISRL5SXsikXB9ShhFPRBxFFeBYk6749Mq+EwE2NYlG28gZgddwYEqyigU4dYihe6EnOYhzKRGfBYhpSFtJcb6TJswT9tYzaAYMoyVFMvoBiuyF4cinIHvIJ7pBe0pCRrcqXQp6Ris6WGYb+yQfQgD7Ab2ljQeKcGHHe6RPuIGHqqx3GXUR2rMRexqMQmch2M7M1hDwxxhAqHbgBOqAHgARhmEF1QeJhaH0m68ekQzjIx8zYhLdxhZNnmupia3TZBbALZq7GkVtgKyRBtrvZctyEU87zfLSQqTcCyFQqRcP-bXRB1WkB4paxe9EAV5RE782STcgYRRCUUcZqTmHMRl8g5aPRXldV9WHnoYFMD1lwGENsOc8pjvqeNoqe+7zoae6e6jwL3nSkympTfqdLmladovsFn6GaL-ObEannbdF64wYhkAebpEBGQHZnTdc9lF7hv3Iq35GGtiHniNHouWtR83Yat09WqByK89HmBqAfq5N4LgnbiBdm7LGhIvbX3ZlfOOrl3LBx8tnWyglaQKlel3HImcS4pxlmnDOCdpAoLjjTE2VNKZ9ypoPHIdMVQQACIgAAQpMYUH93AzAWOnW2w8WrDT6gNWIQ0YijXGlNUBSAoBbiMnNBa0DSxxCdtQbgbBsTShOO8ZQCtXIZCUc1JQC1gFKJUWVUkEiVDSMkKUfRTo7KwPwomQ6x1ToQNSGsOA8BGFLDcOsT0-5ECtmIe4hAjCZiYVoLQDI1DKpb2-r9aQ-0o70wSZIF64d4lFCZh9ZODMsm83ScvEea8ckpJXn-WOS4tzrBesnC+rNbJbwJkTF6ZUKkuiqdIPJC4BaYy5HAuxvt7bHFOHPS4x8PriBgCWMAiBoQPDOPAVplV8ZpWUHk2pvSTI4OgVvDJqTITpDNujd+0Ccj2xWmtWI38A6INciHEhEcNhJKaTYNJXccGSSIbHH+RTC7F3rt8vSfcgVLP8EuSQrlEDrJ6ZbDe-TgYHXoYwlhbD7ZvRPlQ-ylT1hlOKTC92cLrk+wOr-NeACT5qMOCcFwCyxmkqUP-QB+BVFTKrHMmlc9QWkgjPgXFSgNmwpPjMbZ8LiWsSOkeU6502ixGoDnPZKNAU9EKavBl98MU1jYK-Y5dTTkJN+bzcl7hKUXJgOtIlLoEFBzucg9uqDlzoJec9SESrsFEM+YnJVFDlzeq0MsoykK+W4LqYSmsW8kXMNYeDelhqmUcHGYsLl1M-D6XSAoPASBzL8DQJrTCKBMIAE5NDaBAEIUQagzAWEUMoVQaBIYlHcJ4bwvgwV0xRlfWJpJKyIETAK92AQoARGgR1SEpQB0RHOmuecBIoYNNgcIXeM6kTaRzguhwS7yAflipsas-M10gB4tDYAMByBgGjjLaK261hGyVfujdz4y27pmA4AAAtDQkG7gp2sElQgeKa-h0xXu9RAAB1OYZpEz1LhMENw+4TprjmFudEoo8CdHhDgzh8x+iindIgJCMhOidvatwHtfasbjqMMOmDPMx2DqMJOjwMAVonzDfOxdedgMrvtfunBwQGhcbjhayK2oYCYA0gQB4toKjwf6FImYQRezxQw1ghMSRVnxXfhRxAeqXJYfPPAXD+H5QxAZImcDmZxAdKA0aAgfppCTCQEIujZ15YGWKEZyZ0zZkN2fEwYFjytPiHlpM+zSApB4eQsZlwDhMBGggC2uOLpAvBfcA5s67nIulFCI0SQYCm7cT0zhiLMh5POaC1XMglA2iGcixkJk3N1QJceXpV1y5oBzFWsGzZsREABB05FHBpReuGWCB07yopOIqZyMN6Qo38SpbCxlmQoEQCxYTE1xLygAgjfIGNhb6XitRey0ZPL6oCsLH0zVkrLgZtzdNpVjAV3Wr1b3o1hi9rKatbOVgGZkgEBzgeIFxojGVo-cQH9+Ac5Wt+vtd+k2d6OPM0QM+KT8Hob7sNGuaAAnHnAGgGAaZYwyN9KEy6VHCxZNIZiFJasH3lxA6nUx8nxDtlHJMic0V3tmeU+Q-AVDdOXQKzWPgCukH-O9xU4NmIvh3ukJh4lkAeSNuRTSP539FUoCD0AwaoDSOoNisGN-btvb8Xkec1RkINGYgM5BzzVjvsF267wGBrsmZ+I52wGDiHAPosgBAymEokxWz5ANeIMPOPBLM+J1soh-Wt7hCMCYHlQb1UcPjLHnO8vIq+r-ZrgDF8xwGv10RpLJGTeafN6K4eqqos2+nTG+3B0EcGoj5FBdaTMiOtD4SfSt72MGufBUQwP5+YxsMrHvvMXH42GfBCowrfBJ457PmaP+u44J+MFIQNReY3apMkLggovxc+qz-7EA0YzRWnlCWCY8YIV8xzmr0xGutcF7yU72ZuMS-07L6vrTFvpoa9aMJ1gd68W850HdYgP8XcIN3d7VPdChwd-skQ1I-cA8XAg9NgE0w9xAF9lwo8wgIgTBp41khVyZ1dbo89W038T4nMh0r54QzVMwg0HZS4+dadoMQ8a8YAAAxBmAgXnfnQjWBI3X-U3VIf-KvajE+YA+jUApjO3WyavP+UoJgxMFgsZDfEwKzA1deDFFweZTlCApvRdO3YgVdWIDvYAdBB+HvOHQSO9HmQfYfaGB+bZSfEAZjdwZ8UQWbPAwXXeTALw+CGNV8YufwyKJfAnFfcQy+UnSKBRWII4NQjQgAMlSOOBjV4P4PwH60EiyL4JSQEOp3IEmwF0ii0PED2RYNT0WDZw2nYkP0wETGPyKim15j+3UN0NKGSM6JYJUw0FP0eQfhjWfiUGfUPgb3MPKJGJ12LmiCiBiE1jGRlwMN9z5la3sPh0COCNn0hQiJdCiMJ1XzyOXEqLnyhVoI3nqIPxF2aNaJPy+3ogv2gGtBAW4FvwDQfzp2Py2LJz6O6KuEcJPjCO4IOP1W4IWI5TaC7iBP7xr2fCdkRIgAjEQ2hgcCShRO1CkRwIcAeIeDlXKObwRKdmhiyLy1dnfl305xNhvigINX4n2AeDHzPkANHmZINW9W9hvRU0dzmNVCR34n3gTV7y7l6lhzWIWRrAoOTSoL8Dpj4NGFxkqL2S6UOTRn30aLuJaOEN9lENI1iLX3p2kI+iyyIMs3WDVP8zpPXV+gIAiP3UkE1nRJAEVPwDxKVSGUWOhJAjhPXScKRKVFRKkRdMxODK3FxJAGPweGBO8ON3BIXXfyPGAz+Lb1MJBNJP5nOXAXflDXKLpLyUZKmAeCZXRXcBLJPi5Oz1V0f2lOf0oMHgVgMBaliDNAelHnECH3wHFDdLSHTWgizTUE1gADZNYUAmAAAOYtHQctCQMAGAKtKwGtWwNALs9MZYFwGGaAeCDEE6fUB4AAQU8FFBmFE1gBRyRFLBGn-TBQ3Tak3JEwQMmGTiQHVGvMGBcFFCQigGfC4WEG6RmWsHIHfMHmCJcDvI3Mbl2zmGcKx2EHrnEGwmEBAr+HvTVG8B3XvKgp3B-M8EiwQqQpQtvMJC3QwrWFmAAiwqWxLgYHTnfM3KH3IDnGfArm1GcAeFouQpvL8GCJmGImAywsYp901mwHVDcAQFchcA0hEnoqkuVGYtYu4HYpcE1jor8E3OwB5UQy1jUo-JBGgp-ITGwAQpYEIu4qgH4qR3T0Tj40wEEvkpQJpWgEQFkvcW4AAC94pB18JZKGEkROAlQTc58jAoBZKzN8AjItYIkABSWS6iji3Sh808J8h4SyMAMYWS-qJQFHDy+KVSriuUiyxHPAFHODE0SCnBVCEsLcDWFwPCmQIini4qkoTHVTLCrK+CM8TynSgqhihyzdRS5SpgRKuSpixy7yly9SqSkSMSGaQOAAYloEwBYFksgHvAeHms4C2tks0vwGxK3AIvThUpGsfKwGfNDBLHwkHyVHSsaosqcN8LssgtOswHOoCoTlktlHcEIjCOsH5TcE0pmUH3WETEQBUFkv0pwufCMpMrMo-I6pyu6pcFoHEAnN0tAoevWDsoAD4XAAAqI+AmyCyGmCpATgEufKu63Y0ImxPipwi4vi0Ii4+ysa8geZZynarSqReuTK7cxGvKkahG-bB4BYL8sAVazYOANm4+HEJEKmpwmm-5P7RhTBe6kEi4lAZWmOJqgfDWrWkISCta5UDaic02+WkErIrCkmwyiAYy5GxC9Gv4F9BCRACoMYBYZ8fYTgCuUQLqTsf8dKMM-arC2gaKzIaaP6kuDErEtEkAMaYqTcpgTCMO4ACO5c1AoOxDXAuOlwBOlwcJFOtOmwDOmOnE7O+Oqa0ywupc4u33TOsu8u3Om8l9L2n2i0T8+YEEZQeupDSC0O8Omu-66O8MhwCuj8pO6u7c2u4e-axuvOgugeqeoekAHu8PHOvOquxeyOku8MyMsezczWGKre9Ouu0urcUepuwq8QIM4OiqohX8rsWu58AtF+gtUS2Sy65HeK5Gqmm+7SlATAcmkcO+xOB+kKkuUaKaz+2fQ7EWwreAWSl686tKjKqaweqOles+veqal2t2j2-2rugYfWLqT+mDFGzCP2zuwOs+0MHgLDSaj8ghxoIhlwJgEhuYBoEIchyhgO7umhuYOhrhKm0Ip2dqvmrq+KFGtGgq0CkRz+cCki9CuKCi3uqa7+4amR1CmNLC3a-anq2SoSxykSsSjxSS6S26qawxga1E5SlG0ykayqr8mqh4eq6QYRgfNcrCxx6q2qsmtxqa7x78yTWbcgfxq+pmyFK20bGCmG+2+xzR28hW7oyy1wSCqxrWUS8SksaUcx1Bj8qxlimx7pFG4cka3R7SuJuGzc626G22nm8y6m5J5q6ykJhoKi2BluQW8R3KhC6R827wy2lJlqo0NqyCoWnp+2vpqa8p7m+2pC46mR-szNGqbNEATWZgFATWTQDgEAS6sYbNagGcvQeDSQTweQEgTYeQNAcCDcfkRIbAUSYiXkE5s5l9JgcQFGtCZ53cM5sBOYStBQezYcNQSrbgbAWwLQI5tQPBF9XCTWD5hQS5tQG5yCXkRMdypi7EKAXkdwOWUUZyiiMuWF8QeF2gQFlSPQUF8F6c0tXQNQDyVyF9BgcQZlhgRF4CZFtcW5tFjFryOYHF2bLsfF-CXkBl-AJlllll8l4FtAKliFtgDQIAA)

```javascript
// In the `Feed` component
m(".post-list", posts.map(function(post) {
	return m(Post, {key: post.id, post: post})
}))

// In the `Post` component
m(".comment-list", comments.map(function(comment) {
	return m(Comment, {key: comment.id, comment: comment})
}))
```

Note that for the comments, while it would technically work without keys in this case, it would similarly break if you were to add anything like nested comments or the ability to edit them, and you'd have to add keys to them.

### Keeping collections of animated objects glitch-free

On certain occasions, you might be wanting to animate lists, boxes, and similar. Let's start out with this simple code:

```javascript
var colors = ["red", "yellow", "blue", "gray"]
var counter = 0

function getColor() {
	var color = colors[counter]
	counter = (counter + 1) % colors.length
	return color
}

function Boxes() {
	var boxes = []

	function add() {
		boxes.push({color: getColor()})
	}

	function remove(box) {
		var index = boxes.indexOf(box)
		boxes.splice(index, 1)
	}

	return {
		view: function() {
			return [
				m("button", {onclick: add}, "Add box, click box to remove"),
				m(".container", boxes.map(function(box, i) {
					return m(".box",
						{
							"data-color": box.color,
							onclick: function() { remove(box) },
						},
						m(".stretch")
					)
				})),
			]
		},
	}
}
```

It looks pretty innocent, but [try a live example](https://flems.io/#0=N4IgzgxgTg9gNnEAuA2gBgDRoLoZAMwEs4BTMZFUAOwEMBbE5EAOgAsAXOxPCGK9kvyYgAvhmr1GSFgCtyPPgKHSAbjSgACXnBhQwGgLwaUAHRBQSAEzMYNZgJ4kEMAO427IAEZwAriXdmAOZQNPZm2CZUapq8PvwkmkZokZH4cRDshHwagSTsAMLwugAUAJQawCns0VpFibU6eiix8VARVCbsLQL1xd0JGgDUGgCM5QCkDbpgzKRUgeysVRbsPlBUU1CRIilUaVQZWRsAQjAAHmRlFVU1nudkhsbtVfuH2TSWlleVHeyddxcZgAHHxgVjFYDaXRIHJ5QqNMoiUpVHYdX6vTLZCx0GAqEjFAHlH6dTo1QhUSwkM6PAFkZjkylnADy+AJ52Rv3+9xmYCBcEIEHxDKptjGKN2nRWaw2xL+1UIJBcMIxR2+VRJ7Cl62M6rlnToxTMnh87HYfHcwD4EH5EAA1jCPpYxB4AIKfDQA2zWgW2j3nDRmjTY3H+EClDC6jUGszMXj8GjkhLuWkzOg0IHFFV8NlnWyEImRvWavLSjTRlgAmyFjWdWU1oskkCWGjsGgAWihW2QfrOsbqEc5DaLVpt9o0Wao3yDJBxeJz5TE1aLi8H9f1hpYYGLXSWYaXnQ5a-YSPDheecpXnVRqMidGYOLi7GKlhgEB8DH4zDulnstlOgNKEAFDoIFiASJhPBoTwnCA8AnBIN4qHIaQAGYAHYkBGURxBAWgGCYWMwHkEA4yUdgIJgH8KnHRQ23wehiHsGEXSgQgaDgWwwBoJC2zABJCHwABuDQbyoPt40TTQfg0DRLEIXk4FCZVSDOQTIhk-AVLonQlSDVwNBcEIgTUqhRIAAVtEh7HwEIGH0CB7GtEhrg2DQ0EmYAy3UQJyRhAAmGdhNYEhCECDh-MCgzCEsRYIroYTNW4sB8F0OgYVgVsBGKNsABYAFZKUCUphNRGS8vc6i0ygHyqBhNAgpCsL2BhAA2SKXGi2KNDa+KAxCJCUqgNK9My-F8sK4qRPU0Y0AqzyqpquKGtC8KNAC3qOpi1glr6pLBuGjKW3xXKCpIIqSu2XYv39aSNGClbmo0HLAumzauue+Lps0qk6rcjQaBNGATJkhbfLWl7TKurcVggVgXJk7jCDTTFaq0RzSDW-QSBoPi23JNsYBNNz9CoVL2I0ckiCoQgBGBv0oEpKAYRGIFqTAeBoo9RS7RM0SUGbVsOzqAwLEsbANGYaG8lh6jILtYJCYpGEAGJ8Fmi6qH5lt207AxHGcFxxcl7cZc8uXbQVuJLBV-AIHqqbNYFnXhe8PwjalndZZoeXYCtlXZqEh2tcF3XglCd2Tbhs3vYt32lY0ZWAA5k5K2C+NIRDkJAPyRiQFCUNEXAQH5KhbWQyhcMkJg6Bp1hWO4EA1kQaQOHYIEwCQAB6Tu4iBC2+zoTua8WeuzL85g0GYHKh9r+v73JZg5Fg9h7CBKRwGgQggXIkRsBEIA). In that example, click to make a couple boxes, pick a box, and follow its size. We want the size and spin to be tied to the box (denoted by color) and not the position in the grid. You'll notice that instead, the size ends up jumping suddenly up, but it stays constant with location. This means we need to give them keys.

In this case, giving them unique keys is pretty easy: just create a counter that you increment each time you read it.

```diff
 var colors = ["red", "yellow", "blue", "gray"]
 var counter = 0

 function getColor() {
 	var color = colors[counter]
 	counter = (counter + 1) % colors.length
 	return color
 }

 function Boxes() {
 	var boxes = []
 	var nextKey = 0

 	function add() {
-		boxes.push({color: getColor()})
+		var key = nextKey
+		nextKey++
+		boxes.push({key: key, color: getColor()})
 	}

 	function remove(box) {
 		var index = boxes.indexOf(box)
 		boxes.splice(index, 1)
 	}

 	return {
 		view: function() {
 			return [
 				m("button", {onclick: add}, "Add box, click box to remove"),
 				m(".container", boxes.map(function(box, i) {
 					return m(".box",
 						{
+							key: box.key,
 							"data-color": box.color,
 							onclick: function() { remove(box) },
 						},
 						m(".stretch")
 					)
 				})),
 			]
 		},
 	}
 }
```

[Here's a fixed demo for you to play with, to see how it works differently.](https://flems.io/#0=N4IgzgxgTg9gNnEAuA2gBgDRoLoZAMwEs4BTMZFUAOwEMBbE5EAOgAsAXOxPCGK9kvyYgAvhmr1GSFgCtyPPgKHSAbjSgACXnBhQwGgLwaUAHRBQSAEzMYNZgJ4kEMAO427IAEZwAriXdmAOZQNPZm2CZUapq8PvwkmkZokZH4cRDshHwagSTsAMLwugAUAJQawCns0VpFibU6eiix8VARVCbsLQL1xd0JGgDUGgCM5QCkDbpgzKRUgeysVRbsPlBUU1CRIilUaVQZWRsAQjAAHmRlFVU1nudkhsbtnTVUJGfsANIk9o-JHR12PtDtkaJZLFdKoCXuoNABrH6PN4fb5haHsZFfH6DQZVTp3C4zAAOPjArGKwAR9iQ8J+tm0uhpuQKdTKIlKVR2AM6wMy2QsdBgKhIxQJ5ShnRhmkIVEs70eBLIzBlcrOAHl8KLzhz0YqZmAiXBCBARSr3rYxpzdp0VmsNhL2C9CCQXDTeUdIXjHexbetjF7JZximZPD52Ow+O5gHwIEaIHCaWDLGIPABBcEaAn0uNwzPnDQRjQCoX+EClDAB710YMsXj8GgyhLuPXMOg0InFd18LVnWyEcWVwO+jbVszMAk2QfezoOwNz71UmkE5hUivo+dzkCWGjsGgAWgZW2QebOzEPa430+9MZzbvSfKokKLJEFwp75TEU8Dn-XV86o5YMAfTyCAljLL92B1S92XLStnm9H9Oi5LlIjoVsYDidhiksGAIB8Bh+HHGBLHsWxTkJUoQAUOgiWIBImE8GhPCcKjwCcEgQSochpAAFhGJARlEcQQFoBgmDPMB5BAOslHYBjiN+YANHwRQ93wehiGpDRUygQgaDgWwwBoLi9zABJCHwABuDQUKoM9FAbN5NChDQNEsQgDTgUI3VIM5LMiVz8F8tSdFdItXA0FwQiJfyqFsgABKl8BCBh9AgexYxIa4Ng0NBJiUtsoECGUaQAJhfazWBIQhAg4MqKsiwhLEWeq6Gsn1jLAFSoDoGlYF3ARij3HiAFY5UCUprK5VyRryioNEK4qqBpNBKuq2r2BpAA2BqXCalqNB2tqCxCLjut68KBpFUbxsmmyAtGNA5oK9QltataarqjRyuOvbmtYd6Ts686+pgK6hpukgJqm7ZdiIs5stcqrPs2jQeIqh6-oO9G2oeoL3hW3KNBoMMYFi1zFpK76MbiuGgJWUDEeJqhCDbB8aXSzLvv0EgaDMvcZT3DD2Fy-QqF0Ns4A0GUiBZgRybzKA5SgGkRiJBGwHgJrMy8+NYtslBt13A86gMCxLGwDRmHpkDWHmxj42CDDZRpABifAnphqhDZ3fdDwMRxnBcS3reAro7aUh24SduJLDd-AIFW+7vaNv3Te8PwQ5t8P7ZoR3YFjt2nqs5OfeN-3glCLOw8ZyO8+jguXY0V2AA426m1izNITjuJAUqW6QHiW9EXAQCNKg4W4ygRMkJg6EIRZdO4EA1kQaQOHYIkwCQAB6He4iJaP7LoHf58X4h4tK5g0GYHjT4X1gl9bGVmDkVj2HsIkpHAaBCCJOSRDYBEEAA)

### Reinitializing views with single-child keyed fragments

When you're dealing with stateful entities in models and such, it's often useful to render model views with keys. Suppose you have this layout:

```javascript
function Layout() {
	// ...
}

function Person() {
	// ...
}

m.route(rootElem, "/", {
	"/": Home,
	"/person/:id": {
		render: function() {
			return m(Layout,
				m(Person, {id: m.route.param("id")})
			)
		}
	},
	// ...
})
```

Chances are, your `Person` component probably looks something like this:

```javascript
function Person(vnode) {
	var personId = vnode.attrs.id
	var state = "pending"
	var person, error

	m.request("/api/person/:id", {params: {id: personId}}).then(
		function(p) { person = p; state = "ready" },
		function(e) { error = e; state = "error" }
	)

	return {
		view: function() {
			if (state === "pending") return m(LoadingIcon)
			if (state === "error") {
				return error.code === 404
					? m(".person-missing", "Person not found.")
					: m(".person-error",
						"An error occurred. Please try again later"
					)
			}
			return m(".person",
				m(m.route.Link,
					{
						class: "person-edit",
						href: "/person/:id/edit",
						params: {id: personId},
					},
					"Edit"
				),
				m(".person-name", "Name: ", person.name),
				// ...
			)
		}
	}
}
```

Say, you added a way to link to other people from this component, like maybe adding a "manager" field.

```javascript
function Person(vnode) {
	// ...

	return {
		view: function() {
			// ...
			return m(".person",
				m(m.route.Link,
					{
						class: "person-edit",
						href: "/person/:id/edit",
						params: {id: personId},
					},
					"Edit"
				),
				m(".person-name", person.name),
				// ...
				m(".manager",
					"Manager: ",
					m(m.route.Link,
						{
							href: "/person/:id",
							params: {id: person.manager.id}
						},
						person.manager.name
					)
				),
				// ...
			)
		}
	}
}
```

Assuming the person's ID was `1` and the manager's ID was `2`, you'd switch from `/person/1` to `/person/2`, remaining on the same route. But since you used [the route resolver `render` method](route.md#routeresolverrender), the tree was retained and you just changed from `m(Layout, m(Person, {id: "1"}))` to `m(Layout, m(Person, {id: "2"}))`. In this, the `Person` didn't change, and so it doesn't reinitialize the component. But for our case, this is bad, because it means the new user isn't being fetched. This is where keys come in handy. We could change the route resolver to this to fix it:

```javascript
m.route(rootElem, "/", {
	"/": Home,
	"/person/:id": {
		render: function() {
			return m(Layout,
				// Wrap it in an array in case we add other elements later on.
				// Remember: fragments must contain either only keyed children
				// or no keyed children.
				[m(Person,
					{id: m.route.param("id"), key: m.route.param("id")}
				)]
			)
		}
	},
	// ...
})
```

### Common gotchas

There's several common gotchas that people run into with keys. Here's some of them, to help you understand why they don't work.

#### Wrapping keyed elements

These two snippets don't work the same way:

```javascript
users.map(function(user) {
	return m(".wrapper", [
		m(User, {user: user, key: user.id})
	])
})

users.map(function(user) {
	return m(".wrapper", {key: user.id}, [
		m(User, {user: user})
	])
})
```

The first binds the key to the `User` component, but the outer fragment created by `users.map(...)` is entirely unkeyed. Wrapping a keyed element this way doesn't work, and the result could be anything ranging from extra requests each time the list is changed to inner form inputs losing their state. The resulting behavior would similar to the [post list's broken example](#linking-model-data-to-views), but without the issue of state corruption.

The second binds it to the `.wrapper` element, ensuring the outer fragment *is* keyed. This does what you likely wanted to do all along, and removing a user won't pose any issues with the state of other user instances.

#### Putting keys inside the component

Suppose, in the [person example](#reinitializing-views-with-single-child-keyed-fragments), you did this instead:

```javascript
// AVOID
function Person(vnode) {
	var personId = vnode.attrs.id
	// ...

	return {
		view: function() {
			return m.fragment({key: personId},
				// what you previously had in the view
			)
		}
	}
}
```

This won't work, because the key doesn't apply to the component as a whole. It just applies to the view, and so you aren't re-fetching the data like you were hoping for.

Prefer the solution used there, putting the key in the vnode *using* the component rather than inside the component itself.

```javascript
// PREFER
return [m(Person,
	{id: m.route.param("id"), key: m.route.param("id")}
)]
```

#### Keying elements unnecessarily

It's a common misconception that keys are themselves identities. Mithril.js enforces for all fragments that their children must either all have keys or all lack keys, and will throw an error if you forget this. Suppose you have this layout:

```javascript
m(".page",
	m(".header", {key: "header"}),
	m(".body"),
	m(".footer"),
)
```

This obviously will throw, as `.header` has a key and `.body` and `.footer` both lack keys. But here's the thing: you don't need keys for this. If you find yourself using keys for things like this, the solution isn't to add keys, but to remove them. Only add them if you really, *really* need them. Yes, the underlying DOM nodes have identities, but Mithril.js doesn't need to track those identities to correctly patch them. It practically never does. Only with lists where each entry has some sort of associated state Mithril.js doesn't itself track, whether it be in a model, in a component, or in the DOM itself, do you need keys.

One last thing: avoid static keys. They're always unnecessary. If you're not computing your `key` attribute, you're probably doing something wrong.

Note that if you really need a single keyed element in isolation, [use a single-child keyed fragment](#reinitializing-views-with-single-child-keyed-fragments). It's just an array with a single child that's a keyed element, like `[m("div", {key: foo})]`.

#### Mixing key types

Keys are read as object property names. This means `1` and `"1"` are treated identically. If you want to keep your hair, don't mix key types if you can help it. If you do, you could wind up with duplicate keys and unexpected behavior.

```javascript
// AVOID
var things = [
	{id: "1", name: "Book"},
	{id: 1, name: "Cup"},
]
```

If you absolutely must and you have no control over this, use a prefix denoting its type so they remain distinct.

```javascript
things.map(function(thing) {
	return m(".thing",
		{key: (typeof thing.id) + ":" + thing.id},
		// ...
	)
})
```

##### Hiding keyed elements with holes

Holes like `null`, `undefined`, and booleans are considered unkeyed vnodes, so code like this won't work:

```javascript
// AVOID
things.map(function(thing) {
	return shouldShowThing(thing)
		? m(Thing, {key: thing.id, thing: thing})
		: null
})
```

Instead, filter the list before returning it, and Mithril.js will do the right thing. Most of the time, [`Array.prototype.filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) is precisely what you need and you should definitely try it out.

```javascript
// PREFER
things
	.filter(function(thing) { return shouldShowThing(thing) })
	.map(function(thing) {
		return m(Thing, {key: thing.id, thing: thing})
	})
```

#### Duplicate keys

Keys for fragment items *must* be unique, or otherwise, it's unclear and ambiguous what key is supposed to go where. You may also have issues with elements not moving around like they're supposed to.

```javascript
// AVOID
var things = [
	{id: "1", name: "Book"},
	{id: "1", name: "Cup"},
]
```

Mithril.js uses an empty object to map keys to indices to know how to properly patch keyed fragments. When you have a duplicate key, it's no longer clear where that element moved to, and so Mithril.js will break in that circumstance and do unexpected things on update, especially if the list changed. Distinct keys are required for Mithril.js to properly connect old to new nodes, so you must choose something locally unique to use as a key.
