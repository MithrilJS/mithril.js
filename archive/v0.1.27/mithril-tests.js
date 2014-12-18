var m = (function app(window, undefined) {
  var OBJECT = "[object Object]",
    ARRAY = "[object Array]",
    STRING = "[object String]",
    FUNCTION = "function";
  var type = {}.toString;
  var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g,
    attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
  var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;

  // caching commonly used variables
  var $document, $location, $requestAnimationFrame, $cancelAnimationFrame;

  // self invoking function needed because of the way mocks work
  function initialize(window) {
    $document = window.document;
    $location = window.location;
    $cancelAnimationFrame = window.cancelAnimationFrame || window.clearTimeout;
    $requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;
  }

  initialize(window);


  /*
   * @typedef {String} Tag
   * A string that looks like -> div.classname#id[param=one][param2=two]
   * Which describes a DOM node
   */

  /*
   *
   * @param {Tag} The DOM node tag
   * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
   * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array, or splat (optional)
   *
   */
  function m() {
    var args = [].slice.call(arguments);
    var hasAttrs = args[1] != null && type.call(args[1]) === OBJECT && !("tag" in args[1]) && !("subtree" in args[1]);
    var attrs = hasAttrs ? args[1] : {};
    var classAttrName = "class" in attrs ? "class" : "className";
    var cell = {
      tag: "div",
      attrs: {}
    };
    var match,
      classes = [];
    if (type.call(args[0]) != STRING)
      throw new Error("selector in m(selector, attrs, children) should be a string")
    while (match = parser.exec(args[0])) {
      if (match[1] === "" && match[2]) {
        cell.tag = match[2];
      } else if (match[1] === "#") {
        cell.attrs.id = match[2];
      } else if (match[1] === ".") {
        classes.push(match[2]);
      } else if (match[3][0] === "[") {
        var pair = attrParser.exec(match[3]);
        cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" : true)
      }
    }
    if (classes.length > 0) {
      cell.attrs[classAttrName] = classes.join(" ");
    }


    var children = hasAttrs ? args[2] : args[1];
    if (type.call(children) === ARRAY) {
      cell.children = children
    } else {
      cell.children = hasAttrs ? args.slice(2) : args.slice(1)
    }

    for (var attrName in attrs) {
      if (attrName === classAttrName) {
        cell.attrs[attrName] = (cell.attrs[attrName] || "") + " " + attrs[attrName];
      } else {
        cell.attrs[attrName] = attrs[attrName]
      }
    }
    return cell
  }
  function build(parentElement, parentTag, parentCache, parentIndex, data, cached, shouldReattach, index, editable, namespace, configs) {
    //`build` is a recursive function that manages creation/diffing/removal of DOM elements based on comparison between `data` and `cached`
    //the diff algorithm can be summarized as this:
    //1 - compare `data` and `cached`
    //2 - if they are different, copy `data` to `cached` and update the DOM based on what the difference is
    //3 - recursively apply this algorithm for every array and for the children of every virtual element

    //the `cached` data structure is essentially the same as the previous redraw's `data` data structure, with a few additions:
    //- `cached` always has a property called `nodes`, which is a list of DOM elements that correspond to the data represented by the respective virtual element
    //- in order to support attaching `nodes` as a property of `cached`, `cached` is *always* a non-primitive object, i.e. if the data was a string, then cached is a String instance. If data was `null` or `undefined`, cached is `new String("")`
    //- `cached also has a `configContext` property, which is the state storage object exposed by config(element, isInitialized, context)
    //- when `cached` is an Object, it represents a virtual element; when it's an Array, it represents a list of elements; when it's a String, Number or Boolean, it represents a text node

    //`parentElement` is a DOM element used for W3C DOM API calls
    //`parentTag` is only used for handling a corner case for textarea values
    //`parentCache` is used to remove nodes in some multi-node cases
    //`parentIndex` and `index` are used to figure out the offset of nodes. They're artifacts from before arrays started being flattened and are likely refactorable
    //`data` and `cached` are, respectively, the new and old nodes being diffed
    //`shouldReattach` is a flag indicating whether a parent node was recreated (if so, and if this node is reused, then this node must reattach itself to the new parent)
    //`editable` is a flag that indicates whether an ancestor is contenteditable
    //`namespace` indicates the closest HTML namespace as it cascades down from an ancestor
    //`configs` is a list of config functions to run after the topmost `build` call finishes running

    //there's logic that relies on the assumption that null and undefined data are equivalent to empty strings
    //- this prevents lifecycle surprises from procedural helpers that mix implicit and explicit return statements (e.g. function foo() {if (cond) return m("div")}
    //- it simplifies diffing code
    if (data == null || data.toString() == null) {
      data = "";
    }
    if (data.subtree === "retain") return cached;
    var cachedType = type.call(cached),
      dataType = type.call(data);
    if (cached == null || cachedType !== dataType) {
      if (cached != null) {
        if (parentCache && parentCache.nodes) {
          var offset = index - parentIndex;
          var end = offset + (dataType === ARRAY ? data : cached.nodes).length;
          clear(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end))
        } else if (cached.nodes) {
          clear(cached.nodes, cached)
        }
      }
      cached = new data.constructor;
      if (cached.tag) {
        cached = {};
      } //if constructor creates a virtual dom element, use a blank object as the base cached node instead of copying the virtual el (#277)
      cached.nodes = []
    }

    if (dataType === ARRAY) {
      //recursively flatten array
      for (var i = 0, len = data.length; i < len; i++) {
        if (type.call(data[i]) === ARRAY) {
          data = data.concat.apply([], data);
          i-- //check current index again and flatten until there are no more nested arrays at that index
        }
      }

      var nodes = [],
        intact = cached.length === data.length,
        subArrayCount = 0;

      //keys algorithm: sort elements without recreating them if keys are present
      //1) create a map of all existing keys, and mark all for deletion
      //2) add new keys to map and mark them for addition
      //3) if key exists in new list, change action from deletion to a move
      //4) for each key, handle its corresponding action as marked in previous steps
      //5) copy unkeyed items into their respective gaps
      var DELETION = 1,
        INSERTION = 2 ,
        MOVE = 3;
      var existing = {},
        unkeyed = [],
        shouldMaintainIdentities = false;
      for (var i = 0, len = cached.length; i < len; i++) {
        if (cached[i] && cached[i].attrs && cached[i].attrs.key != null) {
          shouldMaintainIdentities = true;
          existing[cached[i].attrs.key] = {
            action: DELETION,
            index: i
          }
        }
      }
      if (shouldMaintainIdentities) {
        if (data.indexOf(null) > -1) {
          data = data.filter(function(x) {
            return x != null
          })
        }
        for (var i = 0, len = data.length; i < len; i++) {
          if (data[i] && data[i].attrs) {
            if (data[i].attrs.key != null) {
              var key = data[i].attrs.key;
              if (!existing[key]) {
                existing[key] = {
                  action: INSERTION,
                  index: i
                };
              } else {
                existing[key] = {
                  action: MOVE,
                  index: i,
                  from: existing[key].index,
                  element: parentElement.childNodes[existing[key].index] || $document.createElement("div")
                }
              }
            } else {
              unkeyed.push({
                index: i,
                element: parentElement.childNodes[i] || $document.createElement("div")
              })
            }
          }
        }
        var actions = Object.keys(existing).map(function(key) {
          return existing[key]
        });
        var changes = actions.sort(function(a, b) {
          return a.action - b.action || a.index - b.index
        });
        var newCached = cached.slice();

        for (var i = 0, change; change = changes[i]; i++) {
          if (change.action === DELETION) {
            clear(cached[change.index].nodes, cached[change.index]);
            newCached.splice(change.index, 1)
          }
          if (change.action === INSERTION) {
            var dummy = $document.createElement("div");
            dummy.key = data[change.index].attrs.key;
            parentElement.insertBefore(dummy, parentElement.childNodes[change.index] || null);
            newCached.splice(change.index, 0, {
              attrs: {
                key: data[change.index].attrs.key
              },
              nodes: [dummy]
            })
          }

          if (change.action === MOVE) {
            if (parentElement.childNodes[change.index] !== change.element && change.element !== null) {
              parentElement.insertBefore(change.element, parentElement.childNodes[change.index] || null)
            }
            newCached[change.index] = cached[change.from]
          }
        }
        for (var i = 0, len = unkeyed.length; i < len; i++) {
          var change = unkeyed[i];
          parentElement.insertBefore(change.element, parentElement.childNodes[change.index] || null);
          newCached[change.index] = cached[change.index]
        }
        cached = newCached;
        cached.nodes = [];
        for (var i = 0, child; child = parentElement.childNodes[i]; i++) {
          cached.nodes.push(child)
        }
      }
      //end key algorithm

      for (var i = 0, cacheCount = 0, len = data.length; i < len; i++) {
        //diff each item in the array
        var item = build(parentElement, parentTag, cached, index, data[i], cached[cacheCount], shouldReattach, index + subArrayCount || subArrayCount, editable, namespace, configs);
        if (item === undefined) continue;
        if (!item.nodes.intact) {
          intact = false;
        }
        if (item.$trusted) {
          //fix offset of next element if item was a trusted string w/ more than one html element
          //the first clause in the regexp matches elements
          //the second clause (after the pipe) matches text nodes
          subArrayCount += (item.match(/<[^\/]|\>\s*[^<]/g) || []).length
        } else {
          subArrayCount += type.call(item) === ARRAY ? item.length : 1;
        }
        cached[cacheCount++] = item
      }
      if (!intact) {
        //diff the array itself

        //update the list of DOM nodes by collecting the nodes from each item
        for (var i = 0, len = data.length; i < len; i++) {
          if (cached[i] != null) {
            nodes.push.apply(nodes, cached[i].nodes)
          }
        }
        //remove items from the end of the array if the new array is shorter than the old one
        //if errors ever happen here, the issue is most likely a bug in the construction of the `cached` data structure somewhere earlier in the program
        for (var i = 0, node; node = cached.nodes[i]; i++) {
          if (node.parentNode != null && nodes.indexOf(node) < 0) {
            clear([node], [cached[i]])
          }
        }
        if (data.length < cached.length) {
          cached.length = data.length;
        }
        cached.nodes = nodes
      }
    } else if (data != null && dataType === OBJECT) {
      if (!data.attrs) {
        data.attrs = {};
      }
      if (!cached.attrs) {
        cached.attrs = {};
      }

      var dataAttrKeys = Object.keys(data.attrs);
      var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)
      //if an element is different enough from the one in cache, recreate it
      if (data.tag != cached.tag || dataAttrKeys.join() != Object.keys(cached.attrs).join() || data.attrs.id != cached.attrs.id) {
        if (cached.nodes.length) {
          clear(cached.nodes);
        }
        if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) {
          cached.configContext.onunload()
        }
      }
      if (type.call(data.tag) != STRING) return;

      var node,
        isNew = cached.nodes.length === 0;
      if (data.attrs.xmlns) {
        namespace = data.attrs.xmlns;
      } else if (data.tag === "svg") {
        namespace = "http://www.w3.org/2000/svg";
      } else if (data.tag === "math") {
        namespace = "http://www.w3.org/1998/Math/MathML";
      }
      if (isNew) {
        if (data.attrs.is) {
          node = namespace === undefined ? $document.createElement(data.tag, data.attrs.is) : $document.createElementNS(namespace, data.tag, data.attrs.is);
        } else {
          node = namespace === undefined ? $document.createElement(data.tag) : $document.createElementNS(namespace, data.tag);
        }
        cached = {
          tag: data.tag,
          //set attributes first, then create children
          attrs: dataAttrKeys.length ? setAttributes(node, data.tag, data.attrs, {}, namespace) : {},
          children: data.children != null && data.children.length > 0 ?
            build(node, data.tag, undefined, undefined, data.children, cached.children, true, 0, data.attrs.contenteditable ? node : editable, namespace, configs) :
            data.children,
          nodes: [node]
        };
        if (cached.children && !cached.children.nodes) {
          cached.children.nodes = [];
        }
        //edge case: setting value on <select> doesn't work before children exist, so set it again after children have been created
        if (data.tag === "select" && data.attrs.value) {
          setAttributes(node, data.tag, {
            value: data.attrs.value
          }, {}, namespace);
        }
        parentElement.insertBefore(node, parentElement.childNodes[index] || null)
      } else {
        node = cached.nodes[0];
        if (dataAttrKeys.length) {
          setAttributes(node, data.tag, data.attrs, cached.attrs, namespace);
        }
        cached.children = build(node, data.tag, undefined, undefined, data.children, cached.children, false, 0, data.attrs.contenteditable ? node : editable, namespace, configs);
        cached.nodes.intact = true;
        if (shouldReattach === true && node != null) {
          parentElement.insertBefore(node, parentElement.childNodes[index] || null)
        }
      }
      //schedule configs to be called. They are called after `build` finishes running
      if (typeof data.attrs["config"] === FUNCTION) {
        var context = cached.configContext = cached.configContext || {};

        // bind
        var callback = function(data, args) {
          return function() {
            return data.attrs["config"].apply(data, args)
          }
        };
        configs.push(callback(data, [node, !isNew, context, cached]))
      }
    } else if (typeof dataType != FUNCTION) {
      //handle text nodes
      var nodes;
      if (cached.nodes.length === 0) {
        if (data.$trusted) {
          nodes = injectHTML(parentElement, index, data)
        } else {
          nodes = [$document.createTextNode(data)];
          if (!parentElement.nodeName.match(voidElements)) {
            parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null)
          }
        }
        cached = "string number boolean".indexOf(typeof data) > -1 ? new data.constructor(data) : data;
        cached.nodes = nodes
      } else if (cached.valueOf() !== data.valueOf() || shouldReattach === true) {
        nodes = cached.nodes;
        if (!editable || editable !== $document.activeElement) {
          if (data.$trusted) {
            clear(nodes, cached);
            nodes = injectHTML(parentElement, index, data)
          } else {
            //corner case: replacing the nodeValue of a text node that is a child of a textarea/contenteditable doesn't work
            //we need to update the value property of the parent textarea or the innerHTML of the contenteditable element instead
            if (parentTag === "textarea") {
              parentElement.value = data;
            } else if (editable) {
              editable.innerHTML = data;
            } else {
              if (nodes[0].nodeType === 1 || nodes.length > 1) { //was a trusted string
                clear(cached.nodes, cached);
                nodes = [$document.createTextNode(data)]
              }
              parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null);
              nodes[0].nodeValue = data
            }
          }
        }
        cached = new data.constructor(data);
        cached.nodes = nodes
      } else {
        cached.nodes.intact = true
      }
    }

    return cached
  }
  function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
    for (var attrName in dataAttrs) {
      var dataAttr = dataAttrs[attrName];
      var cachedAttr = cachedAttrs[attrName];
      if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
        cachedAttrs[attrName] = dataAttr;
        try {
          //`config` isn't a real attributes, so ignore it
          //we don't ignore `key` because it must be unique and having it on the DOM helps debugging
          if (attrName === "config") continue;
          //hook event handlers to the auto-redrawing system
          else if (typeof dataAttr === FUNCTION && attrName.indexOf("on") === 0) {
            node[attrName] = autoredraw(dataAttr, node)
          }
          //handle `style: {...}`
          else if (attrName === "style" && dataAttr != null && type.call(dataAttr) === OBJECT) {
            for (var rule in dataAttr) {
              if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) {
                node.style[rule] = dataAttr[rule]
              }
            }
            for (var rule in cachedAttr) {
              if (!(rule in dataAttr)) {
                node.style[rule] = ""
              }
            }
          }
          //handle SVG
          else if (namespace != null) {
            if (attrName === "href") {
              node.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataAttr);
            } else if (attrName === "className") {
              node.setAttribute("class", dataAttr);
            } else {
              node.setAttribute(attrName, dataAttr)
            }
          }
          //handle cases that are properties (but ignore cases where we should use setAttribute instead)
          //- list and form are typically used as strings, but are DOM element references in js
          //- when using CSS selectors (e.g. `m("[style='']")`), style is used as a string, but it's an object in js
          else if (attrName in node && !(attrName === "list" || attrName === "style" || attrName === "form" || attrName === "type")) {
            //#348 don't set the value if not needed otherwise cursor placement breaks in Chrome
            if (attrName != "input" || node[attrName] !== dataAttr) {
              node[attrName] = dataAttr
            }
          } else {
            node.setAttribute(attrName, dataAttr)
          }
        } catch ( e ) {
          //swallow IE's invalid argument errors to mimic HTML's fallback-to-doing-nothing-on-invalid-attributes behavior
          if (e.message.indexOf("Invalid argument") < 0)
            throw e
        }
      }
      //#348 dataAttr may not be a string, so use loose comparison (double equal) instead of strict (triple equal)
      else if (attrName === "value" && tag === "input" && node.value != dataAttr) {
        node.value = dataAttr
      }
    }
    return cachedAttrs
  }
  function clear(nodes, cached) {
    for (var i = nodes.length - 1; i > -1; i--) {
      if (nodes[i] && nodes[i].parentNode) {
        try {
          nodes[i].parentNode.removeChild(nodes[i])
        } catch ( e ) {} //ignore if this fails due to order of events (see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
        cached = [].concat(cached);
        if (cached[i]) {
          unload(cached[i])
        }
      }
    }
    if (nodes.length != 0) {
      nodes.length = 0
    }
  }
  function unload(cached) {
    if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) {
      cached.configContext.onunload();
    }
    if (cached.children) {
      if (type.call(cached.children) === ARRAY) {
        for (var i = 0, child; child = cached.children[i]; i++) {
          unload(child)
        }
      } else if (cached.children.tag) {
        unload(cached.children)
      }
    }
  }
  function injectHTML(parentElement, index, data) {
    var nextSibling = parentElement.childNodes[index];
    if (nextSibling) {
      var isElement = nextSibling.nodeType != 1;
      var placeholder = $document.createElement("span");
      if (isElement) {
        parentElement.insertBefore(placeholder, nextSibling || null);
        placeholder.insertAdjacentHTML("beforebegin", data);
        parentElement.removeChild(placeholder)
      } else {
        nextSibling.insertAdjacentHTML("beforebegin", data)
      }
    } else {
      parentElement.insertAdjacentHTML("beforeend", data);
    }
    var nodes = [];
    while (parentElement.childNodes[index] !== nextSibling) {
      nodes.push(parentElement.childNodes[index]);
      index++
    }
    return nodes
  }
  function autoredraw(callback, object) {
    return function(e) {
      e = e || event;
      m.redraw.strategy("diff");
      m.startComputation();
      try {
        return callback.call(object, e)
      } finally {
        endFirstComputation()
      }
    }
  }

  var html;
  var documentNode = {
    appendChild: function(node) {
      if (html === undefined) {
        html = $document.createElement("html");
      }
      if ($document.documentElement && $document.documentElement !== node) {
        $document.replaceChild(node, $document.documentElement)
      } else {
        $document.appendChild(node);
      }
      this.childNodes = $document.childNodes
    },
    insertBefore: function(node) {
      this.appendChild(node)
    },
    childNodes: []
  };
  var nodeCache = [],
    cellCache = {};
  m.render = function(root, cell, forceRecreation) {
    var configs = [];
    if (!root)
      throw new Error("Please ensure the DOM element exists before rendering a template into it.");
    var id = getCellCacheKey(root);
    var isDocumentRoot = root === $document;
    var node = isDocumentRoot || root === $document.documentElement ? documentNode : root;
    if (isDocumentRoot && cell.tag != "html") {
      cell = {
        tag: "html",
        attrs: {},
        children: cell
      };
    }
    if (cellCache[id] === undefined) {
      clear(node.childNodes);
    }
    if (forceRecreation === true) {
      reset(root);
    }
    cellCache[id] = build(node, null, undefined, undefined, cell, cellCache[id], false, 0, null, undefined, configs);
    for (var i = 0, len = configs.length; i < len; i++) {
      configs[i]()
    }
  };
  function getCellCacheKey(element) {
    var index = nodeCache.indexOf(element);
    return index < 0 ? nodeCache.push(element) - 1 : index
  }

  m.trust = function(value) {
    value = new String(value);
    value.$trusted = true;
    return value
  };

  function gettersetter(store) {
    var prop = function() {
      if (arguments.length) {
        store = arguments[0];
      }
      return store
    };

    prop.toJSON = function() {
      return store
    };

    return prop
  }

  m.prop = function(store) {
    //note: using non-strict equality check here because we're checking if store is null OR undefined
    if (((store != null && type.call(store) === OBJECT) || typeof store === FUNCTION) && typeof store.then === FUNCTION) {
      return propify(store)
    }

    return gettersetter(store)
  };

  var roots = [],
    modules = [],
    controllers = [],
    lastRedrawId = null,
    lastRedrawCallTime = 0,
    computePostRedrawHook = null,
    prevented = false, topModule;
  var FRAME_BUDGET = 16; //60 frames per second = 1 call per 16 ms
  m.module = function(root, module) {
    var index = roots.indexOf(root);
    if (index < 0) {
      index = roots.length;
    }
    var isPrevented = false;
    if (controllers[index] && typeof controllers[index].onunload === FUNCTION) {
      var event = {
        preventDefault: function() {
          isPrevented = true
        }
      };
      controllers[index].onunload(event)
    }
    if (!isPrevented) {
      m.redraw.strategy("all");
      m.startComputation();
      roots[index] = root;
      var currentModule = topModule = module;
      var controller = new module.controller;
      //controllers may call m.module recursively (via m.route redirects, for example)
      //this conditional ensures only the last recursive m.module call is applied
      if (currentModule === topModule) {
        controllers[index] = controller;
        modules[index] = module
      }
      endFirstComputation();
      return controllers[index]
    }
  };
  m.redraw = function(force) {
    //lastRedrawId is a positive number if a second redraw is requested before the next animation frame
    //lastRedrawID is null if it's the first redraw and not an event handler
    if (lastRedrawId && force !== true) {
      //when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame, otherwise keep currently scheduled timeout
      //when rAF: always reschedule redraw
      if (new Date - lastRedrawCallTime > FRAME_BUDGET || $requestAnimationFrame === window.requestAnimationFrame) {
        if (lastRedrawId > 0) {
          $cancelAnimationFrame(lastRedrawId);
        }
        lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
      }
    } else {
      redraw();
      lastRedrawId = $requestAnimationFrame(function() {
        lastRedrawId = null
      }, FRAME_BUDGET)
    }
  };
  m.redraw.strategy = m.prop();
  function redraw() {
    var forceRedraw = m.redraw.strategy() === "all";
    for (var i = 0, root; root = roots[i]; i++) {
      if (controllers[i]) {
        m.render(root, modules[i].view(controllers[i]), forceRedraw)
      }
    }
    //after rendering within a routed context, we need to scroll back to the top, and fetch the document title for history.pushState
    if (computePostRedrawHook) {
      computePostRedrawHook();
      computePostRedrawHook = null
    }
    lastRedrawId = null;
    lastRedrawCallTime = new Date;
    m.redraw.strategy("diff")
  }

  var pendingRequests = 0;
  m.startComputation = function() {
    pendingRequests++
  };
  m.endComputation = function() {
    pendingRequests = Math.max(pendingRequests - 1, 0);
    if (pendingRequests === 0) {
      m.redraw()
    }
  };
  var endFirstComputation = function() {
    if (m.redraw.strategy() == "none") {
      pendingRequests--
      m.redraw.strategy("diff")
    } else {
      m.endComputation();
    }
  }

  m.withAttr = function(prop, withAttrCallback) {
    return function(e) {
      e = e || event;
      var currentTarget = e.currentTarget || this;
      withAttrCallback(prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop))
    }
  };

  //routing
  var modes = {
    pathname: "",
    hash: "#",
    search: "?"
  };
  var redirect = function() {}, routeParams, currentRoute;
  m.route = function() {
    //m.route()
    if (arguments.length === 0) return currentRoute;
    //m.route(el, defaultRoute, routes)
    else if (arguments.length === 3 && type.call(arguments[1]) === STRING) {
      var root = arguments[0],
        defaultRoute = arguments[1],
        router = arguments[2];
      redirect = function(source) {
        var path = currentRoute = normalizeRoute(source);
        if (!routeByValue(root, router, path)) {
          m.route(defaultRoute, true)
        }
      };
      var listener = m.route.mode === "hash" ? "onhashchange" : "onpopstate";
      window[listener] = function() {
        if (currentRoute != normalizeRoute($location[m.route.mode])) {
          redirect($location[m.route.mode])
        }
      };
      computePostRedrawHook = setScroll;
      window[listener]()
    }
    //config: m.route
    else if (arguments[0].addEventListener) {
      var element = arguments[0];
      var isInitialized = arguments[1];
      var context = arguments[2];
      element.href = (m.route.mode !== 'pathname' ? $location.pathname : '') + modes[m.route.mode] + this.attrs.href;
      element.removeEventListener("click", routeUnobtrusive);
      element.addEventListener("click", routeUnobtrusive)
    }
    //m.route(route, params)
    else if (type.call(arguments[0]) === STRING) {
      currentRoute = arguments[0];
      var args = arguments[1] || {}
      var queryIndex = currentRoute.indexOf("?")
      var params = queryIndex > -1 ? parseQueryString(currentRoute.slice(queryIndex + 1)) : {}
      for (var i in args) params[i] = args[i]
      var querystring = buildQueryString(params)
      var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute
      if (querystring) {
        currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;
      }

      var shouldReplaceHistoryEntry = (arguments.length === 3 ? arguments[2] : arguments[1]) === true;

      if (window.history.pushState) {
        computePostRedrawHook = function() {
          window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, $document.title, modes[m.route.mode] + currentRoute);
          setScroll()
        };
        redirect(modes[m.route.mode] + currentRoute)
      } else {
        $location[m.route.mode] = currentRoute
      }
    }
  };
  m.route.param = function(key) {
    if (!routeParams)
      throw new Error("You must call m.route(element, defaultRoute, routes) before calling m.route.param()")
    return routeParams[key]
  };
  m.route.mode = "search";
  function normalizeRoute(route) {
    return route.slice(modes[m.route.mode].length)
  }
  function routeByValue(root, router, path) {
    routeParams = {};

    var queryStart = path.indexOf("?");
    if (queryStart !== -1) {
      routeParams = parseQueryString(path.substr(queryStart + 1, path.length));
      path = path.substr(0, queryStart)
    }

    for (var route in router) {
      if (route === path) {
        m.module(root, router[route]);
        return true
      }

      var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");

      if (matcher.test(path)) {
        path.replace(matcher, function() {
          var keys = route.match(/:[^\/]+/g) || [];
          var values = [].slice.call(arguments, 1, -2);
          for (var i = 0, len = keys.length; i < len; i++) {
            routeParams[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
          }
          m.module(root, router[route])
        });
        return true
      }
    }
  }
  function routeUnobtrusive(e) {
    e = e || event;
    if (e.ctrlKey || e.metaKey || e.which === 2) return;
    if (e.preventDefault) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }
    var currentTarget = e.currentTarget || this;
    var args = m.route.mode === "pathname" && currentTarget.search ? parseQueryString(currentTarget.search.slice(1)) : {};
    m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length), args)
  }
  function setScroll() {
    if (m.route.mode != "hash" && $location.hash) {
      $location.hash = $location.hash;
    } else {
      window.scrollTo(0, 0)
    }
  }
  function buildQueryString(object, prefix) {
    var str = [];
    for (var prop in object) {
      var key = prefix ? prefix + "[" + prop + "]" : prop,
        value = object[prop];
      str.push(value != null && type.call(value) === OBJECT ? buildQueryString(value, key) : encodeURIComponent(key) + "=" + encodeURIComponent(value))
    }
    return str.join("&")
  }
  function parseQueryString(str) {
    var pairs = str.split("&"),
      params = {};
    for (var i = 0, len = pairs.length; i < len; i++) {
      var pair = pairs[i].split("=");
      params[decodeSpace(pair[0])] = pair[1] ? decodeSpace(pair[1]) : ""
    }
    return params
  }
  function decodeSpace(string) {
    return decodeURIComponent(string.replace(/\+/g, " "))
  }
  function reset(root) {
    var cacheKey = getCellCacheKey(root);
    clear(root.childNodes, cellCache[cacheKey]);
    cellCache[cacheKey] = undefined
  }

  m.deferred = function() {
    var deferred = new Deferred();
    deferred.promise = propify(deferred.promise);
    return deferred
  };
  function propify(promise) {
    var prop = m.prop();
    promise.then(prop);
    prop.then = function(resolve, reject) {
      return propify(promise.then(resolve, reject))
    };
    return prop
  }
  //Promiz.mithril.js | Zolmeister | MIT
  //a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
  //1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
  //2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
  function Deferred(successCallback, failureCallback) {
    var RESOLVING = 1,
      REJECTING = 2,
      RESOLVED = 3,
      REJECTED = 4;
    var self = this,
      state = 0,
      promiseValue = 0,
      next = [];

    self["promise"] = {};

    self["resolve"] = function(value) {
      if (!state) {
        promiseValue = value;
        state = RESOLVING;

        fire()
      }
      return this
    };

    self["reject"] = function(value) {
      if (!state) {
        promiseValue = value;
        state = REJECTING;

        fire()
      }
      return this
    };

    self.promise["then"] = function(successCallback, failureCallback) {
      var deferred = new Deferred(successCallback, failureCallback);
      if (state === RESOLVED) {
        deferred.resolve(promiseValue)
      } else if (state === REJECTED) {
        deferred.reject(promiseValue)
      } else {
        next.push(deferred)
      }
      return deferred.promise
    };

    function finish(type) {
      state = type || REJECTED;
      next.map(function(deferred) {
        state === RESOLVED && deferred.resolve(promiseValue) || deferred.reject(promiseValue)
      })
    }

    function thennable(then, successCallback, failureCallback, notThennableCallback) {
      if (((promiseValue != null && type.call(promiseValue) === OBJECT) || typeof promiseValue === FUNCTION) && typeof then === FUNCTION) {
        try {
          // count protects against abuse calls from spec checker
          var count = 0;
          then.call(promiseValue, function(value) {
            if (count++) return;
            promiseValue = value;
            successCallback()
          }, function(value) {
              if (count++) return;
              promiseValue = value;
              failureCallback()
            })
        } catch ( e ) {
          m.deferred.onerror(e);
          promiseValue = e;
          failureCallback()
        }
      } else {
        notThennableCallback()
      }
    }

    function fire() {
      // check if it's a thenable
      var then;
      try {
        then = promiseValue && promiseValue.then
      } catch ( e ) {
        m.deferred.onerror(e);
        promiseValue = e;
        state = REJECTING;
        return fire()
      }
      thennable(then, function() {
        state = RESOLVING;
        fire()
      }, function() {
          state = REJECTING;
          fire()
        }, function() {
          try {
            if (state === RESOLVING && typeof successCallback === FUNCTION) {
              promiseValue = successCallback(promiseValue)
            } else if (state === REJECTING && typeof failureCallback === "function") {
              promiseValue = failureCallback(promiseValue);
              state = RESOLVING
            }
          } catch ( e ) {
            m.deferred.onerror(e);
            promiseValue = e;
            return finish()
          }

          if (promiseValue === self) {
            promiseValue = TypeError();
            finish()
          } else {
            thennable(then, function() {
              finish(RESOLVED)
            }, finish, function() {
                finish(state === RESOLVING && RESOLVED)
              })
          }
        })
    }
  }
  m.deferred.onerror = function(e) {
    if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/))
      throw e
  };

  m.sync = function(args) {
    var method = "resolve";
    function synchronizer(pos, resolved) {
      return function(value) {
        results[pos] = value;
        if (!resolved) {
          method = "reject";
        }
        if (--outstanding === 0) {
          deferred.promise(results);
          deferred[method](results)
        }
        return value
      }
    }

    var deferred = m.deferred();
    var outstanding = args.length;
    var results = new Array(outstanding);
    if (args.length > 0) {
      for (var i = 0; i < args.length; i++) {
        args[i].then(synchronizer(i, true), synchronizer(i, false))
      }
    } else {
      deferred.resolve([]);
    }

    return deferred.promise
  };
  function identity(value) {
    return value
  }

  function ajax(options) {
    if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
      var callbackKey = "mithril_callback_" + new Date().getTime() + "_" + (Math.round(Math.random() * 1e16)).toString(36);
      var script = $document.createElement("script");

      window[callbackKey] = function(resp) {
        $document.body.removeChild(script);
        options.onload({
          type: "load",
          target: {
            responseText: resp
          }
        });
        window[callbackKey] = undefined
      };

      script.onerror = function(e) {
        $document.body.removeChild(script);

        options.onerror({
          type: "error",
          target: {
            status: 500,
            responseText: JSON.stringify({
              error: "Error making jsonp request"
            })
          }
        });
        window[callbackKey] = undefined;

        return false
      };

      script.onload = function(e) {
        return false
      };

      script.src = options.url
      + (options.url.indexOf("?") > 0 ? "&" : "?")
      + (options.callbackKey ? options.callbackKey : "callback")
      + "=" + callbackKey
      + "&" + buildQueryString(options.data || {});
      $document.body.appendChild(script)
    } else {
      var xhr = new window.XMLHttpRequest;
      xhr.open(options.method, options.url, true, options.user, options.password);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            options.onload({
              type: "load",
              target: xhr
            });
          } else {
            options.onerror({
              type: "error",
              target: xhr
            })
          }
        }
      };
      if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
      }
      if (options.deserialize === JSON.parse) {
        xhr.setRequestHeader("Accept", "application/json, text/*");
      }
      if (typeof options.config === FUNCTION) {
        var maybeXhr = options.config(xhr, options);
        if (maybeXhr != null) {
          xhr = maybeXhr
        }
      }

      var data = options.method === "GET" || !options.data ? "" : options.data
      if (data && (type.call(data) != STRING && data.constructor != window.FormData)) {
        throw "Request data should be either be a string or FormData. Check the `serialize` option in `m.request`";
      }
      xhr.send(data);
      return xhr
    }
  }
  function bindData(xhrOptions, data, serialize) {
    if (xhrOptions.method === "GET" && xhrOptions.dataType != "jsonp") {
      var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
      var querystring = buildQueryString(data);
      xhrOptions.url = xhrOptions.url + (querystring ? prefix + querystring : "")
    } else {
      xhrOptions.data = serialize(data);
    }
    return xhrOptions
  }
  function parameterizeUrl(url, data) {
    var tokens = url.match(/:[a-z]\w+/gi);
    if (tokens && data) {
      for (var i = 0; i < tokens.length; i++) {
        var key = tokens[i].slice(1);
        url = url.replace(tokens[i], data[key]);
        delete data[key]
      }
    }
    return url
  }

  m.request = function(xhrOptions) {
    if (xhrOptions.background !== true) {
      m.startComputation();
    }
    var deferred = m.deferred();
    var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp";
    var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
    var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
    var extract = xhrOptions.extract || function(xhr) {
        return xhr.responseText.length === 0 && deserialize === JSON.parse ? null : xhr.responseText
      };
    xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
    xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
    xhrOptions.onload = xhrOptions.onerror = function(e) {
      try {
        e = e || event;
        var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
        var response = unwrap(deserialize(extract(e.target, xhrOptions)));
        if (e.type === "load") {
          if (type.call(response) === ARRAY && xhrOptions.type) {
            for (var i = 0; i < response.length; i++) {
              response[i] = new xhrOptions.type(response[i])
            }
          } else if (xhrOptions.type) {
            response = new xhrOptions.type(response)
          }
        }
        deferred[e.type === "load" ? "resolve" : "reject"](response)
      } catch ( e ) {
        m.deferred.onerror(e);
        deferred.reject(e)
      }
      if (xhrOptions.background !== true) {
        m.endComputation()
      }
    };
    ajax(xhrOptions);
    deferred.promise(xhrOptions.initialValue);
    return deferred.promise
  };

  //testing API
  m.deps = function(mock) {
    initialize(window = mock || window);
    return window;
  };
  //for internal testing only, do not use `m.deps.factory`
  m.deps.factory = app;

  return m
})(typeof window != "undefined" ? window : {});

