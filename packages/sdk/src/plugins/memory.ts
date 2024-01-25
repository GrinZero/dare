import type { DarePlugin, DareContext } from '../type';
import { LocalDB } from '../utils'; // 引入 LocalDB 类

export type MemoryPluginOptions = {
  interval?: number;
};

export interface MemoryData {
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export const memoryPlugin: DarePlugin<MemoryPluginOptions> = (options = {}) => {
  const defaultOptions: MemoryPluginOptions = {
    interval: 10000,
  };

  const finalOptions = { ...defaultOptions, ...options };

  const localDB = new LocalDB({ dbName: 'dare-memory', storeName: 'memory' });
  return {
    version: '0.0.1',
    main: async (context: DareContext) => {
      try {
        let memoryUsages = await localDB.pop<
          {
            memory: MemoryData;
            time: number;
          }[]
        >();
        while (memoryUsages !== null) {
          if (memoryUsages.id.endsWith('-env')) {
            memoryUsages = await localDB.pop();
            continue;
          }

          const heapsizelimit = memoryUsages.value[0].memory.jsHeapSizeLimit;
          const data = {
            memory: memoryUsages.value.map((item) => ({
              memory: {
                totalJSHeapSize: item.memory.totalJSHeapSize,
                usedJSHeapSize: item.memory.usedJSHeapSize,
              },
              time: item.time,
            })),
            env: (await localDB.get(`${memoryUsages.id}-env`)).value,
            jsHeapSizeLimit: heapsizelimit,
            sessionID: memoryUsages.id,
          };
          context.core.report({
            type: 'memory',
            data,
          });
          memoryUsages = await localDB.pop();
        }
      } catch (error) {
        console.error('Error reporting memory usage: ', error);
      }
    },
    after: (context: DareContext) => {
      const sessionID = context.core.sessionID;

      const getMemoryUsage = () => {
        if ('performance' in window && 'memory' in performance) {
          const { totalJSHeapSize, usedJSHeapSize, jsHeapSizeLimit } =
            performance.memory as MemoryData;
          return {
            memory: { totalJSHeapSize, usedJSHeapSize, jsHeapSizeLimit },
            time: Date.now(),
          };
        }
        return null;
      };

      const reportMemoryUsages = async (context: DareContext) => {
        const memoryUsages = await localDB.get<
          {
            memory: MemoryData;
            time: number;
          }[]
        >(sessionID);
        const env = await localDB.get(`${sessionID}-env`);
        if (memoryUsages && env) {
          const heapsizelimit = memoryUsages.value[0].memory.jsHeapSizeLimit;
          const data = {
            memory: memoryUsages.value.map((item) => ({
              memory: {
                totalJSHeapSize: item.memory.totalJSHeapSize,
                usedJSHeapSize: item.memory.usedJSHeapSize,
              },
              time: item.time,
            })),
            env: env.value,
            jsHeapSizeLimit: heapsizelimit,
            sessionID,
          };

          context.core.report({
            type: 'memory',
            data,
          });
        }
      };

      let timeoutId: number | undefined;
      const measureMemory = () => {
        const memoryUsage = getMemoryUsage();
        if (memoryUsage) {
          localDB.pushToArray(sessionID, memoryUsage);
          localDB.set(`${sessionID}-env`, context.core.getEnv());
        }
        const interval = -Math.log(Math.random()) * finalOptions.interval!;
        timeoutId = window.setTimeout(measureMemory, interval);
      };

      measureMemory();

      const done = () => {
        reportMemoryUsages(context);
      };

      window.addEventListener('beforeunload', done);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('beforeunload', done);
      };
    },
  };
};
