import type { DarePlugin } from "./type";

export type InitOptions = {
  plugins: ReturnType<DarePlugin>[];
  context: unknown;
};
export const globalOptions: InitOptions = {
  plugins: [],
  context: {},
};

export const init = (options: Omit<InitOptions, "context">) => {
  Object.assign(globalOptions, options);
  globalOptions.plugins.forEach((plugin) => plugin(globalOptions.context));
};

export * from "./error";
