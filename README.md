# Template Engines Benchmark

A performance-oriented experiment focused on benchmarking various JavaScript template engines and documenting critical findings. This repository aims to identify the fastest and simplest solutions, with a deep dive into optimization techniques like the Lodash `variable` option.

## 🚀 Key Findings

It turns out that **Lodash can be the fastest engine here**, which is pretty surprising.

The secret is the `variable` option. Normally, Lodash is slow because it uses an old `with` block. By turning on `variable`, you skip that and get a **3.5x speed boost**, putting Lodash at the top of the list.

```javascript
// Slow: uses 'with' (not recommended)
_.template("our template");

// Fast: 3.5x performance gain
_.template("our template", { variable: "data" });
```

Inconvenient aspect of that is that we have to always use :

```js

<%= data.name %>

// instead of:

<%= name %>

// which forces us to do:

const tmp = _.template('Hello <%= data.name %>', { variable: 'data' });

const html = tmp({ name: 'John' });

// instead of:

const tmp = _.template('Hello <%= name %>'); // <- shorter

const html = tmp({ name: 'John' });

```

Recomendation would be to define single letter variable:

```js
const tmp = _.template("Hello <%= d.name %>", { variable: "d" });

const html = tmp({ name: "John" });
```

.. that should make it more reasonable/convenient to use.

## 📊 Details & results

- 📝 **[benchmark/summary.log](benchmark/summary.log)**: The latest raw results from our automated benchmark runs.
- 📖 **[benchmark/README.md](benchmark/README.md)**: Detailed analysis and conclusions regarding the results.
- ⚙️ **Manual Workflow**: This benchmark can be triggered manually via GitHub Actions to verify performance across different environments.
