/* eslint-disable @typescript-eslint/ban-ts-comment */
import { fetchFn, safeFetchFn } from './fetcher';
import { LocalDB } from '@sdk/utils';
import type { DarePlugin } from '../../type';

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
      dbName: 'dare',
      storeName: 'dare-report',
    },
    ..._options,
  };

  const storage = window.indexedDB
    ? new LocalDB({
        dbName: options.storage?.dbName ?? 'dare',
        storeName: options.storage?.storeName ?? 'dare-report',
      })
    : null;

  const reporter = async (msg: unknown, count = 0) => {
    try {
      const id = storage ? await storage.set(msg) : '';
      const result = await fetchFn(options.url, msg);
      storage && (await storage.delete(id));
      return result;
    } catch (error) {
      return new Promise((resolve) => {
        const delay = Math.min(
          Math.pow(2, count++) * RETRY_BASE_MS + Math.random() * 100,
          MAX_RETRY_TIME,
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

  let storageStatus = 'done';
  const reportStorage = async () => {
    if (storageStatus === 'pending') return;
    storageStatus = 'pending';
    let msg = await storage!.pop();
    while (msg !== null) {
      await reporter(msg.value);
      msg = await storage!.pop();
    }
    storageStatus = 'done';
  };

  const reporterOnce = async (msg: unknown) => {
    try {
      const id = storage ? await storage.set(msg) : '';
      const result = await fetchFn(options.url, msg);
      storage && (await storage.delete(id));
      return result;
    } catch (error) {
      reportStorage();
    }
  };

  return {
    version: '0.0.1',
    before: (context) => {
      context.core.report = reporterOnce;
      context.core.sendBean = send;
    },
    main: () => {
      storage && process.env.NODE_ENV !== 'development' && reportStorage();
    },
    priority: 'high',
    options,
  };
};
