
import { el, render } from '../../rzr/src/index';

class Li {
  render(data, ...children) {
    console.log('render', data);
    return <li class="item" onclick={ this.onClick.bind(this) }>{ data.i }</li>
  }
  init(data, ...children) {
    console.log('created');
  }
  update(data, ...children) {
    console.log('updated');
  }
  mount() {
    console.log('mounted');
  }
  unmount() {
    console.log('unmounted');
  }
  onClick() {
    console.log(this);
  }
}

var data = new Array(10);

for (var i = 0; i < data.length; i++) {
  data[i] = i;
}

render(document.body, <ul>
  { data.map(i => <Li i={ i }></Li>) }
</ul>);

setTimeout(function () {
  data.sort(() => Math.random() - 0.5);

  render(document.body, <ul>
    { data.map(i => <Li i={ i }></Li>) }
  </ul>);
}, 1000);

setTimeout(function () {
  data.sort(() => Math.random() - 0.5);

  render(document.body, <ul></ul>);
}, 2000);
