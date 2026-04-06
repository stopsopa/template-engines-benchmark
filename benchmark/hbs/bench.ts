/**
 * PURPOSE:
 * This script benchmarks the Handlebars template engine's performance when executing a cached 
 * template function 1,000,000 times. It tracks total execution time, throughput (ops/sec), and peak memory usage (RSS).
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/hbs/bench.ts | tee benchmark/hbs/bench.log
 *    Expected Result: Prints performance statistics after completing 1 million executions.
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/hbs/bench.ts --test
 *    Expected Result: Renders the template once to stdout and exits. Used to verify template 
 *    correctness and consistency with the other benchmarks.
 * 
 * 3. Type-checking:
 *    node node_modules/.bin/tsc --noEmit --esModuleInterop benchmark/hbs/bench.ts
 * 
 * To compare output:
 * 
 NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
 NODE_OPTIONS="" node benchmark/hbs/bench.ts --test > benchmark/hbs/test.log
 diff benchmark/eta/test.log benchmark/hbs/test.log
 */
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";

// Customize Handlebars escape to match Eta/Lodash (&#39; instead of &#x27;)
// @ts-ignore
Handlebars.Utils.escapeExpression = function(string: any) {
  if (string === undefined || string === null) return "";
  if (typeof string !== 'string') string = String(string);
  return string.replace(/[&<>"']/g, function(s: string) {
    switch (s) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return s;
    }
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

  const templatePath = path.resolve(import.meta.dirname, "template.hbs");
  const templateString = fs.readFileSync(templatePath, "utf8");
  const compiledTemplate = Handlebars.compile(templateString);

  if (testMode) {
    const result = compiledTemplate({ it: data });
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
    await compiledTemplate({ it: data });
    if (i % 10000 === 0) updatePeakMemory();
  }

  const end: number = performance.now();
  updatePeakMemory();

  const timeTaken: number = end - start;

  console.log(JSON.stringify({
    engine: "Handlebars",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
