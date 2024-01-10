import md5 from "crypto-js/md5";

// 基于indexedDB实现静默离线存储
export class LocalDB {
  private db: Promise<IDBDatabase>;
  private storeName: string;
  constructor({ dbName, storeName }: { dbName: string; storeName: string }) {
    const request = indexedDB.open(dbName);
    this.storeName = storeName;
    this.db = new Promise((resolve, reject) => {
      request.onerror = () => {
        reject(null);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        resolve(request.result);
        if (!request.result.objectStoreNames.contains(storeName)) {
          request.result.createObjectStore(storeName, { keyPath: "id" });
        }
      };
    });
  }

  public async set(value: unknown) {
    const idb = await this.db;
    return new Promise<string>((resolve, reject) => {
      const valueStr = JSON.stringify(value);
      const id = md5(valueStr).toString();
      const transaction = idb.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      store.put({ id, value });
      transaction.oncomplete = () => {
        resolve(id);
      };
      transaction.onerror = () => {
        reject(null);
      };
    });
  }

  public async get(id: string) {
    const idb = await this.db;
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(null);
      };
    });
  }

  public async delete(id: string) {
    const idb = await this.db;
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      store.delete(id);
      transaction.oncomplete = () => {
        resolve(null);
      };
      transaction.onerror = () => {
        reject(null);
      };
    });
  }

  public async pop() {
    const idb = await this.db;
    return new Promise<{ id: string; value: unknown } | null>(
      (resolve, reject) => {
        const transaction = idb.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const { value } = cursor;
            store.delete(cursor.primaryKey);
            resolve(value);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          reject(null);
        };
      }
    );
  }

  public async clear() {
    const idb = await this.db;
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(["dare"], "readwrite");
      const store = transaction.objectStore("dare");
      store.clear();
      transaction.oncomplete = () => {
        resolve(null);
      };
      transaction.onerror = () => {
        reject(null);
      };
    });
  }
}
