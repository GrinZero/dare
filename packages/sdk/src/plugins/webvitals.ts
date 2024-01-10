import type { DarePlugin } from "../type";

export type WebVitalsPluginOptions = {
  onData?: (error: typeof performance.timing) => void;
};

export const webVitalsPlugin: DarePlugin<WebVitalsPluginOptions> = (
  _options
) => {
  const options: WebVitalsPluginOptions = {};
  Object.assign(options, _options);

  return {
    main: (context) => {
      const obsercer = new PerformanceObserver((list) => {
        console.log(list.getEntries());
        context.core.report(list.getEntries());
      });
      obsercer.observe({ entryTypes: ["navigation", "resource", "paint"] });
    },
    priority: "high",
  };
};
