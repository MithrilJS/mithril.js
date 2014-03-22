## Installation

Mithril is available from a variety of sources:

---

### Direct download

You can [download a zip of the latest version version here](http://lhorie.github.io/mithril/mithril.min.zip).

Links to older versions can be found in the [change log](change-log.html)

In order to use Mithril, extract it from the zip file and point a script tag to the `.js` file:

```markup
<script src="mithril.min.js"></script>
```

---

### CDNs (Content Delivery Networks)

You can also find Mithril in [cdnjs](http://cdnjs.com/libraries/mithril/) and [jsdelivr](http://www.jsdelivr.com/#!mithril)

Content delivery networks allow the library to be cached across different websites that use the same version of the framework, and help reduce latency by serving the files from a server that is physically near the user's location.

#### CdnJs

```markup
<script src="//cdnjs.cloudflare.com/ajax/libs/mithril/$version/mithril.min.js"></script>
```

#### JsDelivr

```markup
<script src="//cdn.jsdelivr.net/mithril/$version/mithril.min.js"></script>
```

---

### Bower

[Bower](http://http://bower.io) is a package manager for [NodeJS](http://nodejs.org/). If you're using NodeJS already or planning on using [Grunt](http://gruntjs.com/) to create a build system, you can use Bower to conveniently keep up-to-date with Mithril versions.

Assuming you have NodeJS installed, you can install Bower by typing this in the command line:

```
npm install -g bower
```

And you can download Mithril by typing this:

```
bower install mithril
```

Then, to use Mithril, point a script tag to the downloaded file:

```markup
<script src="/bower_components/mithril/mithril.min.js"></script>
```
