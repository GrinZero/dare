/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/ban-ts-comment */
import type { DarePlugin, DareContext } from './type';
import { envPlugin, reportPlugin } from './core';

// @ts-expect-error
const NODE_ENV = import.meta.env.MODE;

export type InitOptions = {
  plugins: ReturnType<DarePlugin>[];
  reporter: Parameters<typeof reportPlugin>[0];
  envOptions?: Parameters<typeof envPlugin>[0];
};
export type DareOptions = {
  context: DareContext;
  plugins: ReturnType<DarePlugin>[];
};
const initOptions = () => {
  const base = {
    plugins: [],
    context: {
      state: {},
      core: {
        report: async () => {
          console.warn('report is not init');
        },
        sendBean: () => {
          console.warn('sendBean is not init');
        },
      },
    },
  };
  return base as unknown as DareOptions;
};

export let globalOptions: DareOptions = initOptions();

const mainEffects: Function[] =
  // @ts-expect-error
  NODE_ENV === 'development' ? window.mainEffects || [] : [];

export const defineConfig = async (options: InitOptions) => {
  mainEffects.forEach((fn) => fn());

  globalOptions = initOptions();

  const { plugins: optionPlugins, envOptions, reporter } = options;
  Object.assign(globalOptions, {
    plugins: optionPlugins,
  });

  const plugins = globalOptions.plugins;

  globalOptions.context.core.sessionID =
    'crypto' in window
      ? crypto.randomUUID()
      : `S` + Math.random().toString(36).slice(2);
  const reportPluginInstance = reportPlugin(reporter);
  const envPluginInstance = envPlugin(envOptions);
  plugins.unshift(reportPluginInstance, envPluginInstance);
  globalOptions.context.core.reporter = reportPluginInstance;

  const highPriorityPlugins = globalOptions.plugins.filter(
    (plugin) => plugin.priority === 'high',
  );
  const normalPriorityPlugins = globalOptions.plugins.filter(
    (plugin) => plugin.priority === 'normal',
  );
  const lowPriorityPlugins = globalOptions.plugins.filter(
    (plugin) => plugin.priority === 'low' || !plugin.priority,
  );

  const loadPlugins = async (plugins: ReturnType<DarePlugin>[]) => {
    const beforeHooks = plugins.map((plugin) => plugin.before);
    for (const beforeFn of beforeHooks) {
      beforeFn && (await beforeFn(globalOptions.context));
    }

    const mainHooks = plugins.map((plugin) => plugin.main);
    for (const mainFn of mainHooks) {
      const result = mainFn && (await mainFn(globalOptions.context));
      if (typeof result === 'function') {
        mainEffects.push(result);
      }
    }

    const afterHooks = plugins.map((plugin) => plugin.after);
    for (const afterFn of afterHooks) {
      afterFn && (await afterFn(globalOptions.context));
    }
  };

  await loadPlugins(highPriorityPlugins);
  await loadPlugins(normalPriorityPlugins);
  await loadPlugins(lowPriorityPlugins);

  if (NODE_ENV === 'development') {
    // @ts-expect-error
    window.mainEffects = mainEffects;
  }
};

export * from './core';
export * from './plugins';

if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error
  window.clearAll = () => {};
}
