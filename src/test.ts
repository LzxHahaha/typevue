const path = require('path');
const sfcReader = require('./SfcReader').default;

const { template, script, styles } = sfcReader(path.resolve(__dirname, '../../test/test.vue'), '123', require('../../test/config.json'));
console.log(script);

console.log(script);
