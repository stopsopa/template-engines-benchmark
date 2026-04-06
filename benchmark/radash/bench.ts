/**
 * PURPOSE:
 * This script benchmarks the Radash 'template()' utility function.
 * It is a simple string interpolation tool that replaces {{key}} markers.
 * Since it does NOT support loops, conditionals, or automatic escaping,
 * we must pre-process the data to achieve output parity with other engines.
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/radash/bench.ts | tee benchmark/radash/bench.log
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/radash/bench.ts --test
 * 
 * To compare output:
 * 
 NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
 NODE_OPTIONS="" node benchmark/radash/bench.ts --test > benchmark/radash/test.log
 diff benchmark/eta/test.log benchmark/radash/test.log
 */
import { template } from "radash";
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

  // Pre-process escaping and flattened loop content into a format Radash can handle.
  // Note: This pre-processing is done ONCE outside the loop to benchmark pure interpolation speed.
  const escapedData: Record<string, string> = {
    "it.v1": escape(data.v1),
    "it.v2": escape(data.v2),
    "it.v3": escape(data.v3),
    "it.v4": escape(data.v4),
    "it.v5": escape(data.v5),
    "it.v6": escape(data.v6),
    "it.r1": data.r1,
    "it.r2": data.r2,
    "it.r3": data.r3,
    "it.r4": data.r4,
    "it.r5": data.r5,
    "it.r6": data.r6,
  };

  // Manually construct the repeated item list that normally comes from the loop in Eta
  let loopContent = "";
  for (let k = 0; k < 6; k++) {
    loopContent += "\n  \n";
    for (const item of data.items) {
      loopContent += "    Item: " + escape(item) + "\n  \n";
    }
  }
  escapedData.loop = loopContent;

  const templateStr = `{{it.v1}} {{it.v2}} {{it.v3}} {{it.v4}} {{it.v5}} {{it.v6}}
{{it.r1}} {{it.r2}} {{it.r3}} {{it.r4}} {{it.r5}} {{it.r6}}
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
    engine: "Radash",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
