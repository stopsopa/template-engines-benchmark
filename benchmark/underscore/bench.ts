/**
 * PURPOSE:
 * This script benchmarks the Underscore.js template engine's performance when executing a cached 
 * template function 1,000,000 times. It tracks total execution time, throughput (ops/sec), and peak memory usage (RSS).
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/underscore/bench.ts | tee benchmark/underscore/bench.log
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/underscore/bench.ts --test
 * 
 * To compare output:
 * 
 NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
 NODE_OPTIONS="" node benchmark/underscore/bench.ts --test > benchmark/underscore/test.log
 diff benchmark/eta/test.log benchmark/underscore/test.log
 */
import _ from "underscore";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";

// Customize Underscore escape to match Eta/Lodash (&#39; instead of &#x27;)
// @ts-ignore
const entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// @ts-ignore
_.escape = function (text: any) {
  return String(text).replace(/[&<>"']/g, function (s) {
    // @ts-ignore
    return entityMap[s];
  });
};

(async function () {
  const count: number = 1_000_000;
  const testMode: boolean = process.argv.includes("--test");

  interface TemplateData {
    v1: string;
    v2: string;
    v3: string;
    v4: string;
    v5: string;
    v6: string;
    r1: string;
    r2: string;
    r3: string;
    r4: string;
    r5: string;
    r6: string;
    items: string[];
  }

  const data: TemplateData = {
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

  // Configure Underscore to match bench-template.html (Eta/Lodash style)
  _.templateSettings.escape = /<%=([\s\S]+?)%>/g;
  _.templateSettings.interpolate = /<%~([\s\S]+?)%>/g;
  _.templateSettings.evaluate = /<%([\s\S]+?)%>/g;

  const templatePath = path.resolve(import.meta.dirname, "../bench-template.html");
  const templateString = fs.readFileSync(templatePath, "utf8");
  const compiledTemplate = _.template(templateString, { variable: "it" });

  if (testMode) {
    process.stdout.write(compiledTemplate(data));
    process.exit(0);
  }

  let peakMemory: number = 0;
  const updatePeakMemory = (): void => {
    const memory = process.memoryUsage().rss;
    if (memory > peakMemory) peakMemory = memory;
  };

  const start: number = performance.now();

  for (let i = 0; i < count; i++) {
    compiledTemplate(data);
    if (i % 10000 === 0) updatePeakMemory();
  }

  const end: number = performance.now();
  updatePeakMemory();

  const timeTaken: number = end - start;

  console.log(JSON.stringify({
    engine: "Underscore",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
