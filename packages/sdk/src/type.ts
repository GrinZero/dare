export type DareContext = {
  [key: string]: unknown;
  state: Record<string, unknown>;
  core: {
    report: (msg: unknown) => unknown | Promise<unknown>;
  };
};

type HasRequiredProps<T> = {
  [K in keyof T]: Required<Pick<T, K>> extends Pick<T, K> ? true : false;
}[keyof T] extends true
  ? true
  : false;

type DarePluginMethods<R> = {
  before?: (context: DareContext) => R;
  main?: (context: DareContext) => R | (() => void);
};

export type DarePlugin<
  Op extends object = object,
  R = unknown,
> = HasRequiredProps<Op> extends true
  ? (options: Op) => DarePluginMethods<R>
  : (options?: Op) => DarePluginMethods<R>;
