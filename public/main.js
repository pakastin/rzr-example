(function () {
  'use strict';

  var el = function (tagName, attrs, children) {
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

  var parseStyleString = function (styleString) {
    var split = styleString.split(';');
    var result = {};

    for (var i = 0; i < split.length; i++) {
      var part = split[i].split(':');
      result[part[0]] = part[1];
    }

    return result;
  }

  var parseClassString = function (classString) {
    var split = classString.split(' ');
    var result = {};

    for (var i = 0; i < split.length; i++) {
      result[split[i]] = true;
    }

    return result;
  }

  var render = function (parent, el, pos) {
    var originalPos = pos;
    var pos = pos || 0;
    var oldNode = parent.childNodes[pos];
    var oldEl = oldNode && oldNode.el

    if (typeof el.tagName === 'function') {
      if (oldEl && oldEl.componentClass && el.tagName === oldEl.componentClass) {
        var attrs = el.attrs;
        var children = el.children;
        var oldComponent = oldEl.component;
        var oldComponentClass = oldEl.componentClass;

        oldComponent.update.apply(oldComponent, [ attrs ].concat( children ));

        el = oldComponent.render.apply(oldComponent, [ attrs ].concat( children ));
        el.component = oldComponent;
        el.componentClass = oldComponentClass;

        return render(parent, el, pos++);
      } else {
        var componentClass = el.tagName;
        var component = new componentClass();
        var attrs = el.attrs;
        var children = el.children;

        el = component.render.apply(component, [ attrs ].concat( children ));
        el.component = component;
        el.componentClass = componentClass;

        component.isMounted = false;

        return render(parent, el, pos++);
      }
    } else if (el instanceof Array) {
      for (var i = 0; i < el.length; i++) {
        render(parent, el[i], pos++);
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

        if (component && !component.isMounted) {
          component.dom = newNode;
          component.init && component.init.apply(component, [ attrs ].concat( children ));
          component.isMounted = true;
        }

        component && component.mount && component.mount();
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
        notifyUnmount(traverse);
        parent.removeChild(traverse);

        traverse = next;
      }
    }
  }

  function notifyUnmount (child) {
    var traverse = child.firstChild;

    while (traverse) {
      var next = traverse.nextSibling;
      var el = traverse.el;
      var component = el && el.component;

      component && component.unmount();
      notifyUnmount(traverse);

      traverse = next;
    }
  }

  var parse = function (el) {
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
      for (var i = 0; i < children.length; i++) {
        var child = children[i];

        if (child instanceof Node) {
          node.appendChild(child);
        } else {
          render(node, child, i);
        }
      }
    }

    return node;
  }

  var parseSVG = function (el) {
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

    for (var i = 0; i < children.length; i++) {
      var child = children[i];

      if (child instanceof Node) {
        node.appendChild(child);
      } else if (typeof child === 'string') {
        node.appendChild(document.createTextNode(child));
      } else {
        render(node, child, i);
      }
    }

    return node;
  }

  var diff = function (parent, node, el) {
    var oldEl = node && node.el;

    var attrs = el.attrs;
    var oldAttrs = oldEl.attrs;

    var children = el.children;

    for (var attr in attrs) {
      var value = attrs[attr];
      var oldValue = oldAttrs[attr];

      if (value !== oldValue) {
        if (typeof value === 'object') {
          if (key === 'style') {
            for (var key in value) {
              node.style[key] = value[key];
            }
            for (var key in oldValue) {
              if (value[key] == null) {
                node.style[key] = '';
              }
            }
          } else if (key === 'class') {
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
            node[key] = value;
          }
        } else if (key === 'style' || (value == null && typeof value != 'function')) {
          node.setAttribute(key, value);
        } else {
          node[key] = value;
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

  var Li = function Li () {};

  Li.prototype.render = function render$1 (data) {
      var children = [], len = arguments.length - 1;
      while ( len-- > 0 ) children[ len ] = arguments[ len + 1 ];

    console.log('render', data);
    return el( 'li', { class: "item", onclick: this.onClick.bind(this) }, data.i)
  };
  Li.prototype.init = function init (data) {
      var children = [], len = arguments.length - 1;
      while ( len-- > 0 ) children[ len ] = arguments[ len + 1 ];

    console.log('created');
  };
  Li.prototype.update = function update (data) {
      var children = [], len = arguments.length - 1;
      while ( len-- > 0 ) children[ len ] = arguments[ len + 1 ];

    console.log('updated');
  };
  Li.prototype.mount = function mount () {
    console.log('mounted');
  };
  Li.prototype.unmount = function unmount () {
    console.log('unmounted');
  };
  Li.prototype.onClick = function onClick () {
    console.log(this);
  };

  var data = new Array(10);

  for (var i = 0; i < data.length; i++) {
    data[i] = i;
  }

  render(document.body, el( 'ul', null,
    data.map(function (i) { return el( Li, { i: i }); })
  ));

  setTimeout(function () {
    data.sort(function () { return Math.random() - 0.5; });

    render(document.body, el( 'ul', null,
      data.map(function (i) { return el( Li, { i: i }); })
    ));
  }, 1000);

  setTimeout(function () {
    data.sort(function () { return Math.random() - 0.5; });

    render(document.body, el( 'ul', null ));
  }, 2000);

}());