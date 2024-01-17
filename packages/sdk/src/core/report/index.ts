import { fetchFn, safeFetchFn } from "./fetcher";
import { LocalDB } from "@sdk/utils";
import type { DarePlugin } from "../../type";

export type ReportPluginOptions = {
  url: string;
  storage?: {
    dbName?: string;
    storeName?: string;
  };
  timeout?: number;
};
const MAX_RETRY_TIME = 64 * 1000;
const RETRY_BASE_MS = 500;

export const reportPlugin: DarePlugin<ReportPluginOptions> = (_options) => {
  const options: ReportPluginOptions = {
    storage: {
      dbName: "dare",
      storeName: "dare-report",
    },
    ..._options,
  };

  const storage = window.indexedDB
    ? new LocalDB({
        dbName: options.storage?.dbName ?? "dare",
        storeName: options.storage?.storeName ?? "dare-report",
      })
    : null;

  const reporter = async (msg: unknown, count = 0) => {
    try {
      const id = storage ? await storage.set(msg) : "";
      const result = await fetchFn(options.url, msg);
      storage && (await storage.delete(id));
      return result;
    } catch (error) {
      return new Promise((resolve) => {
        const delay = Math.min(
          Math.pow(2, count++) * RETRY_BASE_MS + Math.random() * 100,
          MAX_RETRY_TIME
        );
        setTimeout(() => {
          resolve(reporter(msg, count));
        }, delay);
      });
    }
  };
  const send = (msg: unknown) => {
    return safeFetchFn(options.url, msg);
  };

  const reportStorage = async () => {
    const msg = await storage!.pop();
    if (msg) {
      await reporter(msg.value);
      reportStorage();
    }
  };

  return {
    version: "0.0.1",
    before: (context) => {
      context.core.report = reporter;
      context.core.sendBean = send;
    },
    main: () => {
      storage && reportStorage();
    },
    priority: "high",
    options,
  };
};