if (typeof module != "undefined" && module !== null && module.exports) {
  module.exports = m;
} else if (typeof define === "function" && define.amd) {
  define(function() {
    return m
  });
}



//make "use strict" and nodejs happy
var window = this

//test reporting for saucelabs
if (typeof window != "undefined") {
	window.global_test_results = {
		tests: [],
		duration: 0,
		passed: 0,
		failed: 0
	};
}

if (!this.console) {
	var log = function(value) {document.write("<pre>" + value + "</pre>")}
	this.console = {log: log, error: log}
}

function test(condition) {
	var duration = 0
	var start = 0
	var result = true
	test.total++

	if (typeof performance != "undefined" && performance.now) {
		start = performance.now()
	}
	try {
		if (!condition()) throw new Error("failed")
	}
	catch (e) {
		result = false
		console.error(e)
		test.failures.push(condition)
	}
	if (typeof performance != "undefined" && performance.now) {
		duration = performance.now() - start
	}

	window.test_obj = {
		name: "" + test.total,
		result: result,
		duration: duration
	}

	if (typeof window != "undefined") {
		if (!result) {
			window.global_test_results.tests.push(window.test_obj)
		}

		window.global_test_results.duration += duration
		if (result) {
			window.global_test_results.passed++
		} else {
			window.global_test_results.failed++
		}
	}
}
test.total = 0
test.failures = []
test.print = function(print) {
	for (var i = 0; i < test.failures.length; i++) {
		print(test.failures[i].toString())
	}
	print("tests: " + test.total + "\nfailures: " + test.failures.length)

	if (test.failures.length > 0) {
		throw new Error(test.failures.length + " tests did not pass")
	}
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(item) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] === item) return i
		}
		return -1
	}
}
if (!Array.prototype.map) {
	Array.prototype.map = function(callback) {
		var results = []
		for (var i = 0; i < this.length; i++) {
			results[i] = callback(this[i], i, this)
		}
		return results
	}
}
if (!Array.prototype.filter) {
	Array.prototype.filter = function(callback) {
		var results = []
		for (var i = 0; i < this.length; i++) {
			if (callback(this[i], i, this)) results.push(this[i])
		}
		return results
	}
}
if (!Object.keys) {
	Object.keys = function() {
		var keys = []
		for (var i in this) keys.push(i)
		return keys
	}
}

