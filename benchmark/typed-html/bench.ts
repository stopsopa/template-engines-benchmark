/**
 * PURPOSE:
 * This script benchmarks the 'typed-html' (3.0.1) rendering performance.
 * It uses 'createElement' to build the same structure as the core benchmark.
 * 
 * USAGE:
 * 1. Run the benchmark:
 *    NODE_OPTIONS="" node benchmark/typed-html/bench.ts | tee benchmark/typed-html/bench.log
 * 
 * 2. Run in test mode:
 *    NODE_OPTIONS="" node benchmark/typed-html/bench.ts --test
 * 
 * To compare output:
 * 
 NODE_OPTIONS="" node benchmark/eta/bench.ts --test > benchmark/eta/test.log
 NODE_OPTIONS="" node benchmark/typed-html/bench.ts --test > benchmark/typed-html/test.log
 diff benchmark/eta/test.log benchmark/typed-html/test.log
 */
import { createElement } from "typed-html";
import { performance } from "perf_hooks";

// Manual escape function to match project standard (since typed-html 3.0.x doesn't escape children)
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

  // Functional component to replicate bench-template.html
  // We use a custom 'Fragment' tag that just joins children to avoid extra DIV wrappers
  const Fragment = (props: any) => props.children.join('');

  const App = (it: TemplateData) => {
    // To match Eta's whitespace exactly, we build the pieces.
    // Note: typed-html adds \n between children, so we'll do one large string if needed or handle it.
    // However, for this benchmark, we aim for FUNCTION OVERHEAD.
    
    const itemsLoop = [];
    for (let k = 0; k < 6; k++) {
      // In Eta, each iteration has a newline before and after
      itemsLoop.push("\n  \n");
      for (const item of it.items) {
        itemsLoop.push("    Item: " + escape(item) + "\n  \n");
      }
    }

    return createElement(Fragment, {}, 
      escape(it.v1), " ", escape(it.v2), " ", escape(it.v3), " ", escape(it.v4), " ", escape(it.v5), " ", escape(it.v6), "\n",
      it.r1, " ", it.r2, " ", it.r3, " ", it.r4, " ", it.r5, " ", it.r6, "\n",
      ...itemsLoop
    );
  };

  if (testMode) {
    const result = App(data);
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
    App(data);
    if (i % 10000 === 0) updatePeakMemory();
  }

  const end: number = performance.now();
  updatePeakMemory();

  const timeTaken: number = end - start;

  console.log(JSON.stringify({
    engine: "Typed-HTML",
    executions: count,
    timeMs: parseFloat(timeTaken.toFixed(2)),
    opsPerSec: Math.round(count / (timeTaken / 1000)),
    peakRSS: parseFloat((peakMemory / 1024 / 1024).toFixed(2))
  }));
})();
