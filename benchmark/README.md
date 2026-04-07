
This is an experiment to find the fastest and simplest template engine.

See [summary.log](summary.log) for results.

See [all.sh](all.sh) for details on how to run the benchmark.

# Conclusion

It seems that specifying the `variable` option in `_.template`:

```js
_.template('our template', {variable: 'data'})
```

gives the biggest performance gain of all the things I've tried.

When this option is enabled, `lodash/template` consistently ranks at or near the top of the benchmark, delivering top-tier performance.

Doing:

```js
_.template('our template')
```

will cause the template compiler to enter this `if` statement:

```js
if (!variable) {
    source = 'with (obj) {\n' + source + '\n}\n';
}
```

> [!NOTE]
> See the code here: [lodash/template.js](https://github.com/stopsopa/template-engines-benchmark/blob/8239c5fd141810c995e3949ca9d2c8a2bb796e66/benchmark/all.sh#L56)

This surrounds the compiled code with a `with` block:

```js
with (obj) {
    // ... our template code ...
}
```

> [!NOTE]
> Read more about the [with statement on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with)

Using `with` is significantly slower—more than 3.5x slower in benchmarks.

MDN clearly states that this feature is deprecated and its use is not recommended. 

> [!IMPORTANT]
> My guess is that because it is deprecated, it lacks proper JIT-level optimization, resulting in worse performance.

# Benchmark Results

See `lodash-original-noit` and `lodash-original-it` in [summary.log](summary.log), where:

- `lodash-original-noit`: uses `_.template('our template')` -> [template](/benchmark/lodash/bench-template.html)
- `lodash-original-it`: uses `_.template('our template', {variable: 'd'})` (benchmarking the `variable` option) -> [template](/benchmark/lodash/bench-template.it.html)
