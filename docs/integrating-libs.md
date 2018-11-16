# 3rd Party Integration

Integration with third party libraries or vanilla javascript code can be achieved via [lifecycle methods](lifecycle-methods.md).

## noUiSlider Example

```javascript
/** NoUiSlider wrapper component */
function Slider() {
	var slider

	return {
		oncreate: function(vnode) {
			slider = noUiSlider.create(vnode.dom, {
				start: 0,
				range: {min: 0, max: 100}
			})
			slider.on('update', function(values) {
				vnode.attrs.onChange(values[0])
				m.redraw()
			})
		},
		onremove: function() {
			slider.destroy()
		},
		view: function() {
			return m('div')
		}
	}
}

/** Demo app component */
function Demo() {
	var showSlider = false
	var value = 0

	return {
		view: function() {
			return m('.app',
				m('p',
					m('button',
						{
							type: 'button',
							onclick: function() {
								showSlider = !showSlider
							}
						},
						showSlider ? "Destroy Slider" : "Create Slider"
					)
				),
				showSlider && m(Slider, {
					onChange: function(v) {
						value = v
					}
				}),
				m('p', value)
			)
		}
	}
}

m.mount(document.body, Demo)
```

[flems demo](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvEAXwvW10QICsEqdBk2J4A9ACoJAAgBytAKoQAylAgATGACdpAdy0YADoe3S6WQ-RHSJYgDpowAVzTViEetNUbtACgCU0sAO0tIAbhg6cGqaWg4h0lowxE5aaEEJofTUSRiMiNLOru70vmFotJqBwemhddE+OgC80hVK3rH4OTB5MGUVmvjqtFgUGbV19cSRxAUADBSZk4kYaADmMAXAWBBo82NYGAAeBQCMc3OsS6Gs-tfSDZ2lAOROhuq9z2NFbh5oZRgoE54NV7qFypUYPg8sQtHB8PQAMKEVYbAFA+DIOYAXTuE2WWHwSXUBl0AXutyW7CW9CSWFoYU2hRcv1KoPxoUe2iG8FhtAAnuT8dT8WEIDBdAUfiV-uzlolkql0lhfM91BAws88ZMrrVdbqHJIZAARGD06RGQxmEaWNDWWwOaV-aSm+kBcahWDEB6EWi6DqmFpgQFwGAJL3hQHA6QtObxWpJFJpD11MUSqUsmXumryxNK6Qq57Q4xfMEF1WGUscgmqgBGTmIxHoVfl8pzrflxH5JgKz3rjebi2rHeyamoAGsM8U-tmyx24L7-TFA9IAIQLv0BuLD1u6js6of7+qLrfSAD80jsIFNcD5-K8y7iIGkBSviNyjAfjSvc+k2tb-iHq2G5Lo00gAGTgeWW5jO2I5oMiqJMk6pRhHKR6RhiMbhL+e67oBZaFpWYwRBi-6TOR0h4fq8aEvSLjEL4wzUE4OAMPgtaVPyYyurQeKUCAoawKyaAIDwADMACsiAAEwAJxsBwICYDgeBdHAAg0PQjDMDwbDYlQahoOOYmoMpXB4BUTgQFyWgCak5A8CQxCGHAiBiGILiGOOaxdCMYhWTZj4AAKnDJ+CnPgcxiOqt5aBA-YwAFtDWbZ+D8AJXYmHgcA5BAhiiOwnCqTwgVpdQGn2VojkgM5rnuZ5aDeb55jJalIVhRFUUxTZsIJQ2SVlY+6maVl3CCV2sCKcV407MQhDxeQVAOXgdVuR5Xk+X5WBiHNC3QKFXUAGy7RA82Lelo3duNuXxQV+msEAA)

## Bootstrap FullCalandar Example

