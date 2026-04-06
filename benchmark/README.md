
This is expermiment to find fastest simplest template engine

see benchmark/summary.log for results

see benchmark/all.sh for how to run the benchmark

# conclusion

It seems specifying

```
_.template('our template', {variable: 'data'})

```

gives bigger performance gain


(More about it [https://github.com/stopsopa/template-engines-benchmark/blob/8239c5fd141810c995e3949ca9d2c8a2bb796e66/benchmark/all.sh#L56](https://github.com/stopsopa/template-engines-benchmark/blob/8239c5fd141810c995e3949ca9d2c8a2bb796e66/benchmark/all.sh#L56))


Doing:

```

_.template('our template')


```

will cause our template compiler to fall into this if statement

```
if (!variable) {
    source = 'with (obj) {\n' + source + '\n}\n';
}
```
and that will surround our code with 

```
with (obj) {
    ... our template code ...
}
```

(more about [with](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with))

which is for some reason much slower

up to even 4.5x slower


