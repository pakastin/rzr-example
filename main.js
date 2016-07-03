(function () {
  'use strict';

  function diff (parent, node, el) {
    var oldEl = (node && node.el) || {};

    var attrs = el.attrs;
    var oldAttrs = oldEl.attrs || {};

    var children = el.children;

    for (var attr in attrs) {
      var value = attrs[attr];
      var oldValue = oldAttrs[attr];

      if (value !== oldValue) {
        if (typeof value === 'object') {
          if (attr === 'style') {
            for (var key in value) {
              if (value[key] !== (oldValue && oldValue[key])) {
                node.style[key] = value[key];
              }
            }
            for (var key in oldValue) {
              if (value[key] == null) {
                node.style[key] = '';
              }
            }
          } else if (attr === 'class') {
            for (var key in value) {
              if (key) {
                if (value[key] !== (oldValue && oldValue[key])) {
                  if (value[key]) {
                    node.classList.add(key);
                  } else {
                    node.classList.remove(key);
                  }
                }
              }
            }
            for (var key in oldValue) {
              if (key) {
                if (value[key] == null) {
                  node.classList.remove(key);
                }
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

  function diffSVG (parent, node, el) {
    var oldEl = (node && node.el) || {};

    var attrs = el.attrs;
    var oldAttrs = oldEl.attrs || {};

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
        } else if (typeof value == 'function') {
          node[attr] = value;
        } else {
          node.setAttribute(attr, value);
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

  function list (Component, data, key) {
    var results = new Array(data.length);

    for (var i = 0; i < results.length; i++) {
      var item = data[i];

      if (key) {
        results[i] = el(Component, Object.assign({}, item, {key: item[key]}));
      } else {
        results[i] = el(Component, item);
      }
    }

    return results;
  }

  function render (parent, el, originalPos) {
    var pos = originalPos || 0;
    var oldNode = parent.childNodes[pos];
    var oldEl = oldNode && oldNode.el;

    if (typeof el.tagName === 'function') {
      var key = el.attrs.key;
      if (key != null) {
        oldEl = parent.childLookup && parent.childLookup[key];
      }
      if (oldEl && oldEl.componentClass && el.tagName === oldEl.componentClass) {
        var attrs = el.attrs;
        var children = el.children;
        var oldComponent = oldEl.component;
        var oldComponentClass = oldEl.componentClass;

        oldComponent.update && oldComponent.update.apply(oldComponent, [ attrs ].concat( children ));

        el = oldComponent.render.apply(oldComponent, [ attrs ].concat( children ));
        el.component = oldComponent;
        el.componentClass = oldComponentClass;

        if (key != null) {
          parent.childLookup || (parent.childLookup = {});
          parent.childLookup[key] = el;

          if (oldEl && oldEl.dom) {
            if (oldNode) {
              parent.insertBefore(oldEl.dom, oldNode);
            } else {
              parent.appendChild(oldEl.dom);
            }
          }
        }

        pos = render(parent, el, pos);
      } else {
        var componentClass = el.tagName;
        var component = new componentClass();
        var attrs = el.attrs;
        var children = el.children;

        el = component.render.apply(component, [ attrs ].concat( children ));
        el.component = component;
        el.componentClass = componentClass;

        if (key != null) {
          parent.childLookup || (parent.childLookup = {});
          parent.childLookup[key] = el;
          el.key = key;
        }

        pos = render(parent, el, pos);
      }
    } else if (el instanceof Array) {
      for (var i = 0; i < el.length; i++) {
        if (el[i] != null) pos = render(parent, el[i], pos);
      }
    } else if (el instanceof Node) {
      if (el !== oldNode) {
        if (oldNode) {
          parent.insertBefore(el, oldNode);
        } else {
          parent.appendChild(el);
        }
      }
      pos++;
    } else if (typeof el === 'string' || typeof el === 'number' || el instanceof Date) {
      var str = String(el);
      if (!oldNode || oldNode.textContent !== str) {
        pos = render(parent, document.createTextNode(str), pos);
      } else {
        pos++;
      }
    } else {
      var isSVG = (el.tagName === 'svg' || parent instanceof SVGElement);

      if (el.key != null) {
        oldEl = parent.childLookup && parent.childLookup[oldEl];
      }

      if (oldEl && el.tagName === oldEl.tagName && el.componentClass === oldEl.componentClass) {
        if (isSVG) {
          diffSVG(parent, oldNode, el);
        } else {
          diff(parent, oldNode, el);
        }
        oldNode.el = el;
        el.dom = oldNode;
      } else {
        var newNode = isSVG ? document.createElementNS('http://www.w3.org/2000/svg', el.tagName) : document.createElement(el.tagName);
        isSVG ? diffSVG(parent, newNode, el) : diff(parent, newNode, el);
        newNode.el = el;
        el.dom = newNode;
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

  var Item = function Item () {};

  Item.prototype.render = function render$1 (ref) {
      var width = ref.width;
      var height = ref.height;
      var i = ref.i;

    return el( 'div', { class: "card" },
      el( 'div', { style: ("width: " + width + "px; height: " + height + "px; background-image: url(https://unsplash.it/" + width + "/" + height + ")") }),
      el( 'p', null, "Image ", i
      )
    )
  };

  var Main = function Main () {};

  Main.prototype.render = function render$2 (ref) {
      var items = ref.items;

    return el( 'div', { class: "app" },
      el( 'p', null,
        el( 'a', { href: "https://github.com/pakastin/rzr-example" }, "Source")
      ),
      el( 'div', { class: "speed" },
        el( 'button', { onclick: this.minRate.bind(this) }, "Min"),
        el( 'input', { oninput: this.onRefreshRate, type: "range", min: "0", max: "100", value: "0" }),
        el( 'button', { onclick: this.maxRate.bind(this) }, "Max")
      ),
        list(Item, items, 'i')
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