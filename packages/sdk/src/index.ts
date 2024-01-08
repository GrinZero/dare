/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { DarePlugin, DareContext } from "./type";

// @ts-expect-error
const NODE_ENV = import.meta.env.MODE;

export type InitOptions = {
  plugins: ReturnType<DarePlugin>[];
  context: DareContext;
};
const initOptions = (): InitOptions => ({
  plugins: [],
  context: {
    state: {},
    core: {
      report: () => {
        console.warn("report is not init");
      },
    },
  },
});

export let globalOptions: InitOptions = initOptions();

const mainEffects: Function[] =
  // @ts-expect-error
  NODE_ENV === "development" ? window.mainEffects || [] : [];

export const init = (options: Omit<InitOptions, "context">) => {
  mainEffects.forEach((fn) => fn());

  globalOptions = initOptions();
  Object.assign(globalOptions, options);

  const beforeHooks = globalOptions.plugins.map((plugin) => plugin.before);
  beforeHooks.forEach((beforeFn) => {
    beforeFn && beforeFn(globalOptions.context);
  });

  const mainHooks = globalOptions.plugins.map((plugin) => plugin.main);
  mainHooks.forEach((mainFn) => {
    const result = mainFn && mainFn(globalOptions.context);
    if (typeof result === "function") {
      mainEffects.push(result);
    }
  });
  if(NODE_ENV === "development") {
    // @ts-expect-error
    window.mainEffects = mainEffects;
  }
};

export * from "./core";
export * from "./plugins";
