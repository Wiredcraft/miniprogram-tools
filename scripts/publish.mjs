#!/usr/bin/env zx

/// <reference types="zx/globals" />

/**
 * 解析当前 tag，自动发布对应版本的 package
 * @example tag=pkg@1.0.0
 */

const output = await $`git describe --tags`;
const tag = output.stdout;
const segments = tag.split('@');
const version = segments.pop();
const pkgName = segments.join('@');

console.log(`find package=${pkgName} version=${version}`);

const pkgJsonFilepathList = await glob(["**/package.json", "!node_modules"], {
  absolute: true
});

console.log('find package list:', pkgJsonFilepathList);

const pkgJsonFilepath = pkgJsonFilepathList.find(jsonPath => require(jsonPath).name === pkgName);

if (pkgJsonFilepath) {
  console.log(`find package in "${pkgJsonFilepath}"`);
  
  cd(path.dirname(pkgJsonFilepath));
  await $`npm publish`;
}
