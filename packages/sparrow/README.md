## Install

```bash
yarn add @wiredcraft/miniprogram-sparrow
```

## Usage

```javascript
// store/name.js

import { atom } from "sparrow";

export const firstName = atom("Jack");

// the action
export function updateFirstName(name) {
  write(firstName, name);
}
```

```javascript
// components/hello.js
import { write, behavior as sparrow } from "sparrow";
import { firstName, updateFirstName } from "./store/name";

Component({
  atoms: { firstName },

  behaviors: [sparrow],
  lifetimes: {
    attached() {
      console.log(this.firstName);
    },
  },
  methods: {
    handleButtonOnTap() {
      updateFirstName("Rose");
    },
  },
});
```

## Publish

to NPM & GPM(GITHUB Package Registry)