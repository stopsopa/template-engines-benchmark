/**
 * PURPOSE:
 * This script benchmarks the typetify 'template()' utility function.
 * Since it only supports basic {{key}} interpolation without loops or conditions,
 * it is pre-processed similar to Radash to allow parity benchmarking.
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/typetify/bench.ts | tee benchmark/typetify/bench.log
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/typetify/bench.ts --test
 * 
 * To compare output:
 * 
  NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
  NODE_OPTIONS="" node benchmark/typetify/bench.ts --test > benchmark/typetify/test.log
  diff benchmark/eta/test.log benchmark/typetify/test.log
  
 */
import { template } from "typetify";
import { performance } from "perf_hooks";

// Manual escape for parity output (matching Eta/Lodash standard)
const entityMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escape = (text: any): string => {
  return String(text).replace(/[&<>"']/g, (s) => entityMap[s] || s);
};

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
  };

  // Pre-process escaping and flattened loop content into a format typetify can handle.
  // Note: typetify's template only supports simple keys, we can't use '.' in the keys
  const escapedData: Record<string, string> = {
    v1: escape(data.v1),
    v2: escape(data.v2),
    v3: escape(data.v3),
    v4: escape(data.v4),
    v5: escape(data.v5),
    v6: escape(data.v6),
    r1: data.r1,
    r2: data.r2,
    r3: data.r3,
    r4: data.r4,
    r5: data.r5,
    r6: data.r6,
  };

  // Manually construct the repeated item list that normally comes from the loop
  let loopContent = "";
  for (let k = 0; k < 6; k++) {
    loopContent += "\n  \n";
    for (const item of data.items) {
      loopContent += "    Item: " + escape(item) + "\n  \n";
    }
  }
  escapedData.loop = loopContent;

  const templateStr = `{{v1}} {{v2}} {{v3}} {{v4}} {{v5}} {{v6}}
{{r1}} {{r2}} {{r3}} {{r4}} {{r5}} {{r6}}
{{loop}}`;

  if (testMode) {
    const result = template(templateStr, escapedData);
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
    template(templateStr, escapedData);
    if (i % 10000 === 0) updatePeakMemory();
  }

  const end: number = performance.now();
  updatePeakMemory();

  const timeTaken: number = end - start;

  console.log(JSON.stringify({
    engine: "Typetify",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
