import type { DarePlugin } from "../type";

export type ReportPluginOptions = {
  url: string;
};

export const reportPlugin: DarePlugin<ReportPluginOptions> = (_options) => {
  const options: ReportPluginOptions = {
    ..._options,
  };

  const report = (msg: unknown) => {
    if (!navigator.sendBeacon) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = `${options.url}?error=${encodeURIComponent(
          JSON.stringify({ data: msg })
        )}`;
        img.onload = resolve;
        img.onerror = reject;
      });
    }
    const data = JSON.stringify({ data: msg });
    return navigator.sendBeacon(options.url, data);
  };

  return {
    before: (context) => {
      context.core.report = report;
    },
  };
};
