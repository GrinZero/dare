import type { DarePlugin } from "./type";

export type ErrorPluginOptions = {
  onError?: (error: {
    msg: unknown;
    url: unknown;
    row: unknown;
    col: unknown;
    error: unknown;
  }) => void;
};

export const errorPlugin: DarePlugin<ErrorPluginOptions> = (_options: ErrorPluginOptions) => {
  const options: ErrorPluginOptions = {};
  Object.assign(options, _options);

  const handleError = (
    msg: unknown,
    url: unknown,
    row: unknown,
    col: unknown,
    error: unknown
  ) => {
    if (options.onError) {
      options.onError({ msg, url, row, col, error });
    }
  };

  return () => {
    Object.assign(options, options);

    const windowOnError = window.onerror;
    window.onerror = (...args) => {
      handleError(...args);
      if (windowOnError) {
        windowOnError(...args);
      }
    };
  };
};
