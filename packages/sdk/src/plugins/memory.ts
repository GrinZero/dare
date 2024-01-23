import type { DarePlugin, DareContext } from "../type";
import { LocalDB } from "../utils"; // 引入 LocalDB 类

export type MemoryPluginOptions = {
  interval?: number;
};

export const memoryPlugin: DarePlugin<MemoryPluginOptions> = (options = {}) => {
  const defaultOptions: MemoryPluginOptions = {
    interval: 10000,
  };

  const finalOptions = { ...defaultOptions, ...options };

  const localDB = new LocalDB({ dbName: "MemoryDB", storeName: "memoryUsage" });

  return {
    version: "0.0.1",
    after: async (context: DareContext) => {
      try {
        let memoryUsages = await localDB.pop();
        while (memoryUsages !== null) {
          if (memoryUsages.id.endsWith("-env")) {
            memoryUsages = await localDB.pop();
            continue;
          }
          const data = {
            memory: memoryUsages.value,
            env: (await localDB.get(`${memoryUsages.id}-env`)).value,
            sessionID: memoryUsages.id,
          };
          context.core.report({
            type: "memory",
            data,
          });
          memoryUsages = await localDB.pop();
        }
      } catch (error) {
        console.error("Error reporting memory usage: ", error);
      }
    },
    main: (context: DareContext) => {
      const sessionID = context.core.sessionID;

      const getMemoryUsage = () => {
        if ("performance" in window && "memory" in performance) {
          const { totalJSHeapSize, usedJSHeapSize, jsHeapSizeLimit } =
            performance.memory as {
              totalJSHeapSize: number;
              usedJSHeapSize: number;
              jsHeapSizeLimit: number;
            };
          return {
            memory: { totalJSHeapSize, usedJSHeapSize, jsHeapSizeLimit },
            time: Date.now(),
          };
        }
        return null;
      };

      const reportMemoryUsages = async (context: DareContext) => {
        const memoryUsages = await localDB.get(sessionID);
        const env = await localDB.get(`${sessionID}-env`);
        if (memoryUsages && env) {
          context.core.report({
            type: "memory",
            data: {
              memory: memoryUsages.value,
              env: env.value,
              sessionID,
            },
          });
        }
      };

      const intervalId = window.setInterval(async () => {
        const memoryUsage = getMemoryUsage();
        if (memoryUsage) {
          localDB.pushToArray(sessionID, memoryUsage);
          localDB.set(`${sessionID}-env`, context.core.getEnv());
        }
      }, finalOptions.interval);

      const done = () => {
        reportMemoryUsages(context);
      };

      window.addEventListener("beforeunload", done);

      // 可以添加其他触发上报的逻辑

      return () => {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
        }
        window.removeEventListener("beforeunload", done);
        // 清理其他事件监听器
      };
    },
  };
};
