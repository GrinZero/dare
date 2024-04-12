/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/ban-ts-comment */
import type { DarePlugin, DareContext, DarePluginInstance } from './type';
import { envPlugin, reportPlugin } from './core';

export type InitOptions = {
  plugins: ReturnType<DarePlugin>[];
  reporter: Parameters<typeof reportPlugin>[0];
  envOptions?: Parameters<typeof envPlugin>[0];
};
export type DareOptions = {
  context: DareContext;
  plugins: ReturnType<DarePlugin>[];
};

let instance: MonitoringSDK | null = null;
export const defineConfig = async (options: InitOptions) => {
  instance = new MonitoringSDK(options);
  return instance;
};

export * from './core';
export * from './plugins';

export class MonitoringSDK {
  plugins: ReturnType<DarePlugin>[];
  reporter: Parameters<typeof reportPlugin>[0];
  envOptions?: Parameters<typeof envPlugin>[0];
  context: DareContext;
  effects: Function[] = [];
  constructor(options: InitOptions) {
    this.plugins = options.plugins;
    this.reporter = options.reporter;
    this.envOptions = options.envOptions;

    const sessionID =
      'crypto' in window
        ? crypto.randomUUID()
        : `S` + Math.random().toString(36).slice(2);

    this.context = {
      state: {},
      core: {
        sessionID,
        report: async () => {
          console.warn('report is not init');
        },
        sendBean: () => {
          console.warn('sendBean is not init');
        },
      },
    } as unknown as DareContext;

    this.init();
  }

  executeLifecycle(
    lifecycle: keyof DarePluginInstance<unknown, unknown>,
    ...rest: unknown[]
  ) {
    this.plugins.forEach((plugin) => {
      const value = plugin[lifecycle];
      if (typeof value === 'function') {
        (value as (...args: unknown[]) => void)(...rest);
      }
    });
  }

  async init() {
    const { plugins, reporter, envOptions } = this;
    const reportPluginInstance = reportPlugin(reporter);
    this.context.core.reporter = reportPluginInstance;
    const envPluginInstance = envPlugin(envOptions);
    plugins.unshift(reportPluginInstance, envPluginInstance);

    const highPriorityPlugins = plugins.filter(
      (plugin) => plugin.priority === 'high',
    );
    const normalPriorityPlugins = plugins.filter(
      (plugin) => plugin.priority === 'normal',
    );
    const lowPriorityPlugins = plugins.filter(
      (plugin) => plugin.priority === 'low' || !plugin.priority,
    );

    const loadPlugins = async (plugins: ReturnType<DarePlugin>[]) => {
      const beforeHooks = plugins.map((plugin) => plugin.before);
      for (const beforeFn of beforeHooks) {
        beforeFn && (await beforeFn(this.context));
      }

      const mainHooks = plugins.map((plugin) => plugin.main);
      for (const mainFn of mainHooks) {
        mainFn && (await mainFn(this.context));
      }

      const afterHooks = plugins.map((plugin) => plugin.after);
      for (const afterFn of afterHooks) {
        afterFn && (await afterFn(this.context));
      }
    };

    await loadPlugins(highPriorityPlugins);
    await loadPlugins(normalPriorityPlugins);
    await loadPlugins(lowPriorityPlugins);

    const onLoad = () => this.executeLifecycle('onLoad', this.context);
    const onHidden = () => this.executeLifecycle('onHidden', this.context);
    const onShow = () => this.executeLifecycle('onShow', this.context);
    const onReady = () => this.executeLifecycle('onReady', this.context);
    const onResize = () => this.executeLifecycle('onResize', this.context);
    const onUnload = () => this.executeLifecycle('onUnload', this.context);
    const onNavigate = () => this.executeLifecycle('onNavigate', this.context);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onHidden();
      } else {
        onShow();
      }
    };

    window.addEventListener('load', onLoad);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('DOMContentLoaded', onReady);
    window.addEventListener('resize', onResize);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('popstate', onNavigate);

    this.effects.push(() => {
      window.removeEventListener('load', onLoad);
      window.removeEventListener('DOMContentLoaded', onReady);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('popstate', onNavigate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  async destroy() {
    this.effects.forEach((fn) => fn());
    this.plugins.forEach((plugin) => {
      if (plugin.effects) {
        plugin.effects.forEach((fn) => fn());
      }
    });
  }
}
