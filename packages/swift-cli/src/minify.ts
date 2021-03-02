import { minify } from "terser";

export async function transform(code: string) {
  const options = {
    // mangle: { toplevel: true },
    mangle: true,
    safari10: true,
    compress: { passes: 2 },
    output: {
      comments: false,
    },
  };
  return await minify(code, options);
}
