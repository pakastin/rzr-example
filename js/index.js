
import { el, list, render } from 'rzr';

var REFRESH_RATE = 0;

class Item {
  render({ width, height, i }) {
    return <div class="card">
      <div style={ `width: ${width}px; height: ${height}px; background-image: url(https://unsplash.it/${width}/${height})` } />
      <p>
        Image { i }
      </p>
    </div>
  }
}

class Main {
  render({ items }) {
    return <div class="app">
      <p>
        <a href="https://github.com/pakastin/rzr-example">Source</a>
      </p>
      <div class="speed">
        <button onclick={ this.minRate.bind(this) }>Min</button>
        <input oninput={ this.onRefreshRate } type="range" min="0" max="100" value="0" />
        <button onclick={ this.maxRate.bind(this) }>Max</button>
      </div>
      { list(Item, items, 'i') }
    </div>
  }
  init () {
    this.range = this.dom.querySelector('input[type="range"]');
  }
  minRate() {
    this.range.value = REFRESH_RATE = 0;
  }

  onRefreshRate() {
    REFRESH_RATE = this.value;
  }

  maxRate() {
    this.range.value = REFRESH_RATE = 100;
  }
}

var data = new Array(50);

for (var i = 0; i < data.length; i++) {
  data[i] = {
    i,
    width: Math.random() * 75 + 75 | 0,
    height: Math.random() * 75 + 75 | 0
  };
}

(function update () {
  var LEN = Math.random() * 25 + 25 | 0;

  render(document.body, <Main items={ data.slice(0, LEN) }></Main>);
  data.sort(() => Math.random() - 0.5);

  if (REFRESH_RATE < 100) {
    setTimeout(update, 1000 - REFRESH_RATE * 10);
  } else {
    requestAnimationFrame(update);
  }
})();
