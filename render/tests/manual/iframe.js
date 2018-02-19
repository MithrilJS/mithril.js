var count = 0

var Button = {
    view: function() {
        return m(
            "button",
            {onclick: function() { count += 1 }},
            "Inside the iframe: " + count)
    }
}

m.mount(document.getElementById("root"), Button)
