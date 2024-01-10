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
      report: async () => {
        console.warn("report is not init");
      },
      sendBean: () => {
        console.warn("sendBean is not init");
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

  const highPriorityPlugins = globalOptions.plugins.filter(
    (plugin) => plugin.priority === "high"
  );
  const normalPriorityPlugins = globalOptions.plugins.filter(
    (plugin) => plugin.priority === "normal"
  );
  const lowPriorityPlugins = globalOptions.plugins.filter(
    (plugin) => plugin.priority === "low"
  );

  const loadPlugins = (plugins: ReturnType<DarePlugin>[]) => {
    const beforeHooks = plugins.map((plugin) => plugin.before);
    beforeHooks.forEach((beforeFn) => {
      beforeFn && beforeFn(globalOptions.context);
    });

    const mainHooks = plugins.map((plugin) => plugin.main);
    mainHooks.forEach((mainFn) => {
      const result = mainFn && mainFn(globalOptions.context);
      if (typeof result === "function") {
        mainEffects.push(result);
      }
    });
  }

  loadPlugins(highPriorityPlugins);
  loadPlugins(normalPriorityPlugins);
  loadPlugins(lowPriorityPlugins);
  

  if (NODE_ENV === "development") {
    // @ts-expect-error
    window.mainEffects = mainEffects;
  }
};

export * from "./core";
export * from "./plugins";
