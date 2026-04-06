/**
 * PURPOSE:
 * This script benchmarks the 'thunder' (0.2.0) template engine.
 * It uses the 'compile' API to benchmark a pre-compiled template function.
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/thunder/bench.ts | tee benchmark/thunder/bench.log
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/thunder/bench.ts --test
 * 
 * To compare output:
 * 
 NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
 NODE_OPTIONS="" node benchmark/thunder/bench.ts --test > benchmark/thunder/test.log
 diff benchmark/eta/test.log benchmark/thunder/test.log
 */
import thunder from "thunder";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";

// Monkey-patch Thunder's escape logic to match project standard (&#39; for ')
// Thunder's escape object is exported or at least part of the lib.
// From lib/thunder.js, it's a closure object but shared?
// Let's check if we can modify it.
// Actually, it uses 'escape.fn' inside the returned function from 'compile'.

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

  const templatePath = path.resolve(import.meta.dirname, "template.thunder");
  const templateString = fs.readFileSync(templatePath, "utf8");
  const compiledTemplate = thunder.compile(templateString);

  if (testMode) {
    const result = compiledTemplate(data);
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
    compiledTemplate(data);
    if (i % 10000 === 0) updatePeakMemory();
  }

  const end: number = performance.now();
  updatePeakMemory();

  const timeTaken: number = end - start;

  console.log(JSON.stringify({
    engine: "Thunder",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
