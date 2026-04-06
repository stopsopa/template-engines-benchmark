/**
 * PURPOSE:
 * This script benchmarks the es-toolkit 'template()' utility function.
 * es-toolkit provides a drop-in replacement for Lodash's _.template via compat.
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/es-toolkit/bench.ts | tee benchmark/es-toolkit/bench.log
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/es-toolkit/bench.ts --test
 * 
 * To compare output:
 * 
 NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
 NODE_OPTIONS="" node benchmark/es-toolkit/bench.ts --test > benchmark/es-toolkit/test.log
 diff benchmark/eta/test.log benchmark/es-toolkit/test.log
 */
import { template } from "es-toolkit/compat";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";

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

  const templatePath = path.resolve(import.meta.dirname, "../bench-template.html");
  const templateString = fs.readFileSync(templatePath, "utf8");
  
  // Unlike Lodash, we may need to specify interpolation options or variable names
  // However, es-toolkit's template is a direct drop-in for _.template.
  // We'll set the variable name to "it" inside the template call.
  const compiledTemplate = template(templateString, { 
    variable: "it",
    // Config to match Eta V3: <%= escaped, <%~ raw
    escape: /<%=([\s\S]+?)%>/g,
    interpolate: /<%~([\s\S]+?)%>/g,
    evaluate: /<%([\s\S]+?)%>/g
  });

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
    engine: "es-toolkit",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
