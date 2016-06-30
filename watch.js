
var watch = require('@pakastin/watch');

watch('../rzr/src/*.js', 'npm run build-js');
watch('js/**/*.js', 'npm run build-js', true);
