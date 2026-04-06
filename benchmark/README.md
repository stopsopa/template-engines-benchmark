
This is expermiment to find fastest simplest template engine

see benchmark/summary.log for results

see benchmark/all.sh for how to run the benchmark

# conclusion

It seems specifying

```js

_.template('our template', {variable: 'data'})

```

gives bigger performance gain





Doing:

```js

_.template('our template')


```

will cause our template compiler to fall into this if statement

```js

if (!variable) {
    source = 'with (obj) {\n' + source + '\n}\n';
}

```

>
> [!NOTE]
> Place in the code [https://github.com/stopsopa/template-engines-benchmark/blob/8239c5fd141810c995e3949ca9d2c8a2bb796e66/benchmark/all.sh#L56](https://github.com/stopsopa/template-engines-benchmark/blob/8239c5fd141810c995e3949ca9d2c8a2bb796e66/benchmark/all.sh#L56)
>

and that will surround our compiled code with 

```js

with (obj) {
    ... our template code ...
}

```

>
> [!NOTE]
> More about [with](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with)
>


which is for some reason much slower

up to even 4.5x slower

Actually on the MDN page it is stated clarly that this feature is deprecated and it is not recommended to use it.

Probably because of that it lacks proper optimization on the JIT level. Hence worse performance.


