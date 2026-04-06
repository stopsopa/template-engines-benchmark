/**
 * PURPOSE:
 * This script aggregates JSON benchmark results from stdin, sorts them by performance (Ops/sec),
 * and prints a formatted summary table to the terminal.
 * 
 * USAGE:
 * cat benchmark/*\/bench.log | grep '{' | node benchmark/summary.ts
 */
import readline from "readline";

interface BenchmarkResult {
  engine: string;
  executions: number;
  timeMs: number;
  opsPerSec: number;
  peakRSS: number;
}

const results: BenchmarkResult[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

rl.on("line", (line) => {
  try {
    // Find the JSON part in the line (in case there's extra text)
    const start = line.indexOf("{");
    const end = line.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      const jsonStr = line.substring(start, end + 1);
      const data: BenchmarkResult = JSON.parse(jsonStr);
      results.push(data);
    }
  } catch (e) {
    // Skip invalid lines
  }
});

rl.on("close", () => {
  if (results.length === 0) {
    console.log("No benchmark results found.");
    return;
  }

  // Sort by Ops/sec descending
  results.sort((a, b) => b.opsPerSec - a.opsPerSec);

  console.log("\n" + "=".repeat(85));
  console.log(
    "ENGINE".padEnd(25) + 
    "OPS/SEC".padStart(15) + 
    "TIME (ms)".padStart(15) + 
    "PEAK RSS (MB)".padStart(15) + 
    "EXECUTIONS".padStart(15)
  );
  console.log("-".repeat(85));

  results.forEach((r) => {
    console.log(
      r.engine.padEnd(25) + 
      r.opsPerSec.toLocaleString().padStart(15) + 
      r.timeMs.toFixed(2).padStart(15) + 
      r.peakRSS.toFixed(2).padStart(15) + 
      r.executions.toLocaleString().padStart(15)
    );
  });
  console.log("=".repeat(85) + "\n");
});
