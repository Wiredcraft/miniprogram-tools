declare namespace NodeJS {
  interface Global {
    wx: {
      // nextTick(): void;
      nextTick(callback: () => void, ...args: any[]): void;
    };
  }
}
