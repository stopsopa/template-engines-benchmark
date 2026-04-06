/**
 * PURPOSE:
 * This script benchmarks the doT.js 'dot' fast template engine.
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/dot/bench.ts | tee benchmark/dot/bench.log
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/dot/bench.ts --test
 * 
 * To compare output:
 * 
  NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
  NODE_OPTIONS="" node benchmark/dot/bench.ts --test > benchmark/dot/test.log
  diff benchmark/eta/test.log benchmark/dot/test.log
  
 */
import dot from "dot";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";

// Override dot HTML encoding engine to match benchmark Eta output parameters exactly
dot.encodeHTMLSource = function(doNotSkipEncoded) {
  return function(code) {
    const r = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return code ? code.toString().replace(/[&<>"']/g, (m) => r[m] || m) : "";
  };
};

// Map delimiters appropriately to standard
dot.templateSettings.interpolate = /<%~([\s\S]+?)%>/g;
dot.templateSettings.encode = /<%=([\s\S]+?)%>/g;
dot.templateSettings.evaluate = /<%([^=~-][\s\S]*?)%>/g;
dot.templateSettings.varname = "it";
dot.templateSettings.strip = false;

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

  const templatePath = path.resolve(import.meta.dirname, "../bench-template.html");
  let templateString = fs.readFileSync(templatePath, "utf8");
  
  // doT strips evaluate block newlines which causes syntax errors for things like `forEach(function(){})`
  // when doT blindly appends `out+='...'` on the same line. Appending a trailing semicolon fixes this.
  templateString = templateString.replace(/}\) %>/g, "}) ; %>");

  const compiledTemplate = dot.template(templateString);

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
    engine: "doT.js",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
