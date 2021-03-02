import { atom, write } from "./atom";

global.wx = {
  nextTick: process.nextTick.bind(process),
};

const sleep = (t: number) => new Promise((r) => setTimeout(r, t));

describe("atom", () => {
  test("can create primitive value atom", () => {
    const a = atom("hello");
    expect(a.read()).toBe("hello");
  });

  test("can chain atoms", () => {
    const first = atom("first");
    const last = atom("last");
    const full = atom<string>((get) => {
      const f = get(first);
      const l = get(last);
      return f + " " + l;
    });
    expect(full.read()).toBe("first last");
  });

  test("can write to primitive value atom", () => {
    const a = atom("hello");
    write(a, "world");
    expect(a.read()).toBe("world");
  });

  test("can write to chain starter atom", () => {
    const first = atom("first");
    const last = atom("last");
    const full = atom<string>((get) => {
      const f = get(first);
      const l = get(last);
      return f + " " + l;
    });
    expect(full.read()).toBe("first last");
    write(first, "1");
    expect(full.read()).toBe("1 last");
  });

  test("can subscribe to single atom", async () => {
    const a = atom("hello");

    // subscribe
    const setData = jest.fn();
    a.subscribe({ setData }, "a.b");

    // commit the change
    write(a, "world");

    // setData is called in the next tick
    await sleep(0);
    expect(setData).toHaveBeenCalledWith({ "a.b": "world" });
    expect(a.read()).toBe("world");
  });

  test("can subscribe to chained atom", async () => {
    const first = atom("first");
    const last = atom("last");
    const full = atom<string>((get) => {
      const f = get(first);
      const l = get(last);
      return f + " " + l;
    });

    // subscribe
    const setData = jest.fn();
    full.subscribe({ setData }, "full.name");

    // before change
    expect(full.read()).toBe("first last");

    // commit the change
    write(first, "1");

    // setData is called in the next tick
    await sleep(0);
    expect(setData).toHaveBeenCalledWith({ "full.name": "1 last" });
    expect(full.read()).toBe("1 last");
  });

  test("setData should be batched", async () => {
    // a0 a1 are data of "component" a
    // b0 b1 are data of "component" b
    const a0 = atom("a0");
    const b0 = atom(1);
    const a1 = atom(2);
    const b1 = atom("b1");

    // subscribe
    const setDataA = jest.fn();
    const componentA = { setData: setDataA };
    a0.subscribe(componentA, "a0");
    a1.subscribe(componentA, "a1");
    const setDataB = jest.fn();
    const componentB = { setData: setDataB };
    b0.subscribe(componentB, "b0");
    b1.subscribe(componentB, "b1");

    // commit changes
    write(a0, "a0+");
    write(b0, 100);
    write(a1, 200);
    write(b1, "b1+");

    // setData is called in the next tick
    await sleep(0);
    expect(setDataA).toHaveBeenCalledWith({ a0: "a0+", a1: 200 });
    expect(setDataB).toHaveBeenCalledWith({ b0: 100, b1: "b1+" });
    expect(a0.read()).toBe("a0+");
    expect(a1.read()).toBe(200);
    expect(b0.read()).toBe(100);
    expect(b1.read()).toBe("b1+");
  });
});
