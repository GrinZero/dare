export type DarePlugin<Op = unknown, R = unknown> = (
  options: Op
) => (context: unknown) => R;
