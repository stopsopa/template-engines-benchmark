/**
 * PURPOSE:
 * This script benchmarks the Squirrelly template engine.
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/squirrelly/bench.ts | tee benchmark/squirrelly/bench.log
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/squirrelly/bench.ts --test
 * 
 * To compare output:
 * 
  NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
  NODE_OPTIONS="" node benchmark/squirrelly/bench.ts --test > benchmark/squirrelly/test.log
  diff benchmark/eta/test.log benchmark/squirrelly/test.log
  
 */
import squirrelly from "squirrelly";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";

(async function () {
  const count: number = 1_000_000;
  const testMode: boolean = process.argv.includes("--test");

  const data = {
    v1: "<script>alert('xss1')</script>",
    v2: "<b>bold2</b>",
    v3: "<i>italic3</i>",
    v4: "<u>underline4</u>",
    v5: "<s>strikethrough5</s>",
    v6: "<span>span6</span>",
    r1: "raw1",
    r2: "raw2",
    r3: "raw3",
    r4: "raw4",
    r5: "raw5",
    r6: "raw6",
    items: ["A", "B", "C"],
    loopSix: [1, 2, 3, 4, 5, 6], // To emulate the for k=0;k<6 natively via @each
  };

  const templatePath = path.resolve(import.meta.dirname, "template.sqrl");
  const templateString = fs.readFileSync(templatePath, "utf8");

  const config = squirrelly.getConfig({ autoTrim: false });

  const compiledTemplate = squirrelly.compile(templateString, config);

  if (testMode) {
    const result = compiledTemplate(data, config);
    process.stdout.write(result);
    process.exit(0);
  }

  let peakMemory: number = 0;
  const updatePeakMemory = (): void => {
    const memory = process.memoryUsage().rss;
    if (memory > peakMemory) peakMemory = memory;
  };

  const start: number = performance.now();

  for (let i = 0; i < count; i++) {
    compiledTemplate(data, config);
    if (i % 10000 === 0) updatePeakMemory();
  }

  const end: number = performance.now();
  updatePeakMemory();

  const timeTaken: number = end - start;

  console.log(JSON.stringify({
    engine: "Squirrelly",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
