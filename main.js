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
        if (el[i] != null) pos = render(parent, el[i], pos);
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

  var Li = function Li () {};

  Li.prototype.render = function render$1 (ref) {
      var children = [], len = arguments.length - 1;
      while ( len-- > 0 ) children[ len ] = arguments[ len + 1 ];

      var i = ref.i;
    return el( 'li', { class: "item", onclick: this.onClick.bind(this) }, i)
  };
  Li.prototype.init = function init (data) {
      var children = [], len = arguments.length - 1;
      while ( len-- > 0 ) children[ len ] = arguments[ len + 1 ];

    console.log('created', this.dom);
  };
  Li.prototype.update = function update$1 (data) {
      var children = [], len = arguments.length - 1;
      while ( len-- > 0 ) children[ len ] = arguments[ len + 1 ];

    console.log('updated', this.dom);
  };
  Li.prototype.mount = function mount () {
    console.log('mounted', this.dom);
  };
  Li.prototype.unmount = function unmount () {
    console.log('unmounted', this.dom);
  };
  Li.prototype.onClick = function onClick () {
    console.log(this);
  };

  var data = new Array(50);

  for (var i = 0; i < data.length; i++) {
    data[i] = { i: i };
  }

  update();

  function update () {
    var LEN = Math.random() * 25 + 25 | 0;

    render(document.body, el( 'ul', null,
      list(Li, data.slice(0, LEN))
    ));

    data.sort(function () { return Math.random() - 0.5; });

    setTimeout(update, 1000);
  }

}());