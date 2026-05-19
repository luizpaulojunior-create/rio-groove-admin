import fs from 'fs';
import { SourceMapConsumer } from 'source-map';

const mapFile = fs.readFileSync('./dist/assets/index-C6p51oW8.js.map', 'utf8');
const rawSourceMap = JSON.parse(mapFile);

SourceMapConsumer.with(rawSourceMap, null, consumer => {
  const sources = new Set();
  // The file has very few lines, likely most code is on a few lines.
  for (let l = 1; l <= 60; l++) {
    for (let c = 0; c < 20000; c += 10) {
      const pos = consumer.originalPositionFor({ line: l, column: c });
      if (pos.source && !pos.source.includes('node_modules')) {
        sources.add(`Line ${l}, Col ${c} -> ${pos.source}:${pos.line}`);
      }
    }
  }
  
  Array.from(sources).slice(0, 50).forEach(s => console.log(s));
});
