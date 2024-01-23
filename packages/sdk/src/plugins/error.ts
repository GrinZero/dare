/* eslint-disable @typescript-eslint/no-explicit-any,prefer-rest-params */
import type { DarePlugin } from "../type";

export type ErrorPluginOptions = {
  onError?: (error: ErrorEvent) => void;
};

export const errorPlugin: DarePlugin<ErrorPluginOptions> = (_options) => {
  const options: ErrorPluginOptions = {};
  Object.assign(options, _options);

  const errorSet = new Set();

  const add = (obj: unknown) => {
    if (errorSet.size > 100) {
      errorSet.clear();
    }
    errorSet.add(obj);
  };

  return {
    version: "0.0.1",
    main: (context) => {
      const url = context.core.reporter.options?.url;

      const handleError = (data: ErrorEvent) => {
        if (errorSet.has(data.error?.stack ?? data.error)) {
          // 如果是上报错误或者已经处理过的错误，则不再处理
          return;
        }
        add(data.error?.stack ?? data.error);
        options.onError && options.onError(data);

        context.core.report({
          type: "error",
          data: {
            message: data.message,
            stack: data.error.stack,
            env: context.core.getEnv(),
          },
        });
      };
      const handleReject = (event: PromiseRejectionEvent) => {
        const { reason } = event;
        handleError(
          new ErrorEvent("unhandledrejection", {
            message: reason,
            error: reason,
          })
        );
      };

      // 拦截 XMLHttpRequest 错误
      const originalXHRSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function () {
        const args = arguments as any;
        const fn = (error: ProgressEvent<XMLHttpRequestEventTarget>) => {
          if (args[0] === url) {
            this.removeEventListener("error", fn)
            return;
          }
          handleError(
            new ErrorEvent("xhrerror", {
              message: "XMLHttpRequest request failed",
              error,
            })
          );
          this.removeEventListener("error", fn);
        };
        this.addEventListener("error", fn);
        originalXHRSend.apply(this, args);
      };

      const originalFetch = window.fetch;
      window.fetch = function (...args) {
        return originalFetch.apply(this, args).catch((error) => {
          if (args[0] === url) {
            throw error;
          }
          handleError(
            new ErrorEvent("fetcherror", {
              message: "Fetch request failed",
              error,
            })
          );
          throw error; // 重新抛出以确保不会打破 Promise 链
        });
      };

      window.addEventListener("error", handleError);
      window.addEventListener("unhandledrejection", handleReject);
      return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener("unhandledrejection", handleReject);
        XMLHttpRequest.prototype.send = originalXHRSend;
        window.fetch = originalFetch;
      };
    },
  };
};
