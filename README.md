# miniprogram-tools

- [@wiredcraft/miniprogram-swift-cli](https://github.com/wiredcraft/miniprogram-tools/tree/master/packages/swift-cli), miniprogram build CLI with sensible defaults
- [@wiredcraft/miniprogram-sparrow](https://github.com/wiredcraft/miniprogram-tools/tree/master/packages/sparrow), experimental [Recoil](https://github.com/facebookexperimental/Recoil) inspired state management
- [@wiredcraft/babel-plugin-import-regenerator](https://github.com/wiredcraft/miniprogram-tools/tree/master/packages/babel-plugin-import-regenerator), Babel plugin to import regenerator-runtime on demand

## Development

```bash
# install dependencies
yarn

# run this to build some packages
yarn lerna run prepare

# linking dependencies
yarn lerna bootstrap

# you probably need to run this if you encounter the error "swift" not found
ln -s $PWD/packages/swift-cli/dist/bin.js $PWD/node_modules/.bin/swift
```

## Publish

```bash
# bump version (it will bump version and create git tags)
yarn lerna version --conventional-commits --no-private

# publish to npm registry
yarn lerna publish from-package
```

