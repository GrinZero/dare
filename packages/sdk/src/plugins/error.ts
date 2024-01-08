import type { DarePlugin } from "../type";

export type ErrorPluginOptions = {
  onError?: (error: ErrorEvent) => void;
};

export const errorPlugin: DarePlugin<ErrorPluginOptions> = (_options) => {
  const options: ErrorPluginOptions = {};
  Object.assign(options, _options);

  const SetConstructor: WeakSetConstructor | SetConstructor =
    window.WeakSet || window.Set;
  const errorSet: WeakSet<object> | Set<object> = new SetConstructor<object>();

  const add = (obj: object) => {
    if (errorSet instanceof Set && errorSet.size > 100) {
      errorSet.clear();
    }
    errorSet.add(obj);
  };
  return {
    main: (context) => {
      const handleError = (data: ErrorEvent) => {
        if (errorSet.has(data.error)) {
          return;
        }
        add(data.error);
        options.onError && options.onError(data);
        
        context.core.report({
          type: "error",
          data: {
            message: data.message,
            stack: data.error.stack,
          },
        });
      };
      const handleReject = (event: PromiseRejectionEvent) => {
        const { reason } = event;
        if (errorSet.has(reason)) {
          return;
        }
        add(reason);
        handleError(
          new ErrorEvent("unhandledrejection", {
            message: reason,
            error: reason,
          })
        );
      };

      window.addEventListener("error", handleError);
      window.addEventListener("unhandledrejection", handleReject);
      return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener("unhandledrejection", handleReject);
      };
    },
  };
};
