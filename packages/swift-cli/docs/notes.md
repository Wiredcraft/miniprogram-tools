## Use pug

You can use [pug](https://pugjs.org/language/attributes.html) template for wxml.

## Unescape Attributes

To achieve something like:

```xml
<view class="hello" wx:if="{{ a && b }}">world</view>
```

You will need to [escape the attribute value](https://pugjs.org/language/attributes.html#unescaped-attributes) use `!=` instead of `=` like:

```pug
view.hello(wx:if!="{{ a && b }}") world
```

## Use Less

### Use wxss Runtime Import

```less
// abc.less
@import (css) "/common.wxss";
```

The output will be:

```css
// abc.wxss
@import "/common.wxss";
```

### Use Less Import

Given file structure:

```
src/
  _less/a.less
  components/
    b/b.less
    c/c.less
```

file content:

```less
// src/_less/a.less
.a {
  color: red;
}

// src/components/b/b.less
.b {
  font-size: 1.25em;
}
```

in `src/components/c/c.less` you can import like:

```less
// src/components/c/c.less
@import "_less/a";
@import "components/b/b";
```

**Note**, if you have less files that doesn't not produce concrete css content, it's recommended to put them in `_less` directory since they are ignored in the build process.