var mock = {}
mock.window = (function() {
	var window = {}
	window.document = {}
	window.document.childNodes = []
	window.document.createElement = function(tag) {
		return {
			style: {},
			childNodes: [],
			nodeType: 1,
			nodeName: tag.toUpperCase(),
			appendChild: window.document.appendChild,
			removeChild: window.document.removeChild,
			replaceChild: window.document.replaceChild,
			insertBefore: function(node, reference) {
				node.parentNode = this
				var referenceIndex = this.childNodes.indexOf(reference)
				var index = this.childNodes.indexOf(node)
				if (index > -1) this.childNodes.splice(index, 1)
				if (referenceIndex < 0) this.childNodes.push(node)
				else this.childNodes.splice(referenceIndex, 0, node)
			},
			insertAdjacentHTML: function(position, html) {
				//todo: accept markup
				if (position == "beforebegin") {
					this.parentNode.insertBefore(window.document.createTextNode(html), this)
				}
				else if (position == "beforeend") {
					this.appendChild(window.document.createTextNode(html))
				}
			},
			setAttribute: function(name, value) {
				this[name] = value.toString()
			},
			setAttributeNS: function(namespace, name, value) {
				this.namespaceURI = namespace
				this[name] = value.toString()
			},
			getAttribute: function(name, value) {
				return this[name]
			},
			addEventListener: function () {},
			removeEventListener: function () {}
		}
	}
	window.document.createElementNS = function(namespace, tag) {
		var element = window.document.createElement(tag)
		element.namespaceURI = namespace
		return element
	}
	window.document.createTextNode = function(text) {
		return {nodeValue: text.toString()}
	}
	window.document.documentElement = window.document.createElement("html")
	window.document.replaceChild = function(newChild, oldChild) {
		var index = this.childNodes.indexOf(oldChild)
		if (index > -1) this.childNodes.splice(index, 1, newChild)
		else this.childNodes.push(newChild)
		newChild.parentNode = this
		oldChild.parentNode = null
	}
	window.document.appendChild = function(child) {
		var index = this.childNodes.indexOf(child)
		if (index > -1) this.childNodes.splice(index, 1)
		this.childNodes.push(child)
		child.parentNode = this
	}
	window.document.removeChild = function(child) {
		var index = this.childNodes.indexOf(child)
		this.childNodes.splice(index, 1)
		child.parentNode = null
	}
	//getElementsByTagName is only used by JSONP tests, it's not required by Mithril
	window.document.getElementsByTagName = function(name){
		name = name.toLowerCase();
		var out = [];

		var traverse = function(node){
			if(node.childNodes && node.childNodes.length > 0){
				node.childNodes.map(function(curr){
					if(curr.nodeName.toLowerCase() === name)
						out.push(curr);
					traverse(curr);
				});
			}
		};

		traverse(window.document);
		return out;
	}
	window.scrollTo = function() {}
	window.cancelAnimationFrame = function() {}
	window.requestAnimationFrame = function(callback) {
		window.requestAnimationFrame.$callback = callback
		return window.requestAnimationFrame.$id++
	}
	window.requestAnimationFrame.$id = 1
	window.requestAnimationFrame.$resolve = function() {
		if (window.requestAnimationFrame.$callback) {
			var callback = window.requestAnimationFrame.$callback
			window.requestAnimationFrame.$callback = null
			callback()
		}
	}
	window.XMLHttpRequest = (function() {
		var request = function() {
			this.$headers = {}
			this.setRequestHeader = function(key, value) {
				this.$headers[key] = value
			}
			this.open = function(method, url) {
				this.method = method
				this.url = url
			}
			this.send = function() {
				this.responseText = JSON.stringify(this)
				this.readyState = 4
				this.status = 200
				request.$instances.push(this)
			}
		}
		request.$instances = []
		return request
	}())
	window.location = {search: "", pathname: "", hash: ""},
	window.history = {}
	window.history.pushState = function(data, title, url) {
		window.location.pathname = window.location.search = window.location.hash = url
	},
	window.history.replaceState = function(data, title, url) {
		window.location.pathname = window.location.search = window.location.hash = url
	}
	return window
}())
function testMithril(mock) {
	m.deps(mock)
	
	//m
	test(function() {return m("div").tag === "div"})
	test(function() {return m(".foo").tag === "div"})
	test(function() {return m(".foo").attrs.className === "foo"})
	test(function() {return m("[title=bar]").tag === "div"})
	test(function() {return m("[title=bar]").attrs.title === "bar"})
	test(function() {return m("[title=\'bar\']").attrs.title === "bar"})
	test(function() {return m("[title=\"bar\"]").attrs.title === "bar"})
	test(function() {return m("div", "test").children[0] === "test"})
	test(function() {return m("div", "test", "test2").children[1] === "test2"})
	test(function() {return m("div", ["test"]).children[0] === "test"})
	test(function() {return m("div", {title: "bar"}, "test").attrs.title === "bar"})
	test(function() {return m("div", {title: "bar"}, "test").children[0] === "test"})
	test(function() {return m("div", {title: "bar"}, ["test"]).children[0] === "test"})
	test(function() {return m("div", {title: "bar"}, m("div")).children[0].tag === "div"})
	test(function() {return m("div", {title: "bar"}, [m("div")]).children[0].tag === "div"})
	test(function() {return m("div", {title: "bar"}, "test0", "test1", "test2", "test3").children[3] === "test3"}) // splat
	test(function() {return m("div", {title: "bar"}, m("div"), m("i"), m("span")).children[2].tag === "span"})
	test(function() {return m("div", ["a", "b"]).children.length === 2})
	test(function() {return m("div", [m("div")]).children[0].tag === "div"})
	test(function() {return m("div", m("div")).children[0].tag === "div"}) //yes, this is expected behavior: see method signature
	test(function() {return m("div", [undefined]).tag === "div"})
	test(function() {return m("div", [{foo: "bar"}])}) //as long as it doesn't throw errors, it's fine
	test(function() {return m("svg", [m("g")])})
	test(function() {return m("svg", [m("a[href='http://google.com']")])})
	test(function() {return m(".foo", {"class": "bar"}).attrs["class"] == "foo bar"})
	test(function() {return m(".foo", {className: "bar"}).attrs.className == "foo bar"})

	//m.module
	test(function() {
		mock.requestAnimationFrame.$resolve()

		var root1 = mock.document.createElement("div")
		var mod1 = m.module(root1, {
			controller: function() {this.value = "test1"},
			view: function(ctrl) {return ctrl.value}
		})

		var root2 = mock.document.createElement("div")
		var mod2 = m.module(root2, {
			controller: function() {this.value = "test2"},
			view: function(ctrl) {return ctrl.value}
		})

		mock.requestAnimationFrame.$resolve()

		return (root1.childNodes[0].nodeValue === "test1" && root2.childNodes[0].nodeValue === "test2")
			&& (mod1.value && mod1.value === "test1") && (mod2.value && mod2.value === "test2")
	})

	//m.withAttr
	test(function() {
		var value
		var handler = m.withAttr("test", function(data) {value = data})
		handler({currentTarget: {test: "foo"}})
		return value === "foo"
	})

	//m.trust
	test(function() {return m.trust("test").valueOf() === "test"})

	//m.render
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, "test")
		return root.childNodes[0].nodeValue === "test"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {"class": "a"}))
		var elementBefore = root.childNodes[0]
		m.render(root, m("div", {"class": "b"}))
		var elementAfter = root.childNodes[0]
		return elementBefore === elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m(".a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m(".b"))
		var elementAfter = root.childNodes[0]
		return elementBefore === elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {id: "a"}))
		var elementBefore = root.childNodes[0]
		m.render(root, m("div", {title: "b"}))
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m("[title=b]"))
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, "test")
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [undefined]))
		return root.childNodes[0].childNodes[0].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("svg", [m("g")]))
		var g = root.childNodes[0].childNodes[0]
		return g.nodeName === "G" && g.namespaceURI == "http://www.w3.org/2000/svg"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("svg", [m("a[href='http://google.com']")]))
		return root.childNodes[0].childNodes[0].nodeName === "A"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div.classname", [m("a", {href: "/first"})]))
		m.render(root, m("div", [m("a", {href: "/second"})]))
		return root.childNodes[0].childNodes.length == 1
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [m("li"), undefined]))
		return root.childNodes[0].childNodes[1].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li"), m("li")]))
		m.render(root, m("ul", [m("li"), undefined]))
		return root.childNodes[0].childNodes.length == 2 && root.childNodes[0].childNodes[1].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [undefined]))
		return root.childNodes[0].childNodes[0].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [{}]))
		return root.childNodes[0].childNodes.length === 0
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [{tag: "b", attrs: {}}]))
		return root.childNodes[0].childNodes[0].nodeName == "B"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [{tag: new String("b"), attrs: {}}]))
		return root.childNodes[0].childNodes[0].nodeName == "B"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", [m("a")])]))
		m.render(root, m("ul", [{subtree: "retain"}]))
		return root.childNodes[0].childNodes[0].childNodes[0].nodeName === "A"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/43
		var root = mock.document.createElement("div")
		m.render(root, m("a", {config: m.route}, "test"))
		m.render(root, m("a", {config: m.route}, "test"))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (1)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (2)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeName === "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (3)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", ["test", m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeName === "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (4)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (5)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [m("#bar")]))
		m.render(root, m("#foo", [m("#bar"), [m("#baz")]]))
		return root.childNodes[0].childNodes[1].id === "baz"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/48
		var root = mock.document
		m.render(root, m("html", [m("#foo")]))
		var result = root.childNodes[0].childNodes[0].id === "foo"
		root.childNodes = [mock.document.createElement("html")]
		return result
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a", "test"))
		m.render(root, m("a.foo", "test"))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a.foo", "test"))
		m.render(root, m("a", "test"))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a.foo", "test"))
		m.render(root, m("a", "test1"))
		return root.childNodes[0].childNodes[0].nodeValue === "test1"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a", "test"))
		m.render(root, m("a", "test1"))
		return root.childNodes[0].childNodes[0].nodeValue === "test1"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], m("#bar")]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "b"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], m("#bar")]))
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b"), m("div", "c")], m("#bar")]))
		return root.childNodes[0].childNodes[2].childNodes[0].nodeValue === "c"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], [m("div", "c"), m("div", "d")], m("#bar")]))
		return root.childNodes[0].childNodes[3].childNodes[0].nodeValue === "d" && root.childNodes[0].childNodes[4].id === "bar"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], "test"]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "b" && root.childNodes[0].childNodes[2].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [["a", "b"], "test"]))
		return root.childNodes[0].childNodes[1].nodeValue === "b" && root.childNodes[0].childNodes[2].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/51
		var root = mock.document.createElement("div")
		m.render(root, m("main", [m("button"), m("article", [m("section"), m("nav")])]))
		m.render(root, m("main", [m("button"), m("article", [m("span"), m("nav")])]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeName === "SPAN"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/51
		var root = mock.document.createElement("div")
		m.render(root, m("main", [m("button"), m("article", [m("section"), m("nav")])]))
		m.render(root, m("main", [m("button"), m("article", ["test", m("nav")])]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/51
		var root = mock.document.createElement("div")
		m.render(root, m("main", [m("button"), m("article", [m("section"), m("nav")])]))
		m.render(root, m("main", [m("button"), m("article", [m.trust("test"), m("nav")])]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/55
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m("#b"))
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/56
		var root = mock.document.createElement("div")
		m.render(root, [null, "foo"])
		m.render(root, ["bar"])
		return root.childNodes.length == 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/56
		var root = mock.document.createElement("div")
		m.render(root, m("div", "foo"))
		return root.childNodes.length == 1
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("button"), m("ul")]))
		var valueBefore = root.childNodes[0].childNodes[0].nodeName
		m.render(root, m("div", [undefined, m("ul")]))
		var valueAfter = root.childNodes[0].childNodes[0].nodeValue
		return valueBefore === "BUTTON" && valueAfter === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("ul"), undefined]))
		var valueBefore1 = root.childNodes[0].childNodes[0].nodeName
		var valueBefore2 = root.childNodes[0].childNodes[1].nodeValue
		m.render(root, m("div", [undefined, m("ul")]))
		var valueAfter1 = root.childNodes[0].childNodes[0].nodeValue
		var valueAfter2 = root.childNodes[0].childNodes[1].nodeName
		return valueBefore1 === "UL" && valueAfter1 === "" && valueBefore2 === "" && valueAfter2 === "UL"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/79
		var root = mock.document.createElement("div")
		m.render(root, m("div", {style: {background: "red"}}))
		var valueBefore = root.childNodes[0].style.background
		m.render(root, m("div", {style: {}}))
		var valueAfter = root.childNodes[0].style.background
		return valueBefore === "red" && valueAfter === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div[style='background:red']"))
		return root.childNodes[0].style === "background:red"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {style: {background: "red"}}))
		var valueBefore = root.childNodes[0].style.background
		m.render(root, m("div", {}))
		var valueAfter = root.childNodes[0].style.background
		return valueBefore === "red" && valueAfter === undefined
	})
	test(function() {
		var root = mock.document.createElement("div")
		var module = {}, unloaded = false
		module.controller = function() {
			this.onunload = function() {unloaded = true}
		}
		module.view = function() {}
		m.module(root, module)
		m.module(root, {controller: function() {}, view: function() {}})
		return unloaded === true
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/87
		var root = mock.document.createElement("div")
		m.render(root, m("div", [[m("a"), m("a")], m("button")]))
		m.render(root, m("div", [[m("a")], m("button")]))
		return root.childNodes[0].childNodes.length == 2 && root.childNodes[0].childNodes[1].nodeName == "BUTTON"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/87
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("a"), m("b"), m("button")]))
		m.render(root, m("div", [m("a"), m("button")]))
		return root.childNodes[0].childNodes.length == 2 && root.childNodes[0].childNodes[1].nodeName == "BUTTON"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/99
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("img"), m("h1")]))
		m.render(root, m("div", [m("a")]))
		return root.childNodes[0].childNodes.length == 1 && root.childNodes[0].childNodes[0].nodeName == "A"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", "b", "c", "d"]))
		m.render(root, m("div", [["d", "e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", [["a", "b", "c", "d"]]))
		m.render(root, m("div", ["d", "e"]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["x", [["a"], "b", "c", "d"]]))
		m.render(root, m("div", ["d", ["e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["b"]))
		m.render(root, m("div", [["e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 1 && children[0].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", ["b"]]))
		m.render(root, m("div", ["d", [["e"]]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", [["b"]]]))
		m.render(root, m("div", ["d", ["e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", [["b"], "c"]]))
		m.render(root, m("div", ["d", [[["e"]], "x"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 3 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		var root = mock.document.createElement("div")

		var success = false
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {ctx.data = 1}}))
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {success = ctx.data === 1}}))
		return success
	})
	test(function() {
		var root = mock.document.createElement("div")

		var index = 0;
		var success = true;
		var statefulConfig = function(elem, isInitialized, ctx) {ctx.data = index++}
		var node = m("div", {config: statefulConfig});
		m.render(root, [node, node]);

		index = 0;
		var checkConfig = function(elem, isInitialized, ctx) {
			success = success && (ctx.data === index++)
		}
		node = m("div", {config: checkConfig});
		m.render(root, [node, node]);
		return success;
	})
	test(function() {
		var root = mock.document.createElement("div")
		var parent
		m.render(root, m("div", m("a", {
			config: function(el) {parent = el.parentNode.parentNode}
		})));
		return parent === root
	})
	test(function() {
		var root = mock.document.createElement("div")
		var count = 0
		m.render(root, m("div", m("a", {
			config: function(el) {
				var island = mock.document.createElement("div")
				count++
				if (count > 2) throw "too much recursion..."
				m.render(island, m("div"))
			}
		})));
		return count == 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/129
		var root = mock.document.createElement("div")
		m.render(root, m("div", [["foo", "bar"], ["foo", "bar"], ["foo", "bar"]]));
		m.render(root, m("div", ["asdf", "asdf2", "asdf3"]));
		return true
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		//insert at beginning
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstBefore = root.childNodes[0]
		m.render(root, [m("a", {key: 4}), m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstAfter = root.childNodes[1]
		return firstBefore == firstAfter && root.childNodes[0].key == 4 && root.childNodes.length == 4
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstBefore = root.childNodes[0]
		m.render(root, [m("a", {key: 4}), m("a", {key: 1}), m("a", {key: 2})])
		var firstAfter = root.childNodes[1]
		return firstBefore == firstAfter && root.childNodes[0].key == 4 && root.childNodes.length == 3
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstBefore = root.childNodes[1]
		m.render(root, [m("a", {key: 2}), m("a", {key: 3}), m("a", {key: 4})])
		var firstAfter = root.childNodes[0]
		return firstBefore == firstAfter && root.childNodes[0].key === "2" && root.childNodes.length === 3
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3}), m("a", {key: 4}), m("a", {key: 5})])
		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var fourthBefore = root.childNodes[3]
		m.render(root, [m("a", {key: 4}), m("a", {key: 10}), m("a", {key: 1}), m("a", {key: 2})])
		var firstAfter = root.childNodes[2]
		var secondAfter = root.childNodes[3]
		var fourthAfter = root.childNodes[0]
		return firstBefore === firstAfter && secondBefore === secondAfter && fourthBefore === fourthAfter && root.childNodes[1].key == "10" && root.childNodes.length === 4
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3}), m("a", {key: 4}), m("a", {key: 5})])
		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var fourthBefore = root.childNodes[3]
		m.render(root, [m("a", {key: 4}), m("a", {key: 10}), m("a", {key: 2}), m("a", {key: 1}), m("a", {key: 6}), m("a", {key: 7})])
		var firstAfter = root.childNodes[3]
		var secondAfter = root.childNodes[2]
		var fourthAfter = root.childNodes[0]
		return firstBefore === firstAfter && secondBefore === secondAfter && fourthBefore === fourthAfter && root.childNodes[1].key == "10" && root.childNodes[4].key == "6" && root.childNodes[5].key == "7" && root.childNodes.length === 6
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/149
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a"), m("a", {key: 4}), m("a", {key: 5})])
		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var thirdBefore = root.childNodes[2]
		var fourthBefore = root.childNodes[3]
		var fifthBefore = root.childNodes[4]
		m.render(root, [m("a", {key: 4}), m("a", {key: 5}), m("a"), m("a", {key: 1}), m("a", {key: 2})])
		var firstAfter = root.childNodes[3]
		var secondAfter = root.childNodes[4]
		var thirdAfter = root.childNodes[2]
		var fourthAfter = root.childNodes[0]
		var fifthAfter = root.childNodes[1]
		return firstBefore === firstAfter && secondBefore === secondAfter && thirdBefore === thirdAfter && fourthBefore === fourthAfter && fifthBefore === fifthAfter
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/246
		//insert at beginning with non-keyed in the middle
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1})])
		var firstBefore = root.childNodes[0]
		m.render(root, [m("a", {key: 2}), m("br"), m("a", {key: 1})])
		var firstAfter = root.childNodes[2]
		return firstBefore == firstAfter && root.childNodes[0].key == 2 && root.childNodes.length == 3
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/134
		var root = mock.document.createElement("div")
		m.render(root, m("div", {contenteditable: true}, "test"))
		mock.document.activeElement = root.childNodes[0]
		m.render(root, m("div", {contenteditable: true}, "test1"))
		m.render(root, m("div", {contenteditable: false}, "test2"))
		return root.childNodes[0].childNodes[0].nodeValue === "test2"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/136
		var root = mock.document.createElement("div")
		m.render(root, m("textarea", ["test"]))
		m.render(root, m("textarea", ["test1"]))
		return root.childNodes[0].value === "test1"
	})
	test(function() {
		var root = mock.document.createElement("div")
		var unloaded = 0
		m.render(root, [
			m("div", {
				key: 1,
				config: function(el, init, ctx) {
					ctx.onunload = function() {
						unloaded++
					}
				}
			})
		])
		m.render(root, [
			m("div", {key: 2}),
			m("div", {
				key: 1,
				config: function(el, init, ctx) {
					ctx.onunload = function() {
						unloaded++
					}
				}
			})
		])
		return unloaded == 0
	})
	test(function() {
		var root = mock.document.createElement("div")
		var unloadedParent = 0
		var unloadedChild = 0
		var configParent = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedParent++
			}
		}
		var configChild = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedChild++
			}
		}
		var unloaded = 0
		m.render(root, m("div", {config: configParent}, m("a", {config: configChild})))
		m.render(root, m("main", {config: configParent}, m("a", {config: configChild})))
		return unloadedParent === 1 && unloadedChild === 0
	})
	test(function() {
		var root = mock.document.createElement("div")
		var unloadedParent = 0
		var unloadedChild = 0
		var configParent = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedParent++
			}
		}
		var configChild = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedChild++
			}
		}
		var unloaded = 0
		m.render(root, m("div", {config: configParent}, m("a", {config: configChild})))
		m.render(root, m("main", {config: configParent}, m("b", {config: configChild})))
		return unloadedParent === 1 && unloadedChild === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/150
		var root = mock.document.createElement("div")
		m.render(root, [m("a"), m("div")])
		m.render(root, [[], m("div")])
		return root.childNodes.length == 1 && root.childNodes[0].nodeName == "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/156
		var root = mock.document.createElement("div")
		m.render(root, m("div", [
			["a", "b", "c", "d"].map(function() {
				return [m("div"), " "]
			}),
			m("span")
		]))
		return root.childNodes[0].childNodes[8].nodeName == "SPAN"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/157
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 2}), m("li", {key: 4})]))
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 1}), m("li", {key: 2}), m("li", {key: 3}), m("li", {key: 4}), m("li", {key: 5})]))
		return root.childNodes[0].childNodes.map(function(n) {return n.key}).join("") == "012345"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/157
		var root = mock.document.createElement("div")
		m.render(root, m("input", {value: "a"}))
		m.render(root, m("input", {value: "aa"}))
		return root.childNodes[0].childNodes.length == 0
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/157
		var root = mock.document.createElement("div")
		m.render(root, m("br", {"class": "a"}))
		m.render(root, m("br", {"class": "aa"}))
		return root.childNodes[0].childNodes.length == 0
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/194
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 1}), m("li", {key: 2}), m("li", {key: 3}), m("li", {key: 4}), m("li", {key: 5})]))
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 1}), m("li", {key: 2}), m("li", {key: 4}), m("li", {key: 5})]))
		return root.childNodes[0].childNodes.map(function(n) {return n.key}).join("") == "01245"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/194
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 1}), m("li", {key: 2}), m("li", {key: 3}), m("li", {key: 4}), m("li", {key: 5})]))
		m.render(root, m("ul", [m("li", {key: 1}), m("li", {key: 2}), m("li", {key: 3}), m("li", {key: 4}), m("li", {key: 5}), m("li", {key: 6})]))
		m.render(root, m("ul", [m("li", {key: 12}), m("li", {key: 13}), m("li", {key: 14}), m("li", {key: 15}), m("li", {key: 16}), m("li", {key: 17})]))
		return root.childNodes[0].childNodes.map(function(n) {return n.key}).join(",") == "12,13,14,15,16,17"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/206
		var root = mock.document.createElement("div")
		m.render(root, m("div", undefined))
		m.render(root, m("div", [m("div")]))
		return root.childNodes[0].childNodes.length == 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/206
		var root = mock.document.createElement("div")
		m.render(root, m("div", null))
		m.render(root, m("div", [m("div")]))
		return root.childNodes[0].childNodes.length == 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/200
		var root = mock.document.createElement("div")

		var unloaded1 = false
		function unloadable1(element, isInit, context) {
			context.onunload = function() {
				unloaded1 = true
			}
		}
		m.render(root, [ m("div", {config: unloadable1}) ])
		m.render(root, [ ])

		var unloaded2 = false
		function unloadable2(element, isInit, context) {
			context.onunload = function() {
				unloaded2 = true
			}
		}
		m.render(root, [ m("div", {config: unloadable2}) ])
		m.render(root, [ ])

		return unloaded1 === true && unloaded2 === true
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, [m("div.blue")])
		m.render(root, [m("div.green", [m("div")]), m("div.blue")])
		return root.childNodes.length == 2
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/277
		var root = mock.document.createElement("div")
		function Field() {
			this.tag = "div";
			this.attrs = {};
			this.children = "hello";
		}
		m.render(root, new Field())
		return root.childNodes.length == 1
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, {foo: 123})
		return root.childNodes.length == 0
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/299
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("div", {key: 1}, 1), m("div", {key: 2}, 2), m("div", {key: 3}, 3), m("div", {key: 4}, 4), m("div", {key: 5}, 5), null, null, null, null, null, null, null, null, null, null]))
		m.render(root, m("div", [null, null, m("div", {key: 3}, 3), null, null, m("div", {key: 6}, 6), null, null, m("div", {key: 9}, 9), null, null, m("div", {key: 12}, 12), null, null, m("div", {key: 15}, 15)]))
		m.render(root, m("div", [m("div", {key: 1}, 1), m("div", {key: 2}, 2), m("div", {key: 3}, 3), m("div", {key: 4}, 4), m("div", {key: 5}, 5), null, null, null, null, null, null, null, null, null, null]))
		return root.childNodes[0].childNodes.map(function(c) {return c.childNodes ? c.childNodes[0].nodeValue: c.nodeValue}).slice(0, 5).join("") == "12345"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/377
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("div", 1), m("div", 2), [m("div", {key: 3}, 3), m("div", {key: 4}, 4), m("div", {key:5}, 5)], [m("div", {key: 6}, 6)]]))
		m.render(root, m("div", [m("div", 1), null, [m("div", {key: 3}, 3), m("div", {key: 4}, 4), m("div", {key:5}, 5)], [m("div", {key: 6}, 6)]]))
		return root.childNodes[0].childNodes.map(function(c) {return c.childNodes ? c.childNodes[0].nodeValue: c.nodeValue}).slice(0, 5).join("") == "13456"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [console.log()])) //don't throw in Firefox
		return true
	})
	//end m.render

	//m.redraw
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})
		mock.requestAnimationFrame.$resolve()
		var valueBefore = root.childNodes[0].nodeValue
		controller.value = "foo"
		m.redraw()
		mock.requestAnimationFrame.$resolve()
		return valueBefore === "" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		var count = 0
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {},
			view: function(ctrl) {
				count++
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		m.redraw() //should run synchronously

		m.redraw() //rest should run asynchronously since they're spamming
		m.redraw()
		m.redraw()
		mock.requestAnimationFrame.$resolve() //teardown
		return count === 3
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		var count = 0
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {},
			view: function(ctrl) {
				count++
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		m.redraw(true) //should run synchronously

		m.redraw(true) //forced to run synchronously
		m.redraw(true)
		m.redraw(true)
		mock.requestAnimationFrame.$resolve() //teardown
		return count === 5
	})

	//m.route
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test1", {
			"/test1": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test1" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.pathname = "/"

		var root = mock.document.createElement("div")
		m.route.mode = "pathname"
		m.route(root, "/test2", {
			"/test2": {
				controller: function() {},
				view: function() {
					return [
						"foo",
						m("a", { href: "/test2", config: m.route }, "Test2")
					]
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.pathname == "/test2" &&
			root.childNodes[0].nodeValue === "foo" &&
			root.childNodes[1].href == "/test2"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.hash = "#"

		var root = mock.document.createElement("div")
		m.route.mode = "hash"
		m.route(root, "/test3", {
			"/test3": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.hash == "#/test3" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test4/foo", {
			"/test4/:test": {controller: function() {}, view: function() {return m.route.param("test")}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test4/foo" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var module = {controller: function() {}, view: function() {return m.route.param("test")}}

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test5/foo", {
			"/": module,
			"/test5/:test": module
		})
		var paramValueBefore = m.route.param("test")
		mock.requestAnimationFrame.$resolve()
		m.route("/")
		var paramValueAfter = m.route.param("test")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test6/foo", {
			"/": module,
			"/test6/:a1": module
		})
		var paramValueBefore = m.route.param("a1")
		mock.requestAnimationFrame.$resolve()
		m.route("/")
		var paramValueAfter = m.route.param("a1")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/61
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test7/foo", {
			"/": module,
			"/test7/:a1": module
		})
		var routeValueBefore = m.route()
		mock.requestAnimationFrame.$resolve()
		m.route("/")
		var routeValueAfter = m.route()
		mock.requestAnimationFrame.$resolve() //teardown
		return routeValueBefore === "/test7/foo" && routeValueAfter === "/"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test8/foo/SEP/bar/baz", {
			"/test8/:test/SEP/:path...": {
				controller: function() {},
				view: function() {
					return m.route.param("test") + "_" + m.route.param("path")
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test8/foo/SEP/bar/baz" && root.childNodes[0].nodeValue === "foo_bar/baz"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test9/foo/bar/SEP/baz", {
			"/test9/:test.../SEP/:path": {
				controller: function() {},
				view: function() {
					return m.route.param("test") + "_" + m.route.param("path")
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test9/foo/bar/SEP/baz" && root.childNodes[0].nodeValue === "foo/bar_baz"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test10/foo%20bar", {
			"/test10/:test": {
				controller: function() {},
				view: function() {
					return m.route.param("test")
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return root.childNodes[0].nodeValue === "foo bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "foo"}},
			"/test11": {controller: function() {}, view: function() {return "bar"}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test11/")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test11/" && root.childNodes[0].nodeValue === "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {}},
			"/test12": {controller: function() {}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test12?a=foo&b=bar")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test12?a=foo&b=bar" && m.route.param("a") == "foo" && m.route.param("b") == "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "bar"}},
			"/test13/:test": {controller: function() {}, view: function() {return m.route.param("test")}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test13/foo?test=bar")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test13/foo?test=bar" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "bar"}},
			"/test14": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test14?test&test2=")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test14?test=&test2=" && m.route.param("test") === "" && m.route.param("test2") === ""
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {}},
			"/test12": {controller: function() {}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test12", {a: "foo", b: "bar"})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test12?a=foo&b=bar" && m.route.param("a") == "foo" && m.route.param("b") == "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var route1, route2
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {route1 = m.route()}, view: function() {}},
			"/test13": {controller: function() {route2 = m.route()}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test13")
		mock.requestAnimationFrame.$resolve() //teardown
		return route1 == "/" && route2 == "/test13"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return m("div", {
						config: function(el, init, ctx) {
							ctx.onunload = function() {
								unloaded++
							}
						}
					})
				}
			},
			"/test14": {controller: function() {}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test14")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div"),
						m("div", {
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test15": {
				controller: function() {},
				view: function() {
					return [m("div")]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test15")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return m("div", {
						config: function(el, init, ctx) {
							ctx.onunload = function() {
								unloaded++
							}
						}
					})
				}
			},
			"/test16": {
				controller: function() {},
				view: function() {
					return m("a")
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test16")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test17": {
				controller: function() {},
				view: function() {
					return m("a")
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test17")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return m("div", {
						config: function(el, init, ctx) {
							ctx.onunload = function() {
								unloaded++
							}
						}
					})
				}
			},
			"/test18": {
				controller: function() {},
				view: function() {
					return [m("a")]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test18")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							key: 1,
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test20": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							key: 2,
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test20")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							key: 1,
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test21": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test21")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/foo", {
			"/foo": {
				controller: function() {},
				view: function() {
					return m("div", "foo");
				}
			},
			"/bar": {
				controller: function() {},
				view: function() {
					return m("div", "bar");
				}
			},
		})
		mock.requestAnimationFrame.$resolve()
		var foo = root.childNodes[0].childNodes[0].nodeValue;
		m.route("/bar")
		mock.requestAnimationFrame.$resolve() //teardown
		var bar = root.childNodes[0].childNodes[0].nodeValue;
		return (foo === "foo" && bar === "bar")
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		var config = function(el, init, ctx) {
			ctx.onunload = function() {
				unloaded++
			}
		}
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {},
				view: function() {
					return m("div", m("a", {config: config}, "foo"));
				}
			},
			"/bar1": {
				controller: function() {},
				view: function() {
					return m("main", m("a", {config: config}, "foo"));
				}
			},
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/bar1")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var strategy
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {
					strategy = m.redraw.strategy()
					m.redraw.strategy("none")
				},
				view: function() {
					return m("div");
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return strategy == "all" && root.childNodes.length == 0
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var strategy, count = 0
		var config = function(el, init) {if (!init) count++}
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {},
				view: function() {
					return m("div", {config: config});
				}
			},
			"/bar1": {
				controller: function() {
					strategy = m.redraw.strategy()
					m.redraw.strategy("redraw")
				},
				view: function() {
					return m("div", {config: config});
				}
			},
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/bar1")
		mock.requestAnimationFrame.$resolve() //teardown
		return strategy == "all" && count == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var strategy
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {this.number = 1},
				view: function(ctrl) {
					return m("div", {onclick: function() {
						strategy = m.redraw.strategy()
						ctrl.number++
						m.redraw.strategy("none")
					}}, ctrl.number);
				}
			}
		})
		root.childNodes[0].onclick({})
		mock.requestAnimationFrame.$resolve() //teardown
		return strategy == "diff" && root.childNodes[0].childNodes[0].nodeValue == "1"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var count = 0
		var config = function(el, init ) {if (!init) count++}
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {},
				view: function(ctrl) {
					return m("div", {config: config, onclick: function() {
						m.redraw.strategy("all")
					}});
				}
			}
		})
		root.childNodes[0].onclick({})
		mock.requestAnimationFrame.$resolve() //teardown
		return count == 2
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var value
		m.route(root, "/foo+bar", {
			"/:arg": {
				controller: function() {value = m.route.param("arg")},
				view: function(ctrl) {
					return ""
				}
			}
		})
		return value == "foo+bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "foo"}},
			"/test22": {controller: function() {}, view: function() {return "bar"}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route(String("/test22/"))
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test22/" && root.childNodes[0].nodeValue === "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "foo"}},
			"/test23": {controller: function() {}, view: function() {return "bar"}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route(new String("/test23/"))
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test23/" && root.childNodes[0].nodeValue === "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var value
		m.route(root, String("/foo+bar"), {
			"/:arg": {
				controller: function() {value = m.route.param("arg")},
				view: function(ctrl) {
					return ""
				}
			}
		})
		return value == "foo+bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var value
		m.route(root, new String("/foo+bar"), {
			"/:arg": {
				controller: function() {value = m.route.param("arg")},
				view: function(ctrl) {
					return ""
				}
			}
		})
		return value == "foo+bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve()
		mock.location.search = "?"
		
		var root = mock.document.createElement("div")
		
		var a = {}
		a.controller = function() {m.route("/b")}
		a.view = function() {return "a"}

		var b = {}
		b.controller = function() {}
		b.view = function(ctrl) {return "b"}

		m.route(root, "/a", {
			"/a": a,
			"/b": b
		})
		mock.requestAnimationFrame.$resolve()
		
		return root.childNodes[0].nodeValue == "b"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve()
		mock.location.search = "?"
		
		var root = mock.document.createElement("div")
		
		var a = {}
		a.controller = function() {
			m.route("/b?foo=1", {foo: 2})
		}
		a.view = function() {return "a"}
		
		var b = {}
		b.controller = function() {}
		b.view = function() {return "b"}

		m.route(root, "/", {
			"/": a,
			"/b": b,
		})
		mock.requestAnimationFrame.$resolve()
		
		return mock.location.search == "?/b?foo=2"
	})
	//end m.route

	//m.prop
	test(function() {
		var prop = m.prop("test")
		return prop() === "test"
	})
	test(function() {
		var prop = m.prop("test")
		prop("foo")
		return prop() === "foo"
	})
	test(function() {
		var prop = m.prop("test")
		return JSON.stringify(prop) === '"test"'
	})
	test(function() {
		var obj = {prop: m.prop("test")}
		return JSON.stringify(obj) === '{"prop":"test"}'
	})
	test(function() {
		var defer = m.deferred()
		var prop = m.prop(defer.promise)
		defer.resolve("test")

		return prop() === "test"
	})
	test(function() {
		var defer = m.deferred()
		var prop = m.prop(defer.promise).then(function () {
			return "test2"
		})
		defer.resolve("test")

		return prop() === "test2"
	})
	test(function() {
		var prop = m.prop(null)
		return prop() === null
	})

	//m.request
	test(function() {
		var prop = m.request({method: "GET", url: "test"})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().method === "GET" && prop().url === "test"
	})
	test(function() {
		var prop = m.request({method: "GET", url: "test"}).then(function(value) {return "foo"})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop() === "foo"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80", data: {}}).then(function(value) {return value})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().url === "http://domain.com:80"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80/:test1", data: {test1: "foo"}}).then(function(value) {return value})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().url === "http://domain.com:80/foo"
	})
	test(function() {
		var error = m.prop("no error")
		var prop = m.request({method: "GET", url: "test", deserialize: function() {throw new Error("error occurred")}}).then(null, error)
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().message === "error occurred" && error().message === "error occurred"
	})
	test(function() {
		var error = m.prop("no error"), exception
		var prop = m.request({method: "GET", url: "test", deserialize: function() {throw new TypeError("error occurred")}}).then(null, error)
		try {mock.XMLHttpRequest.$instances.pop().onreadystatechange()}
		catch (e) {exception = e}
		m.endComputation()
		return prop() === undefined && error() === "no error" && exception.message == "error occurred"
	})
	test(function() {
		var error = m.prop("no error")
		var prop = m.request({method: "POST", url: "test", data: {foo: 1}}).then(null, error)
		var xhr = mock.XMLHttpRequest.$instances.pop()
		xhr.onreadystatechange()
		return xhr.$headers["Content-Type"] == "application/json; charset=utf-8"
	})
	test(function() {
		var error = m.prop("no error")
		var prop = m.request({method: "POST", url: "test"}).then(null, error)
		var xhr = mock.XMLHttpRequest.$instances.pop()
		xhr.onreadystatechange()
		return xhr.$headers["Content-Type"] === undefined
	})
	test(function() {
		var prop = m.request({method: "POST", url: "test", initialValue: "foo"})
		var initialValue = prop();
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()

		return initialValue === "foo"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "test", initialValue: "foo"}).then(function(value) {return "bar"})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop() === "bar"
	})
	test(function() {
		var prop = m.request({method: "GET", url: "test", data: {foo: 1}})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().url === "test?foo=1"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "test", data: {foo: 1}})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().url === "test"
	})

	// m.request over jsonp
	test(function(){
		// script tags cannot be appended directly on the document
		var body = mock.document.createElement("body")
		mock.document.body = body
		mock.document.appendChild(body)

		var	error = m.prop("no error")
		var data
		var req = m.request({url: "/test", dataType: "jsonp"}).then(function(received) {data = received}, error)
		var callbackKey = Object.keys(mock).filter(function(globalKey){
			return globalKey.indexOf("mithril_callback") > -1
		}).pop()
		var scriptTag = [].slice.call(mock.document.getElementsByTagName("script")).filter(function(script){
			return script.src.indexOf(callbackKey) > -1
		}).pop()
		mock[callbackKey]({foo: "bar"})
		mock.document.removeChild(body)
		return scriptTag.src.indexOf("/test?callback=mithril_callback") > -1 && data.foo == "bar"
	})
	test(function(){
		// script tags cannot be appended directly on the document
		var body = mock.document.createElement("body")
		mock.document.body = body
		mock.document.appendChild(body)

		var	error = m.prop("no error")
		var data
		var req = m.request({url: "/test", dataType: "jsonp", callbackKey: "jsonpCallback"}).then(function(received) {data = received}, error);
		var callbackKey = Object.keys(mock).filter(function(globalKey){
			return globalKey.indexOf("mithril_callback") > -1
		}).pop()
		var scriptTag = [].slice.call(mock.document.getElementsByTagName("script")).filter(function(script){
			return script.src.indexOf(callbackKey) > -1
		}).pop()
		mock[callbackKey]({foo: "bar1"})
		mock.document.removeChild(body)
		return scriptTag.src.indexOf("/test?jsonpCallback=mithril_callback") > -1 && data.foo == "bar1"
	})
	test(function(){
		var body = mock.document.createElement("body")
		mock.document.body = body
		mock.document.appendChild(body)

		var req = m.request({url: "/test", dataType: "jsonp"})
		var callbackKey = Object.keys(mock).filter(function(globalKey){
			return globalKey.indexOf("mithril_callback") > -1
		}).pop()
		var scriptTag = [].slice.call(mock.document.getElementsByTagName("script")).filter(function(script){
			return script.src.indexOf(callbackKey) > -1
		}).pop();
		mock[callbackKey]({foo: "bar1"})
		var out = {foo: "bar1"}
		mock.document.removeChild(body)
		return JSON.stringify(out) === JSON.stringify(req())
	})
	test(function(){
		var body = mock.document.createElement("body")
		mock.document.body = body
		mock.document.appendChild(body)

		var req = m.request({url: "/test", dataType: "jsonp", data: {foo: "bar"}})
		var callbackKey = Object.keys(mock).filter(function(globalKey){
			return globalKey.indexOf("mithril_callback") > -1
		}).pop()
		var scriptTag = [].slice.call(mock.document.getElementsByTagName("script")).filter(function(script){
			return script.src.indexOf(callbackKey) > -1
		}).pop();
		mock[callbackKey]({foo: "bar"})
		return scriptTag.src.indexOf("foo=bar") > -1
	})
	test(function(){
		var body = mock.document.createElement("body");
		mock.document.body = body;
		mock.document.appendChild(body);

		var _window = mock;
		var error = m.prop(false);
		var req = m.request({url: "/test", dataType: "jsonp", method: "GET", data: {foo: "bar"}});
		var callbackKey = Object.keys(mock).filter(function(globalKey){
			return globalKey.indexOf("mithril_callback") > -1
		}).pop()
		var scriptTag = [].slice.call(mock.document.getElementsByTagName("script")).filter(function(script){
			return script.src.indexOf(callbackKey) > -1
		}).pop();
		mock[callbackKey]({foo: "bar"})
		mock.document.removeChild(body);
		return scriptTag.src.match(/foo=bar/g).length == 1;
	})

	//m.deferred
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(function(data) {value = data})
		deferred.resolve("test")
		return value === "test"
	})
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(function(data) {return "foo"}).then(function(data) {value = data})
		deferred.resolve("test")
		return value === "foo"
	})
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(null, function(data) {value = data})
		deferred.reject("test")
		return value === "test"
	})
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(null, function(data) {return "foo"}).then(function(data) {value = data})
		deferred.reject("test")
		return value === "foo"
	})
	test(function() {
		var value1, value2
		var deferred = m.deferred()
		deferred.promise.then(function(data) {throw new Error}).then(function(data) {value1 = 1}, function(data) {value2 = data})
		deferred.resolve("test")
		return value1 === undefined && value2 instanceof Error
	})
	test(function() {
		//Let unchecked exceptions bubble up in order to allow meaningful error messages in common cases like null reference exceptions due to typos
		//An unchecked exception is defined as an object that is a subclass of Error (but not a direct instance of Error itself) - basically anything that can be thrown without an explicit `throw` keyword and that we'd never want to programmatically manipulate. In other words, an unchecked error is one where we only care about its line number and where the only reasonable way to deal with it is to change the buggy source code that caused the error to be thrown in the first place.
		//By contrast, a checked exception is defined as anything that is explicitly thrown via the `throw` keyword and that can be programmatically handled, for example to display a validation error message on the UI. If an exception is a subclass of Error for whatever reason, but it is meant to be handled as a checked exception (i.e. follow the rejection rules for A+), it can be rethrown as an instance of Error
		//This test tests two implementation details that differ from the Promises/A+ spec:
		//1) A+ requires the `then` callback to be called in a different event loop from the resolve call, i.e. it must be asynchronous (this requires a setImmediate polyfill, which cannot be implemented in a reasonable way for Mithril's purpose - the possible polyfills are either too big or too slow)
		//2) A+ swallows exceptions in a unrethrowable way, i.e. it's not possible to see default error messages on the console for runtime errors thrown from within a promise chain
		var value1, value2, value3
		var deferred = m.deferred()
		try {
			deferred.promise
				.then(function(data) {foo.bar.baz}) //throws ReferenceError
				.then(function(data) {value1 = 1}, function(data) {value2 = data})
			deferred.resolve("test")
		}
		catch (e) {value3 = e}
		return value1 === undefined && value2 === undefined && (value3 instanceof ReferenceError || value3 instanceof TypeError)
	})
	test(function() {
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		var value1, value2
		deferred1.promise.then(function(data) {
			value1 = data
			return deferred2.promise
		}).then(function(data) {
			value2 = data
		})
		deferred1.resolve(1)
		deferred2.resolve(2)
		return value1 === 1 && value2 === 2
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.resolve(1)
		deferred.promise.then(function(data) {
			value = data
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.reject(1)
		deferred.promise.then(null, function(data) {
			value = data
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.resolve(1)
		deferred.resolve(2)
		deferred.promise.then(function(data) {
			value = data
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.promise.then(function(data) {
			value = data
		})
		deferred.resolve(1)
		deferred.resolve(2)
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value1, value2
		deferred.promise.then(function(data) {
			value1 = data
		}, function(data) {
			value2 = data
		})
		deferred.resolve(1)
		deferred.reject(2)
		return value1 === 1 && value2 === undefined
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value1, value2
		deferred.promise.then(function() {
			value1 = data
		}, function(data) {
			value2 = data
		})
		deferred.reject(1)
		deferred.resolve(2)
		return value1 === undefined && value2 === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.promise.then(null, function(data) {
			value = data
		})
		deferred.reject(1)
		deferred.reject(2)
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/85
		var deferred = m.deferred(), value
		deferred.resolve()
		deferred.promise.then(function(data) {
			value = 1
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/85
		var deferred = m.deferred(), value
		deferred.reject()
		deferred.promise.then(null, function(data) {
			value = 1
		})
		return value === 1
	})
	test(function() {
		var deferred = m.deferred(), value
		deferred.resolve(1)
		return deferred.promise() === 1
	})
	test(function() {
		var deferred = m.deferred(), value
		var promise = deferred.promise.then(function(data) {return data + 1})
		deferred.resolve(1)
		return promise() === 2
	})
	test(function() {
		var deferred = m.deferred(), value
		deferred.reject(1)
		return deferred.promise() === undefined
	})

	//m.sync
	test(function() {
		var value
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		m.sync([deferred1.promise, deferred2.promise]).then(function(data) {value = data})
		deferred1.resolve("test")
		deferred2.resolve("foo")
		return value[0] === "test" && value[1] === "foo"
	})
	test(function() {
		var value
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		m.sync([deferred1.promise, deferred2.promise]).then(function(data) {value = data})
		deferred2.resolve("foo")
		deferred1.resolve("test")
		return value[0] === "test" && value[1] === "foo"
	})
	test(function() {
		var value = 1
		m.sync([]).then(function() {value = 2})
		return value == 2
	})
	test(function() {
		var success
		m.sync([]).then(function(value) {success = value instanceof Array})
		return success
	})

	//m.startComputation/m.endComputation
	test(function() {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var controller = m.module(root, {
			controller: function() {},
			view: function(ctrl) {return ctrl.value}
		})

		mock.requestAnimationFrame.$resolve()

		m.startComputation()
		controller.value = "foo"
		m.endComputation()
		mock.requestAnimationFrame.$resolve()
		return root.childNodes[0].nodeValue === "foo"
	})

	// config context
	test(function() {
		var root = mock.document.createElement("div")

		var success = false;
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {ctx.data=1}}));
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {success = ctx.data===1}}));
		return success;
	})

	// more complex config context
	test(function() {
		var root = mock.document.createElement("div")

		var idx = 0;
		var success = true;
		var statefulConfig = function(elem, isInitialized, ctx) {ctx.data=idx++}
		var node = m("div", {config: statefulConfig});
		m.render(root, [node, node]);

		idx = 0;
		var checkConfig = function(elem, isInitialized, ctx) {
			success = success && (ctx.data === idx++)
		}
		node = m("div", {config: checkConfig});
		m.render(root, [node, node]);
		return success;
	})

	//console.log presence
	test(function() {
		return m.deps.factory.toString().indexOf("console") < 0
	})
	test(function() {
		return m.deps.factory.toString().indexOf("document.write") < 0
	})
}

//mock
testMithril(mock.window);

test.print(function(value) {console.log(value)})
