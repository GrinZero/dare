/* eslint-disable @typescript-eslint/ban-types */

import { ReportPluginOptions } from './core/report';
import type { LocalDB } from './utils';

export type DareContext = {
  [key: string]: unknown;
  state: Record<string, unknown>;
  core: {
    storage: LocalDB | null;
    sessionID: string;
    report: (
      msg: { type: string; data?: unknown } & Record<string, unknown>,
    ) => Promise<unknown>;
    sendBean: (msg: unknown) => Promise<unknown> | unknown;
    reporter: DarePluginInstance<unknown, ReportPluginOptions>;
    getEnv: () => EnvData;
  };
};

type HasRequiredProps<T> = keyof {
  [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K];
} extends never
  ? false
  : true;

type DarePluginInstance<R, Op> = {
  before?: (context: DareContext) => R | Promise<R>;
  main?: (context: DareContext) => R | (() => void) | Promise<R> | Promise<() => void>;
  after?: (context: DareContext) => R | Promise<R>;
  priority?: 'high' | 'normal' | 'low';
  version: string;
  options?: Op;
};

export type DarePlugin<Op extends object = object, R = unknown> =
  HasRequiredProps<Op> extends true
    ? (options: Op) => DarePluginInstance<R, Op>
    : (options?: Op) => DarePluginInstance<R, Op>;

export type EnvData = {
  userAgent: string; // 浏览器用户代理字符串
  language: string; // 浏览器语言
  platform: string; // 平台（操作系统）
  screenWidth: number; // 屏幕宽度
  screenHeight: number; // 屏幕高度
  windowWidth: number; // 浏览器窗口宽度
  windowHeight: number; // 浏览器窗口高度
  connection: {
    downlink: number; // 下行速度
    effectiveType: string; // 网络连接类型
    rtt: number; // 往返时间
  } | null; // 网络信息
  location: string; // 当前页面 URL
  time: string; // 当前时间
  timezone: string; // 时区
};
