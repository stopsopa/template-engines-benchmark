/**
 * PURPOSE:
 * This script benchmarks a CUSTOM, minimal template engine built from scratch.
 * It supports:
 * - <%= ... %> for HTML escaped output
 * - <%- ... %> (or <%~ ...) for raw output
 * - <% ... %> for arbitrary JavaScript execution
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/custom/bench.ts | tee benchmark/custom/bench.log
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/custom/bench.ts --test
 * 
 * 3. Add to the full suite:
 *    Add to benchmark/all.sh
 * 
 * To compare output:
 * 
 NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
 NODE_OPTIONS="" node benchmark/custom/bench.ts --test > benchmark/custom/test.log
 diff benchmark/eta/test.log benchmark/custom/test.log
 */
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";

/**
 * Super lightweight template engine
 */
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

// Faster than standard Regex replace for compilation
function compile(template: string) {
  let body = "let out = '';\n";
  body += "const it = $it;\n";
  body += "out += '";

  const parts = template.split(/(<%-[\s\S]+?%>|<%~[\s\S]+?%>|<%=[\s\S]+?%>|<%[\s\S]+?%>)/);

  for (const part of parts) {
    if (part.startsWith("<%=")) {
      // Escaped
      const code = part.slice(3, -2).trim();
      body += "'; out += escape(" + code + "); out += '";
    } else if (part.startsWith("<%-") || part.startsWith("<%~")) {
      // Raw
      const code = part.slice(3, -2).trim();
      body += "'; out += (" + code + "); out += '";
    } else if (part.startsWith("<%")) {
      // Execution
      const code = part.slice(2, -2).trim();
      body += "'; " + code + "; out += '";
    } else {
      // Literal
      body += part
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
    }
  }

  body += "';\nreturn out;";

  // console.log("Compiled Body:\n", body); // For debugging
  
  return new Function("$it", "escape", body);
}

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
  const templateString = fs.readFileSync(templatePath, "utf8");

  const compiledTemplate = compile(templateString);

  if (testMode) {
    const result = compiledTemplate(data, escape);
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
    compiledTemplate(data, escape);
    if (i % 10000 === 0) updatePeakMemory();
  }

  const end: number = performance.now();
  updatePeakMemory();

  const timeTaken: number = end - start;

  console.log(JSON.stringify({
    engine: "Custom",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