```javascript
var FullCalendar = {

	oncreate: function (vnode) {
		console.log('FullCalendar::oncreate')
		$(vnode.dom).fullCalendar({
			// put your initial options and callbacks here
		})

		Object.assign(vnode.attrs.parentState, {fullCalendarEl: vnode.dom})
	},

	// Consider that the lib will modify this parent element in the DOM (e.g. add dependent class attribute and values).
	// As long as you return the same view results here, mithril will not
	// overwrite the actual DOM because it's always comparing old and new VDOM
	// before applying DOM updates.
	view: function (vnode) {
		return m('div')
	},

	onremove: function (vnode) {
		// Run any destroy / cleanup methods here.
		//E.g. $(vnode.dom).fullCalendar('destroy')
	}
}

m.mount(document.body, {
	view: function (vnode) {
		return [
			m('h1', 'Calendar'),
			m(FullCalendar, {parentState: vnode.state}),
			m('button', {onclick: prev}, 'Mithril Button -'),
			m('button', {onclick: next}, 'Mithril Button +')

		]

		function next() {
			$(vnode.state.fullCalendarEl).fullCalendar('next')
		}

		function prev() {
			$(vnode.state.fullCalendarEl).fullCalendar('prev')
		}

	}

})

```

Running example [flems: FullCalendar](https://flems.io/#0=N4IgZglgNgpgziAXAbVAOwIYFsZJAOgAsAXLKEAGhAGMB7NYmBvAHigjQGsACAJxigBeADog4xAJ6w4hGDGKjuhfmBEgSxAA5xEAel3UAJmgBWcfNSi0ArobBQM-C7Sy6MJjAA9d7AEZxdMGsoKGoMWDRDR10AZnwAdnwABkDg0PCmKN58LA4LODhRAD4QAF8KdGxcRAIzShp6RmYagDdHbgAxNIBhDMj2wW5gYTQR4WJ6an4MRkRuILRqYgh6bgAKFrRaQxgASiGxhWI6NDhaWHwrAHM1gHIukN6oft5EREnpxlvdw-GAEg2Wx2+EMLl2+CCjz6WTWw1GR3G+m4mmsxG4EhsvG4HAgy3C3FommW9Dg3AwkW4YRCvgw1E4pNk-F+xFKP1G8PGAHlfCYYEt8BgChArmhAdsYALiMReOZNI4mMQAMrEGYwChDSFQJ6ZRwAUSgc024pBLlZh3KY3hLQgMAA7nMFksVmh1kadvs4eNxvxiNZeC6sHdDBAWt9zRRLeN6L4YGBaPx+FhaC0YA7rItiS6xe6DhziEiAErpsloCTcHbiXi0Mu6SmwcnWTTcHDEQjbBkwJzM-QAt0S8SqiE9aF6qDgzXal5B+DS6th+GlEaL9lYHI2BhrUHUaw4Bj4XzbCTqz3Ea12tMZ52uoF7XNe6XyP0u5DM8aB26EACMt3Vt0nWW+CM8zfNYHi1EdeGPOV+AYZVVUNG98AHRhWSA+8QNuXxUQmNAfzvBEjkmdg6TmTR+BaV8WV-ABZXFlGgbgACFsNWABaQDKPfLCpXoPCT3QnDLAgEjuDQGBPAUYCqO4W5aNbXgGOYniXQAannZkAF1IyOR1M1E8TiDWD1KN7RDkIlCcIP1cdhwiGFbjEiT1KOZdmV0q8yJgFojPw+9TONcyhyhOzRxs4KdV4O5PNDNl71chdLVZMoKhATAcDwfIECoE4mmIPAyg0qh2C4BAUEqdKalyeToHqP1yBqDRtD0XR000TgrmcVwqvoqAAAFP3wAaAFZdG6hSoHwOoqEkTRqhAOpynKuak13PKqDqvBGp0fRWvazrRpcBVeoAJkGgBOfBjoO1bJqykAZrmhaUrSx6AEdrE7CRat4er1ClJqdrQNqOroVwTHez7eriU7P10YNxF0cGPt4CRbvqB68Cepa8E1KkIu+36tua3aQZcVIQjxl4oYSZI4YgBHcYgtHpokWbMYQUoNNKIA)
