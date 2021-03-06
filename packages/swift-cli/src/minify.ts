import { minify, MinifyOptions } from "terser";

export async function transform(code: string, opt?: Partial<MinifyOptions>) {
  const options = {
    toplevel: true,
    mangle: true,
    safari10: true,
    compress: { passes: 2 },
    output: {
      comments: false,
    },
    ...opt,
  };
  return await minify(code, options);
}
