(function () {
  'use strict';

  function diff (parent, node, el) {
    var oldEl = node && node.el;

    var attrs = el.attrs;
    var oldAttrs = oldEl.attrs;

    var children = el.children;

    for (var attr in attrs) {
      var value = attrs[attr];
      var oldValue = oldAttrs[attr];

      if (value !== oldValue) {
        if (typeof value === 'object') {
          if (attr === 'style') {
            for (var key in value) {
              node.style[key] = value[key];
            }
            for (var key in oldValue) {
              if (value[key] == null) {
                node.style[key] = '';
              }
            }
          } else if (attr === 'class') {
            for (var key in value) {
              if (value == true) {
                node.classList.add(key);
              }
            }
            for (var key in oldValue) {
              if (value[key] == null) {
                node.classList.remove(key);
              }
            }
          } else {
            node[attr] = value;
          }
        } else if (attr === 'style' || (node[attr] == null && typeof value != 'function')) {
          node.setAttribute(attr, value);
        } else {
          node[attr] = value;
        }
      }
    }

    if (typeof children === 'string' || typeof children === 'number') {
      node.textContent = children;
    } else if (children) {
      render(node, children);
    } else {
      render(node, []);
    }
  }

  function el (tagName, attrs) {
    var children = [], len = arguments.length - 2;
    while ( len-- > 0 ) children[ len ] = arguments[ len + 2 ];

    for (var key in attrs) {
      if (key === 'style') {
        var value = attrs.style;

        if (typeof value === 'string') {
          attrs.style = parseStyleString(value);
        }
      } else if (key === 'class') {
        var value = attrs.class;

        if (typeof value === 'string') {
          attrs.class = parseClassString(value);
        }
      }
    }

    return {
      tagName: tagName,
      attrs: attrs || {},
      children: children
    }
  }

  function parseStyleString (styleString) {
    var split = styleString.split(';');
    var result = {};

    for (var i = 0; i < split.length; i++) {
      var part = split[i].split(':');
      var key = dashedToCamelCase(part[0].trim());

      result[key] = part.slice(1).join(':').trim();
    }

    return result;
  }

  function parseClassString (classString) {
    var split = classString.split(' ');
    var result = {};

    for (var i = 0; i < split.length; i++) {
      result[split[i]] = true;
    }

    return result;
  }

  function dashedToCamelCase (str) {
    var result = [];

    for (var i = 0; i < str.length; i++) {
      if (str[i] === '-') {
        if (i > 0) {
          result[i++] = str[i].toUpperCase();
        } else {
          result[i++] = str[i];
        }
      } else {
        result[i] = str[i];
      }
    }
    return result.join('');
  }

  function list (Component, data) {
    var results = new Array(data.length);

    for (var i = 0; i < results.length; i++) {
      results[i] = el(Component, data[i]);
    }

    return results;
  }

  function parse (el) {
    var node = document.createElement(el.tagName);
    var attrs = el.attrs;

    node.el = el;
    el.dom = node;

    for (var key in attrs) {
      var value = attrs[key];

      if (typeof value === 'object') {
        if (key === 'style') {
          for (var key in value) {
            node.style[key] = value[key];
          }
        } else if (key === 'class') {
          for (var key in value) {
            node.classList.add(key);
          }
        } else {
          node[key] = value;
        }
      } else if (key === 'style' || (value == null && typeof value != 'function')) {
        node.setAttribute(key, value);
      } else {
        node[key] = value;
      }
    }

    var children = el.children;

    if (typeof children === 'string' || typeof children === 'number') {
      node.textContent = children;
    } else if (children) {
      render(node, children);
    }

    return node;
  }

  function parseSVG (el) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);

    node.el = el;
    el.dom = node;

    var attrs = el.attrs;

    for (var key in attrs) {
      var value = attrs[key];

      if (typeof value === 'object') {
        if (key === 'style') {
          for (var key in value) {
            node.style[key] = value[key];
          }
        } else if (key === 'class') {
          for (var key in value) {
            node.classList.add(key);
          }
        } else {
          node[key] = value;
        }
      } else if (typeof value === 'function') {
        node[key] = value;
      } else {
        node.setAttribute(key, value);
      }
    }

    var children = el.children;

    render(node, children);

    return node;
  }

  function render (parent, el, originalPos) {
    var pos = originalPos | pos;
    var oldNode = parent.childNodes[pos];
    var oldEl = oldNode && oldNode.el;

    if (typeof el.tagName === 'function') {
      if (oldEl && oldEl.componentClass && el.tagName === oldEl.componentClass) {
        var attrs = el.attrs;
        var children = el.children;
        var oldComponent = oldEl.component;
        var oldComponentClass = oldEl.componentClass;

        oldComponent.update && oldComponent.update.apply(oldComponent, [ attrs ].concat( children ));

        el = oldComponent.render.apply(oldComponent, [ attrs ].concat( children ));
        el.component = oldComponent;
        el.componentClass = oldComponentClass;

        pos = render(parent, el, pos);
      } else {
        var componentClass = el.tagName;
        var component = new componentClass();
        var attrs = el.attrs;
        var children = el.children;

        el = component.render.apply(component, [ attrs ].concat( children ));
        el.component = component;
        el.componentClass = componentClass;

        pos = render(parent, el, pos);
      }
    } else if (el instanceof Array) {
      for (var i = 0; i < el.length; i++) {
        pos = render(parent, el[i], pos);
      }
    } else if (el instanceof Node) {
      if (oldNode) {
        parent.insertBefore(newNode, oldNode);
      } else {
        parent.appendChild(newNode);
      }
      pos++;
    } else if (typeof el === 'string' || typeof el === 'number') {
      parent.textContent = el;
      pos++;
    } else {
      var isSVG = (el.tagName === 'svg' || parent instanceof SVGElement);

      if (oldEl && el.tagName === oldEl.tagName && el.componentClass === oldEl.componentClass) {
        if (isSVG) {
          diffSVG(parent, oldNode, el);
        } else {
          diff(parent, oldNode, el);
        }
      } else {
        var newNode = isSVG ? parseSVG(el) : parse(el);
        var el = newNode.el;
        var component = el && el.component;

        if (oldNode) {
          parent.insertBefore(newNode, oldNode);
        } else {
          parent.appendChild(newNode);
        }

        if (component) {
          component.dom = newNode;
          component.init && component.init.apply(component, [ attrs ].concat( children ));
        }

        if (parent.parentNode) {
          component && component.mount && component.mount();
          notifyDown(newNode, 'mount');
        }
      }
      pos++;
    }

    if (originalPos == null) {
      var traverse = parent.childNodes[pos];

      while (traverse) {
        var next = traverse.nextSibling;
        var el = traverse.el;
        var component = el && el.component;

        component && component.unmount && component.unmount();
        notifyDown(traverse, 'unmount');
        parent.removeChild(traverse);

        traverse = next;
      }
    }
    return pos;
  }

  function notifyDown (child, eventName) {
    var traverse = child.firstChild;

    while (traverse) {
      var next = traverse.nextSibling;
      var el = traverse.el;
      var component = el && el.component;

      component && component[eventName] && component[eventName]();
      notifyDown(traverse, eventName);

      traverse = next;
    }
  }

  var REFRESH_RATE = 0;

  var total = 0;

  var Item = function Item () {};

  Item.prototype.render = function render$1 (ref) {
      var width = ref.width;
      var height = ref.height;
      var i = ref.i;

    return el( 'div', { class: "card" },
      el( 'div', { style: ("width: " + width + "px; height: " + height + "px; background-image: url(http://unsplash.it/" + width + "/" + height + ")") }),
      el( 'p', null, "Image ", i
      )
    )
  };
  Item.prototype.mount = function mount () {
    total++;
  };
  Item.prototype.unmount = function unmount () {
    total--;
  };

  var Main = function Main () {};

  Main.prototype.render = function render$2 (ref) {
      var items = ref.items;

    return el( 'div', { class: "app" },
      el( 'p', null,
        el( 'a', { href: "http://github.com/pakastin/rzr-example" }, "Source")
      ),
      el( 'div', { class: "speed" },
        el( 'button', { onclick: this.minRate.bind(this) }, "Min"),
        el( 'input', { oninput: this.onRefreshRate, type: "range", min: "0", max: "100", value: "0" }),
        el( 'button', { onclick: this.maxRate.bind(this) }, "Max")
        ),
      list(Item, items)
      )
    };
    Main.prototype.init = function init () {
      this.range = this.dom.querySelector('input[type="range"]');
  };
  Main.prototype.minRate = function minRate () {
    this.range.value = REFRESH_RATE = 0;
  };

  Main.prototype.onRefreshRate = function onRefreshRate () {
    REFRESH_RATE = this.value;
  };

  Main.prototype.maxRate = function maxRate () {
    this.range.value = REFRESH_RATE = 100;
  };

  var data = new Array(50);

  for (var i = 0; i < data.length; i++) {
    data[i] = {
      i: i,
      width: Math.random() * 75 + 75 | 0,
      height: Math.random() * 75 + 75 | 0
    };
  }

  (function update () {
    var LEN = Math.random() * 25 + 25 | 0;

    render(document.body, el( Main, { items: data.slice(0, LEN) }));
    data.sort(function () { return Math.random() - 0.5; });

    if (REFRESH_RATE < 100) {
      setTimeout(update, 1000 - REFRESH_RATE * 10);
    } else {
      requestAnimationFrame(update);
    }
  })();

}());