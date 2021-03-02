export default {
  clearMocks: true,
  restoreMocks: true,
  moduleDirectories: ["node_modules", "<rootDir>"],
  // setupFiles: ["./test/setup.ts"],
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)s$": "esbuild-jest",
  },
};
