/* eslint-disable @typescript-eslint/ban-types */
export type DareContext = {
  [key: string]: unknown;
  state: Record<string, unknown>;
  core: {
    report: (msg: unknown) => Promise<unknown>;
    sendBean: (msg: unknown) => Promise<unknown> | unknown;
  };
};

type HasRequiredProps<T> = (keyof
  { [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K] }
) extends never ? false : true

type DarePluginInstance<R> = {
  before?: (context: DareContext) => R;
  main?: (context: DareContext) => R | (() => void);
  priority?: "high" | "normal" | "low";
};

export type DarePlugin<
  Op extends object = object,
  R = unknown,
> = HasRequiredProps<Op> extends true
  ? (options: Op) => DarePluginInstance<R>
  : (options?: Op) => DarePluginInstance<R>;
