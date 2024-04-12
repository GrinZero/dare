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
    version: "0.0.1",
    main: (context) => {
      const FCPBbsercer = new PerformanceObserver((list) => {
        for (const entry of list.getEntriesByName("first-contentful-paint")) {
          console.log("FCP candidate:", entry.startTime, entry);
        }
        context.core.report(list.getEntries());
      });
      FCPBbsercer.observe({
        entryTypes: ["navigation", "resource", "paint"],
        buffered: true,
      });

      const LCPObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          console.log("LCP candidate:", entry.startTime, entry);
        }
      });
      LCPObserver.observe({ type: "largest-contentful-paint", buffered: true });

      const CLSObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          console.log('CLS:', entry);
        }
      })
      CLSObserver.observe({type: 'layout-shift', buffered: true});

      const FIDObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          console.log('FID:', entry);
        }
      })
      FIDObserver.observe({type: 'first-input', buffered: true});

      return () => {
        FCPBbsercer.disconnect();
        LCPObserver.disconnect();
        CLSObserver.disconnect();
        FIDObserver.disconnect();
      };
    },
    effects: [],
    priority: "high",
  };
};
